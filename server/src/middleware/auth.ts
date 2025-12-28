import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../lib/auth.js';
import prisma from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: TokenPayload & { isAdmin?: boolean };
}

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
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Check if user exists and is not banned
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
      const payload = verifyAccessToken(token);
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
