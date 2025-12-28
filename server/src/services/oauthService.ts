/**
 * OAuth Service
 * Handles Google and Discord OAuth authentication
 */

import axios from 'axios';
import prisma from '../lib/prisma.js';

// Types
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email: string;
  verified: boolean;
  locale: string;
}

interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  discord: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// Get OAuth config from environment or database
export const getOAuthConfig = async (): Promise<OAuthConfig> => {
  // Try to get from database settings first
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          'google_client_id', 'google_client_secret',
          'discord_client_id', 'discord_client_secret',
        ]
      }
    }
  }).catch(() => []);

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

  return {
    google: {
      clientId: settingsMap.google_client_id || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settingsMap.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/oauth/callback/google`,
    },
    discord: {
      clientId: settingsMap.discord_client_id || process.env.DISCORD_CLIENT_ID || '',
      clientSecret: settingsMap.discord_client_secret || process.env.DISCORD_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/oauth/callback/discord`,
    },
  };
};

// Google OAuth
export const googleOAuth = {
  // Generate authorization URL
  getAuthUrl: async (state?: string, linkMode?: boolean) => {
    const config = await getOAuthConfig();
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state: JSON.stringify({ state, linkMode }) }),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  // Exchange code for tokens
  getTokens: async (code: string) => {
    const config = await getOAuthConfig();
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      code,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    });
    return response.data;
  },

  // Get user info from access token
  getUserInfo: async (accessToken: string): Promise<GoogleUserInfo> => {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },

  // Find or create user from Google profile
  findOrCreateUser: async (googleUser: GoogleUserInfo) => {
    // Check if user exists with this Google ID
    let user = await prisma.user.findFirst({
      where: { googleId: googleUser.id },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          // Update avatar if not set
          ...(user.avatarUrl ? {} : { avatarUrl: googleUser.picture }),
        },
      });
      return user;
    }

    // Check if user exists with this email
    user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Link Google account to existing user
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          googleId: googleUser.id,
          lastLoginAt: new Date(),
          // Update avatar if not set
          ...(user.avatarUrl ? {} : { avatarUrl: googleUser.picture }),
        },
      });
      return user;
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        displayName: googleUser.name || googleUser.email.split('@')[0],
        avatarUrl: googleUser.picture,
        googleId: googleUser.id,
        isVerified: googleUser.verified_email,
      },
    });

    return user;
  },

  // Link Google account to existing user
  linkAccount: async (userId: string, googleUser: GoogleUserInfo) => {
    // Check if Google account is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        googleId: googleUser.id,
        NOT: { id: userId }
      },
    });

    if (existingUser) {
      throw new Error('This Google account is already linked to another user');
    }

    // Link the account
    await prisma.user.update({
      where: { id: userId },
      data: { googleId: googleUser.id },
    });
  },

  // Unlink Google account
  unlinkAccount: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, discordId: true },
    });

    // Ensure user has another login method
    if (!user?.password && !user?.discordId) {
      throw new Error('Cannot unlink Google account. You need at least one login method.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { googleId: null },
    });
  },
};

// Discord OAuth
export const discordOAuth = {
  // Generate authorization URL
  getAuthUrl: async (state?: string, linkMode?: boolean) => {
    const config = await getOAuthConfig();
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: config.discord.redirectUri,
      response_type: 'code',
      scope: 'identify email',
      ...(state && { state: JSON.stringify({ state, linkMode }) }),
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  },

  // Exchange code for tokens
  getTokens: async (code: string) => {
    const config = await getOAuthConfig();
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        code,
        redirect_uri: config.discord.redirectUri,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data;
  },

  // Get user info from access token
  getUserInfo: async (accessToken: string): Promise<DiscordUserInfo> => {
    const response = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  },

  // Find or create user from Discord profile
  findOrCreateUser: async (discordUser: DiscordUserInfo) => {
    // Check if user exists with this Discord ID
    let user = await prisma.user.findFirst({
      where: { discordId: discordUser.id },
    });

    if (user) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          // Update avatar if not set
          ...(user.avatarUrl ? {} : { 
            avatarUrl: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null
          }),
        },
      });
      return user;
    }

    // Check if user exists with this email
    if (discordUser.email) {
      user = await prisma.user.findUnique({
        where: { email: discordUser.email },
      });

      if (user) {
        // Link Discord account to existing user
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            discordId: discordUser.id,
            lastLoginAt: new Date(),
            // Update avatar if not set
            ...(user.avatarUrl ? {} : { 
              avatarUrl: discordUser.avatar 
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null
            }),
          },
        });
        return user;
      }
    }

    // Create new user
    const displayName = discordUser.global_name || discordUser.username;
    user = await prisma.user.create({
      data: {
        email: discordUser.email,
        displayName,
        avatarUrl: discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        discordId: discordUser.id,
        isVerified: discordUser.verified,
      },
    });

    return user;
  },

  // Link Discord account to existing user
  linkAccount: async (userId: string, discordUser: DiscordUserInfo) => {
    // Check if Discord account is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        discordId: discordUser.id,
        NOT: { id: userId }
      },
    });

    if (existingUser) {
      throw new Error('This Discord account is already linked to another user');
    }

    // Link the account
    await prisma.user.update({
      where: { id: userId },
      data: { discordId: discordUser.id },
    });
  },

  // Unlink Discord account
  unlinkAccount: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, googleId: true },
    });

    // Ensure user has another login method
    if (!user?.password && !user?.googleId) {
      throw new Error('Cannot unlink Discord account. You need at least one login method.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { discordId: null },
    });
  },
};

export default { googleOAuth, discordOAuth, getOAuthConfig };
