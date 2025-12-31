import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Verify token manually để handle cả admin và user tokens
const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const authMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Nếu là admin token (có isAdmin: true)
    if (payload.isAdmin) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, isActive: true },
      });

      if (!admin) {
        return res.status(401).json({ error: 'Unauthorized - Admin not found' });
      }

      if (!admin.isActive) {
        return res.status(403).json({ error: 'Admin account is disabled' });
      }

      req.user = payload;
      return next();
    }

    // Normal user token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isBanned: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    
    next();
  } catch {
    next();
  }
};

export const adminMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Nếu token đã có isAdmin: true thì đã được verify ở authMiddleware
    if (req.user.isAdmin) {
      return next();
    }

    // Fallback: check trong database (cho normal user xem có phải admin không)
    const adminUser = await prisma.adminUser.findUnique({
      where: { userId: req.user.userId },
    });

    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(403).json({ error: 'Forbidden' });
  }
};
