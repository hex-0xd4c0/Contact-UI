import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ebike-logistics-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  userId: number;
  role: string;
}

export interface RefreshTokenPayload {
  userId: number;
}

export const generateAccessToken = (userId: number, role: string): string => {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY as any,
  };
  return jwt.sign({ userId, role }, JWT_SECRET, options);
};

export const generateRefreshToken = (userId: number): string => {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY as any,
  };
  return jwt.sign({ userId }, JWT_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
};
