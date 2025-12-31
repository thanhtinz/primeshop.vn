import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma.js';
import { hashPassword } from '../../lib/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// Validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  phone: z.string().optional(),
});

// Create user (Admin only)
router.post('/create', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  // Check if current user is authenticated
  const currentUserId = authReq.user?.userId;
  if (!currentUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // TODO: Add proper admin check when role system is implemented
  
  const { email, password, displayName, phone } = createUserSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      displayName,
      phone: phone || null,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    user,
  });
}));

export default router;
