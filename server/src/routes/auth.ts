import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { 
  hashPassword, 
  comparePassword, 
  generateTokens, 
  verifyRefreshToken,
  TokenPayload 
} from '../lib/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, displayName } = registerSchema.parse(req.body);

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
      displayName: displayName || email.split('@')[0],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
  const { accessToken, refreshToken } = generateTokens(tokenPayload);

  // Save refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    user,
    accessToken,
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      displayName: true,
      avatarUrl: true,
      isBanned: true,
      banReason: true,
    },
  });

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isBanned) {
    return res.status(403).json({ 
      error: 'Account is banned',
      reason: user.banReason 
    });
  }

  // Verify password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
  const { accessToken, refreshToken } = generateTokens(tokenPayload);

  // Save refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { password: _, isBanned: __, banReason: ___, ...userData } = user;

  res.json({
    user: userData,
    accessToken,
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  // Verify token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      isBanned: true,
    },
  });

  if (!user || user.isBanned) {
    return res.status(401).json({ error: 'User not found or banned' });
  }

  // Generate new tokens
  const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
  const tokens = generateTokens(tokenPayload);

  // Delete old refresh token and create new one
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt,
    },
  });

  // Set new refresh token cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { isBanned: _, ...userData } = user;

  res.json({
    user: userData,
    accessToken: tokens.accessToken,
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  // Clear cookie
  res.clearCookie('refreshToken');

  res.json({ message: 'Logged out successfully' });
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      bio: true,
      balance: true,
      points: true,
      level: true,
      isPrime: true,
      primeExpiresAt: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user is admin
  const adminUser = await prisma.adminUser.findUnique({
    where: { userId: user.id },
  });

  res.json({
    ...user,
    isAdmin: !!adminUser,
    isSuperAdmin: adminUser?.isSuperAdmin || false,
  });
}));

// Change password
router.post('/change-password', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
  }).parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { password: true },
  });

  if (!user?.password) {
    return res.status(400).json({ error: 'Cannot change password for OAuth accounts' });
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { password: hashedPassword },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.userId },
  });

  res.json({ message: 'Password changed successfully' });
}));

export default router;
