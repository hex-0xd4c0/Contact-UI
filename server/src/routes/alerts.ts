import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// GET /alerts - Paginated list with filters
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

    // Non-admin users can only see their own alerts
    if (!isAdmin) {
      conditions.push(`ra.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (req.query.severity) {
      conditions.push(`ra.severity = $${paramIndex++}`);
      params.push(req.query.severity);
    }

    if (req.query.status) {
      conditions.push(`ra.status = $${paramIndex++}`);
      params.push(req.query.status);
    }

    if (req.query.type) {
      conditions.push(`ra.alert_type = $${paramIndex++}`);
      params.push(req.query.type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM risk_alerts ra ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    // Get paginated data
    const dataResult = await query(
      `SELECT
        ra.id, ra.shipment_id as "shipmentId",
        s.shipment_id as "shipmentCode",
        ra.alert_type as "alertType", ra.severity,
        ra.title, ra.message as "description", ra.status,
        ra.acknowledged_by as "acknowledgedBy",
        ra.acknowledged_at as "acknowledgedAt",
        ra.resolved_by as "resolvedBy",
        ra.resolved_at as "resolvedAt",
        ra.created_at as "detectedAt"
      FROM risk_alerts ra
      LEFT JOIN shipments s ON ra.shipment_id = s.id
      ${whereClause}
      ORDER BY ra.created_at DESC
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
    console.error('List alerts error:', error);
    res.status(500).json({ message: '获取告警列表失败' });
  }
});

// GET /alerts/stats - Alert statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (!isAdmin) {
      conditions.push(`ra.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE ra.status = 'active')::int as active,
        COUNT(*) FILTER (WHERE ra.severity = 'critical')::int as critical,
        COUNT(*) FILTER (WHERE ra.severity = 'high')::int as high,
        COUNT(*) FILTER (WHERE ra.severity = 'medium')::int as medium,
        COUNT(*) FILTER (WHERE ra.severity = 'low')::int as low
      FROM risk_alerts ra ${whereClause}`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ message: '获取告警统计失败' });
  }
});

// POST /alerts/:id/acknowledge
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的告警ID' });
      return;
    }

    // Check alert exists and user has permission
    const alert = await query(
      'SELECT user_id, status FROM risk_alerts WHERE id = $1',
      [id]
    );

    if (alert.rows.length === 0) {
      res.status(404).json({ message: '告警不存在' });
      return;
    }

    if (alert.rows[0].user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ message: '无权确认此告警' });
      return;
    }

    if (alert.rows[0].status !== 'active') {
      res.status(400).json({ message: '告警已被确认或已解决' });
      return;
    }

    const result = await query(
      `UPDATE risk_alerts
       SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW()
       WHERE id = $2
       RETURNING
         id, shipment_id as "shipmentId",
         alert_type as "alertType", severity,
         title, message as "description", status,
         acknowledged_by as "acknowledgedBy",
         acknowledged_at as "acknowledgedAt",
         created_at as "detectedAt"`,
      [req.user!.userId, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ message: '确认告警失败' });
  }
});

// POST /alerts/:id/resolve
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: '无效的告警ID' });
      return;
    }

    // Check alert exists and user has permission
    const alert = await query(
      'SELECT user_id, status FROM risk_alerts WHERE id = $1',
      [id]
    );

    if (alert.rows.length === 0) {
      res.status(404).json({ message: '告警不存在' });
      return;
    }

    if (alert.rows[0].user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ message: '无权解决此告警' });
      return;
    }

    if (alert.rows[0].status === 'resolved') {
      res.status(400).json({ message: '告警已被解决' });
      return;
    }

    const result = await query(
      `UPDATE risk_alerts
       SET status = 'resolved', resolved_by = $1, resolved_at = NOW()
       WHERE id = $2
       RETURNING
         id, shipment_id as "shipmentId",
         alert_type as "alertType", severity,
         title, message as "description", status,
         resolved_by as "resolvedBy",
         resolved_at as "resolvedAt",
         created_at as "detectedAt"`,
      [req.user!.userId, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ message: '解决告警失败' });
  }
});

// POST /alerts - Create alert (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { shipmentId, alertType, severity, title, message, userId } = req.body;

    if (!shipmentId || !alertType || !severity || !title || !message) {
      res.status(400).json({ message: '缺少必要参数' });
      return;
    }

    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(severity)) {
      res.status(400).json({ message: '无效的严重级别' });
      return;
    }

    const result = await query(
      `INSERT INTO risk_alerts (shipment_id, alert_type, severity, title, message, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
       RETURNING
         id, shipment_id as "shipmentId",
         alert_type as "alertType", severity,
         title, message as "description", status,
         created_at as "detectedAt"`,
      [parseInt(shipmentId, 10), alertType, severity, title, message, userId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: '创建告警失败' });
  }
});

export default router;
