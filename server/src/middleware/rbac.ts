import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: '未认证' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: '权限不足',
        requiredRoles: roles,
        yourRole: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

export const canAccessShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: '未认证' });
      return;
    }

    // Admin can access all shipments
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const shipmentId = parseInt(req.params.id, 10);
    if (isNaN(shipmentId)) {
      res.status(400).json({ message: '无效的运单ID' });
      return;
    }

    // Check if the shipment belongs to the user
    const result = await query(
      'SELECT created_by FROM shipments WHERE id = $1',
      [shipmentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '运单不存在' });
      return;
    }

    if (result.rows[0].created_by !== req.user.userId) {
      res.status(403).json({ message: '无权访问此运单' });
      return;
    }

    next();
  } catch (error) {
    console.error('RBAC check failed:', error);
    res.status(500).json({ message: '权限检查失败' });
  }
};
