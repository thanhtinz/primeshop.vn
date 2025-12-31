import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { 
  sendEmail, 
  sendRawEmail, 
  sendBulkEmail, 
  testEmailConnection,
  resetTransporter,
  EmailTemplate 
} from '../services/emailService.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Send templated email
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { template, recipient, data, lang } = req.body;

    if (!template || !recipient || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields: template, recipient, data' 
      });
    }

    const result = await sendEmail(recipient, template as EmailTemplate, data, lang);
    
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('[Email Route] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send direct email (no template)
router.post('/send-direct', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { recipient, subject, html, text } = req.body;

    if (!recipient || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipient, subject, html' 
      });
    }

    const result = await sendRawEmail(recipient, subject, html, text);
    
    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('[Email Route] Direct send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send bulk email (admin only)
router.post('/send-bulk', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { recipients, subject, html, text } = req.body;

    if (!recipients || !Array.isArray(recipients) || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipients (array), subject, html' 
      });
    }

    const result = await sendBulkEmail(recipients, subject, html, text);
    res.json(result);
  } catch (error: any) {
    console.error('[Email Route] Bulk send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email connection (admin only)
router.post('/test', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset email transporter (when config changes)
router.post('/reset', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    resetTransporter();
    res.json({ success: true, message: 'Email transporter reset' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get email templates (admin only)
router.get('/templates', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { language } = req.query;
    
    const where: any = { isActive: true };
    if (language) where.language = language;

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ data: templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update email template
router.post('/templates', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, name, language, subject, html_content, text_content, is_active } = req.body;

    if (!name || !language || !subject || !html_content) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, language, subject, html_content' 
      });
    }

    let template;
    if (id) {
      template = await prisma.emailTemplate.update({
        where: { id },
        data: { name, language, subject, html_content, text_content, isActive: is_active }
      });
    } else {
      template = await prisma.emailTemplate.create({
        data: { name, language, subject, html_content, text_content, isActive: is_active ?? true }
      });
    }

    res.json({ data: template });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete email template
router.delete('/templates/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.emailTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get email logs (admin only)
router.get('/logs', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, status, recipient } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (recipient) where.recipient = { contains: recipient as string };

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailLog.count({ where })
    ]);

    res.json({ data: logs, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
