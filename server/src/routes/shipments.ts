import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /shipments - Paginated list with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const size = Math.min(Math.max(parseInt(req.query.size as string) || 10, 1), 100);
    const offset = (page - 1) * size;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Non-admin users can only see their own shipments
    if (!isAdmin) {
      conditions.push(`s.created_by = $${paramIndex++}`);
      params.push(userId);
    }

    if (req.query.status) {
      conditions.push(`s.status = $${paramIndex++}`);
      params.push(req.query.status);
    }

    if (req.query.shipmentId) {
      conditions.push(`s.shipment_id ILIKE $${paramIndex++}`);
      params.push(`%${req.query.shipmentId}%`);
    }

    if (req.query.origin) {
      conditions.push(`(s.origin_city ILIKE $${paramIndex++} OR s.origin_country ILIKE $${paramIndex++})`);
      params.push(`%${req.query.origin}%`, `%${req.query.origin}%`);
    }

    if (req.query.destination) {
      conditions.push(`(s.dest_city ILIKE $${paramIndex++} OR s.dest_country ILIKE $${paramIndex++})`);
      params.push(`%${req.query.destination}%`, `%${req.query.destination}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM shipments s ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    // Get paginated data
    const dataResult = await query(
      `SELECT
        s.id, s.shipment_id as "shipmentId",
        s.origin_city || ', ' || s.origin_country as origin,
        s.dest_city || ', ' || s.dest_country as destination,
        s.quantity, s.transport_method as "transportMethod", s.carrier,
        s.weight_kg as "weightKg", s.status, s.current_location as "currentLocation",
        s.eta, s.departure_date as "departureDate", s.created_by as "createdBy",
        s.created_at as "createdAt"
      FROM shipments s
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, size, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      size,
    });
  } catch (error) {
    console.error('List shipments error:', error);
    res.status(500).json({ message: '获取运单列表失败' });
  }
});

// GET /shipments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的运单ID' });
      return;
    }

    const result = await query(
      `SELECT
        id, shipment_id as "shipmentId",
        origin_city || ', ' || origin_country as origin,
        dest_city || ', ' || dest_country as destination,
        quantity, transport_method as "transportMethod", carrier,
        weight_kg as "weightKg", status, current_location as "currentLocation",
        eta, departure_date as "departureDate", created_by as "createdBy",
        created_at as "createdAt"
      FROM shipments
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '运单不存在' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ message: '获取运单详情失败' });
  }
});

// GET /shipments/:id/timeline
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的运单ID' });
      return;
    }

    const result = await query(
      `SELECT
        id, shipment_id as "shipmentId", stage, status,
        location, event_time as "eventTime", notes
      FROM shipment_timeline
      WHERE shipment_id = $1
      ORDER BY event_time ASC`,
      [id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ message: '获取运输轨迹失败' });
  }
});

// GET /shipments/:id/current-location
router.get('/:id/current-location', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的运单ID' });
      return;
    }

    // Try Redis cache first
    const cacheKey = `shipment:location:${id}`;
    const cached = await getCache<{ location: string }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Query database
    const result = await query(
      'SELECT current_location as location FROM shipments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '运单不存在' });
      return;
    }

    const locationData = { location: result.rows[0].location };

    // Cache for 15 minutes
    await setCache(cacheKey, locationData, 900);

    res.json(locationData);
  } catch (error) {
    console.error('Get current location error:', error);
    res.status(500).json({ message: '获取当前位置失败' });
  }
});

export default router;
