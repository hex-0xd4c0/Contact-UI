import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: '未提供认证令牌' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ message: '认证令牌格式错误' });
      return;
    }

    const token = parts[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: '认证令牌已过期', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: '无效的认证令牌', code: 'INVALID_TOKEN' });
      return;
    }
    res.status(500).json({ message: '认证服务异常' });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const decoded = verifyAccessToken(parts[1]);
        req.user = decoded;
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
};
