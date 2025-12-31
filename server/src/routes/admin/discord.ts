import express from 'express';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';
import { discordService } from '../../services/discordService.js';

const router = express.Router();

// Get Discord bot configuration (admin only)
router.get('/config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { key: 'discord_bot_config' }
    });

    const config = settings?.value ? (settings.value as any) : {
      token: '',
      clientId: '',
      notificationChannelId: '',
      announcementChannelId: '',
    };

    // Don't send token to client
    res.json({
      ...config,
      token: config.token ? '****' + config.token.slice(-4) : '',
      isConfigured: !!config.token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Discord bot configuration (admin only)
router.put('/config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const config = req.body;

    await prisma.siteSetting.upsert({
      where: { key: 'discord_bot_config' },
      update: { value: config },
      create: { key: 'discord_bot_config', value: config }
    });

    // Restart Discord bot with new config
    await discordService.disconnect();
    setTimeout(() => {
      // Give it a moment before reconnecting
      discordService.initialize();
    }, 1000);

    res.json({ 
      success: true, 
      message: 'Discord bot configuration updated. Bot will restart.' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test Discord notification (admin only)
router.post('/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { discordId } = req.body;

    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    const success = await discordService.sendNotification(discordId, {
      title: '🧪 Admin Test Notification',
      message: 'This is a test message from Prime Shop admin panel. If you receive this, the Discord bot is working correctly!',
      type: 'system',
      metadata: {
        'Sent By': 'Admin',
        'Test Time': new Date().toLocaleString(),
      },
    });

    if (!success) {
      return res.status(400).json({ 
        error: 'Failed to send test notification. Check if bot is online and Discord ID is correct.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send bulk announcement to channel (admin only)
router.post('/announce', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { channelId, title, description, color, fields } = req.body;

    if (!channelId || !title || !description) {
      return res.status(400).json({ error: 'Channel ID, title, and description are required' });
    }

    const success = await discordService.sendBulkNotification(channelId, {
      title,
      description,
      color,
      fields,
    });

    if (!success) {
      return res.status(400).json({ 
        error: 'Failed to send announcement. Check if bot is online and has access to the channel.' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Announcement sent successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
