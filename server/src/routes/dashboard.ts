import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { getCache, setCache } from '../config/redis';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// GET /dashboard/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cacheKey = `dashboard:metrics:${userId}`;

    // Try cache first
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const isAdmin = req.user!.role === 'admin';
    const userFilter = isAdmin ? '' : 'WHERE created_by = $1';
    const userParams = isAdmin ? [] : [userId];

    // Query database
    const result = await query(`
      SELECT
        COUNT(*)::int as "totalShipments",
        COUNT(*) FILTER (WHERE status = 'in_transit')::int as "inTransit",
        COUNT(*) FILTER (WHERE status = 'delayed')::int as "delayed",
        COUNT(*) FILTER (WHERE status = 'delivered')::int as "delivered"
      FROM shipments
      ${userFilter}
    `, userParams);

    const metrics = result.rows[0];

    // Calculate percent change (compare with last month)
    const lastMonthResult = await query(`
      SELECT COUNT(*)::int as count
      FROM shipments
      ${isAdmin ? 'WHERE' : 'WHERE created_by = $1 AND'} created_at >= NOW() - INTERVAL '30 days'
    `, isAdmin ? [] : [userId]);

    const previousMonthResult = await query(`
      SELECT COUNT(*)::int as count
      FROM shipments
      ${isAdmin ? 'WHERE' : 'WHERE created_by = $1 AND'} created_at >= NOW() - INTERVAL '60 days'
        AND created_at < NOW() - INTERVAL '30 days'
    `, isAdmin ? [] : [userId]);

    const currentCount = lastMonthResult.rows[0].count;
    const previousCount = previousMonthResult.rows[0].count;
    const percentChange = previousCount > 0
      ? Math.round(((currentCount - previousCount) / previousCount) * 100)
      : 0;

    const responseData = {
      ...metrics,
      percentChange,
    };

    // Cache for 5 minutes
    await setCache(cacheKey, responseData, 300);

    res.json(responseData);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ message: '获取仪表盘数据失败' });
  }
});

// GET /dashboard/recent-shipments
router.get('/recent-shipments', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const isAdmin = req.user!.role === 'admin';

    const result = await query(`
      SELECT
        id, shipment_id as "shipmentId", origin_city || ', ' || origin_country as origin,
        dest_city || ', ' || dest_country as destination,
        quantity, transport_method as "transportMethod", carrier,
        weight_kg as "weightKg", status, current_location as "currentLocation",
        eta, departure_date as "departureDate", created_by as "createdBy",
        created_at as "createdAt"
      FROM shipments
      ${isAdmin ? '' : 'WHERE created_by = $1'}
      ORDER BY created_at DESC
      LIMIT $${isAdmin ? 1 : 2}
    `, isAdmin ? [limit] : [userId, limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Recent shipments error:', error);
    res.status(500).json({ message: '获取最近运单失败' });
  }
});

// GET /dashboard/recent-alerts
router.get('/recent-alerts', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    const isAdmin = req.user!.role === 'admin';
    const conditions = isAdmin ? [] : ['s.created_by = $1'];
    const params: any[] = isAdmin ? [] : [userId];
    let paramIndex = isAdmin ? 1 : 2;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT
        ra.id, ra.shipment_id as "shipmentId", ra.alert_type as "alertType",
        ra.severity, ra.title, ra.message, ra.status,
        ra.created_at as "createdAt"
      FROM risk_alerts ra
      LEFT JOIN shipments s ON ra.shipment_id = s.id
      ${whereClause}
      ORDER BY ra.created_at DESC
      LIMIT $${paramIndex}
    `, [...params, limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Recent alerts error:', error);
    res.status(500).json({ message: '获取最近告警失败' });
  }
});

export default router;
