import express from 'express';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';
import { discordService } from '../../services/discordService.js';

const router = express.Router();

// All routes require admin
router.use(authMiddleware, adminMiddleware);

// Get all Discord templates
router.get('/discord-templates', async (req, res) => {
  try {
    const templates = await prisma.discord_templates.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Parse JSON variables
    const templatesWithParsedVars = templates.map(t => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables as string) : [],
    }));

    res.json(templatesWithParsedVars);
  } catch (error: any) {
    console.error('Error fetching Discord templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single Discord template
router.get('/discord-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.discord_templates.findUnique({
      where: { id: parseInt(id) },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables as string) : [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Discord template
router.post('/discord-templates', async (req, res) => {
  try {
    const { name, title, title_en, message, message_en, description, description_en, category, color, is_active, variables } = req.body;

    // Check if template name already exists
    const existing = await prisma.discord_templates.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Template name already exists' });
    }

    const template = await prisma.discord_templates.create({
      data: {
        name,
        title,
        title_en,
        message,
        message_en,
        description,
        description_en,
        category: category || 'other',
        color: color || 3447003,
        is_active: is_active !== undefined ? is_active : true,
        variables: variables ? JSON.stringify(variables) : null,
      },
    });

    res.status(201).json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables as string) : [],
    });
  } catch (error: any) {
    console.error('Error creating Discord template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Discord template
router.put('/discord-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, title_en, message, message_en, description, description_en, category, color, is_active, variables } = req.body;

    // Check if new name conflicts with another template
    if (name) {
      const existing = await prisma.discord_templates.findFirst({
        where: {
          name,
          id: { not: parseInt(id) },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Template name already exists' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (title_en !== undefined) updateData.title_en = title_en;
    if (message !== undefined) updateData.message = message;
    if (message_en !== undefined) updateData.message_en = message_en;
    if (description !== undefined) updateData.description = description;
    if (description_en !== undefined) updateData.description_en = description_en;
    if (category !== undefined) updateData.category = category;
    if (color !== undefined) updateData.color = color;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (variables !== undefined) updateData.variables = variables ? JSON.stringify(variables) : null;

    const template = await prisma.discord_templates.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables as string) : [],
    });
  } catch (error: any) {
    console.error('Error updating Discord template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Discord template
router.delete('/discord-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.discord_templates.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Discord template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test Discord template
router.post('/discord-templates/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;
    const userId = (req as any).user.id;

    const template = await prisma.discord_templates.findUnique({
      where: { id: parseInt(id) },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in title and message
    let title = template.title;
    let message = template.message;

    if (testData) {
      Object.entries(testData).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g');
        title = title.replace(regex, String(value));
        message = message.replace(regex, String(value));
      });
    }

    // Send test notification
    const success = await discordService.sendNotification(userId, {
      title: `[TEST] ${title}`,
      message,
      type: template.category as any || 'system',
      metadata: {
        ...testData,
        'Template': template.name,
        'Test Time': new Date().toLocaleString(),
      },
    });

    if (!success) {
      return res.status(400).json({ error: 'Failed to send test notification. Make sure Discord is linked.' });
    }

    res.json({ success: true, message: 'Test notification sent' });
  } catch (error: any) {
    console.error('Error testing Discord template:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
