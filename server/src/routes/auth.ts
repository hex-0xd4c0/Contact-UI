import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database';
import redis from '../config/redis';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  companyName: z.string().min(2, '公司名称至少2个字符'),
});

const loginSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, companyName } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: '该邮箱已被注册' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, company_name, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, email, company_name, role, created_at`,
      [email, passwordHash, companyName]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, 'customer');
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redis.setex(
      `session:refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        role: 'customer',
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const result = await query(
      `SELECT id, email, password_hash, company_name, role
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redis.setex(
      `session:refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: '缺少刷新令牌' });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if token exists in Redis
    const storedToken = await redis.get(`session:refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      res.status(401).json({ message: '刷新令牌已失效' });
      return;
    }

    // Get user role
    const result = await query(
      `SELECT id, role FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const user = result.rows[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update Redis
    await redis.setex(
      `session:refresh:${user.id}`,
      7 * 24 * 60 * 60,
      newRefreshToken
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: '刷新令牌已过期，请重新登录' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: '无效的刷新令牌' });
      return;
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ message: '令牌刷新失败' });
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await redis.del(`session:refresh:${req.user.userId}`);
    }
    res.json({ message: '已成功登出' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: '登出失败' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, company_name, role, created_at
       FROM users
       WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      companyName: user.company_name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

export default router;
