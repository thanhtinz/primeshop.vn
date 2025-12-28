import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { discordService } from '../services/discordService.js';
import { db } from '../lib/api-client.js';

const router = express.Router();

// Link Discord account
router.post('/link', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { discordId } = req.body;

    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Verify Discord user exists
    const isValid = await discordService.verifyDiscordUser(discordId);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Discord ID or bot cannot access this user' });
    }

    // Update user with Discord ID
    const { error } = await db
      .from('users')
      .update({ 
        discordId,
        discordLinkedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Send welcome message
    await discordService.sendNotification(userId, {
      title: '🎉 Discord Connected!',
      message: 'Your Discord account has been successfully linked to Prime Shop. You will now receive notifications here.',
      type: 'system',
    });

    res.json({ 
      success: true, 
      message: 'Discord account linked successfully' 
    });
  } catch (error: any) {
    console.error('Discord link error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unlink Discord account
router.delete('/unlink', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { error } = await db
      .from('users')
      .update({ 
        discordId: null,
        discordLinkedAt: null,
        discordNotificationPreferences: null,
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Discord account unlinked successfully' 
    });
  } catch (error: any) {
    console.error('Discord unlink error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Discord notification preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: user } = await db
      .from('users')
      .select('discordId, discordNotificationPreferences, discordLinkedAt')
      .eq('id', userId)
      .single();

    res.json({
      isLinked: !!user?.discordId,
      discordId: user?.discordId,
      linkedAt: user?.discordLinkedAt,
      preferences: user?.discordNotificationPreferences || {
        orderNotifications: true,
        paymentNotifications: true,
        accountNotifications: true,
        systemNotifications: true,
        securityNotifications: true,
        socialNotifications: true,
        marketplaceNotifications: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Discord notification preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const preferences = req.body;

    const { error } = await db
      .from('users')
      .update({ discordNotificationPreferences: preferences })
      .eq('id', userId);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Discord notification preferences updated',
      preferences,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test Discord notification (send test message)
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const success = await discordService.sendNotification(userId, {
      title: '🔔 Test Notification',
      message: 'This is a test notification from Prime Shop. If you receive this, your Discord integration is working correctly!',
      type: 'system',
      metadata: {
        'Sent At': new Date().toLocaleString(),
        'User ID': userId,
      },
    });

    if (!success) {
      return res.status(400).json({ 
        error: 'Failed to send test notification. Make sure your Discord account is linked.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Test notification sent to your Discord DM' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get bot status
router.get('/status', async (req, res) => {
  res.json({
    connected: discordService.isConnected(),
    message: discordService.isConnected() 
      ? 'Discord bot is connected' 
      : 'Discord bot is not configured or offline',
  });
});

export default router;
