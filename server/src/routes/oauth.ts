/**
 * OAuth Routes
 * Handles Google and Discord OAuth authentication
 */

import { Router, Request, Response } from 'express';
import { googleOAuth, discordOAuth } from '../services/oauthService.js';
import { generateTokens, TokenPayload } from '../lib/auth.js';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// Helper to create auth session and redirect
const createAuthSession = async (res: Response, userId: string, email: string, redirectPath: string = '/') => {
  const tokenPayload: TokenPayload = { userId, email };
  const { accessToken, refreshToken } = generateTokens(tokenPayload);

  // Save refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await prisma.refreshToken.create({
    data: {
      userId,
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

  // Redirect with access token in URL (will be handled by frontend)
  const redirectUrl = new URL(redirectPath, FRONTEND_URL);
  redirectUrl.searchParams.set('access_token', accessToken);
  return res.redirect(redirectUrl.toString());
};

// ================================
// GOOGLE OAUTH
// ================================

// Initiate Google OAuth - Login
router.get('/google', asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string || undefined;
  const authUrl = await googleOAuth.getAuthUrl(state, false);
  res.redirect(authUrl);
}));

// Initiate Google OAuth - Link account (requires auth)
router.get('/link/google', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const authUrl = await googleOAuth.getAuthUrl(req.user?.userId, true);
  res.redirect(authUrl);
}));

// Google OAuth Callback (handled by frontend, this is for server-side flow)
router.get('/google/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/auth?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/auth?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokens = await googleOAuth.getTokens(code as string);
    
    // Get user info
    const googleUser = await googleOAuth.getUserInfo(tokens.access_token);

    // Parse state to check if this is a link operation
    let linkMode = false;
    let existingUserId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(state as string);
        linkMode = parsed.linkMode;
        existingUserId = parsed.state;
      } catch {}
    }

    if (linkMode && existingUserId) {
      // Link mode - link Google to existing account
      await googleOAuth.linkAccount(existingUserId, googleUser);
      return res.redirect(`${FRONTEND_URL}/settings?success=google_linked`);
    }

    // Login/Register mode
    const user = await googleOAuth.findOrCreateUser(googleUser);
    return createAuthSession(res, user.id, user.email, '/oauth/success');
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    const errorMessage = err.message || 'oauth_failed';
    return res.redirect(`${FRONTEND_URL}/auth?error=${encodeURIComponent(errorMessage)}`);
  }
}));

// Unlink Google account
router.post('/unlink/google', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await googleOAuth.unlinkAccount(req.user!.userId);
    res.json({ success: true, message: 'Google account unlinked' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}));

// ================================
// DISCORD OAUTH
// ================================

// Initiate Discord OAuth - Login
router.get('/discord', asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string || undefined;
  const authUrl = await discordOAuth.getAuthUrl(state, false);
  res.redirect(authUrl);
}));

// Initiate Discord OAuth - Link account (requires auth)
router.get('/link/discord', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const authUrl = await discordOAuth.getAuthUrl(req.user?.userId, true);
  res.redirect(authUrl);
}));

// Discord OAuth Callback
router.get('/discord/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/auth?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/auth?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokens = await discordOAuth.getTokens(code as string);
    
    // Get user info
    const discordUser = await discordOAuth.getUserInfo(tokens.access_token);

    // Parse state to check if this is a link operation
    let linkMode = false;
    let existingUserId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(state as string);
        linkMode = parsed.linkMode;
        existingUserId = parsed.state;
      } catch {}
    }

    if (linkMode && existingUserId) {
      // Link mode - link Discord to existing account
      await discordOAuth.linkAccount(existingUserId, discordUser);
      return res.redirect(`${FRONTEND_URL}/settings?success=discord_linked`);
    }

    // Login/Register mode
    const user = await discordOAuth.findOrCreateUser(discordUser);
    return createAuthSession(res, user.id, user.email, '/oauth/success');
  } catch (err: any) {
    console.error('Discord OAuth error:', err);
    const errorMessage = err.message || 'oauth_failed';
    return res.redirect(`${FRONTEND_URL}/auth?error=${encodeURIComponent(errorMessage)}`);
  }
}));

// Unlink Discord account
router.post('/unlink/discord', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await discordOAuth.unlinkAccount(req.user!.userId);
    res.json({ success: true, message: 'Discord account unlinked' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}));

// ================================
// OAUTH STATUS
// ================================

// Get linked accounts status
router.get('/linked-accounts', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      googleId: true,
      discordId: true,
      password: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    google: !!user.googleId,
    discord: !!user.discordId,
    password: !!user.password,
  });
}));

export default router;
