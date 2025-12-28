import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      profile: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userData } = user;
  res.json(userData);
}));

// Update user profile
router.patch('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const updateSchema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
  });

  const data = updateSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      bio: true,
    },
  });

  res.json(user);
}));

// Get user balance
router.get('/balance', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      balance: true,
      points: true,
    },
  });

  res.json(user);
}));

// Get user orders
router.get('/orders', asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '10', status } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { userId: req.user!.userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            status: true,
            paymentProvider: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    data: orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

// Get user notifications
router.get('/notifications', asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', unread } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { userId: req.user!.userId };
  if (unread === 'true') {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    }),
  ]);

  res.json({
    data: notifications,
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

// Mark notification as read
router.patch('/notifications/:id/read', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: {
      id,
      userId: req.user!.userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  res.json({ success: true });
}));

// Mark all notifications as read
router.patch('/notifications/read-all', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user!.userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  res.json({ success: true });
}));

// Get wishlist
router.get('/wishlist', asyncHandler(async (req: AuthRequest, res) => {
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        include: {
          packages: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(wishlist);
}));

// Add to wishlist
router.post('/wishlist/:productId', asyncHandler(async (req: AuthRequest, res) => {
  const { productId } = req.params;

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: req.user!.userId,
        productId,
      },
    },
    create: {
      userId: req.user!.userId,
      productId,
    },
    update: {},
  });

  res.json({ success: true });
}));

// Remove from wishlist
router.delete('/wishlist/:productId', asyncHandler(async (req: AuthRequest, res) => {
  const { productId } = req.params;

  await prisma.wishlistItem.deleteMany({
    where: {
      userId: req.user!.userId,
      productId,
    },
  });

  res.json({ success: true });
}));

// Get cart
router.get('/cart', asyncHandler(async (req: AuthRequest, res) => {
  const cart = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        include: {
          packages: true,
        },
      },
    },
  });

  res.json(cart);
}));

// Add to cart
router.post('/cart', asyncHandler(async (req: AuthRequest, res) => {
  const { productId, packageId, quantity = 1, customFieldData } = z.object({
    productId: z.string().uuid(),
    packageId: z.string().uuid().optional(),
    quantity: z.number().int().positive().default(1),
    customFieldData: z.record(z.any()).optional(),
  }).parse(req.body);

  const cartItem = await prisma.cartItem.upsert({
    where: {
      userId_productId_packageId: {
        userId: req.user!.userId,
        productId,
        packageId: packageId || '',
      },
    },
    create: {
      userId: req.user!.userId,
      productId,
      packageId,
      quantity,
      customFieldData,
    },
    update: {
      quantity: { increment: quantity },
      customFieldData,
    },
    include: {
      product: true,
    },
  });

  res.json(cartItem);
}));

// Update cart item
router.patch('/cart/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { quantity, customFieldData } = z.object({
    quantity: z.number().int().positive().optional(),
    customFieldData: z.record(z.any()).optional(),
  }).parse(req.body);

  const cartItem = await prisma.cartItem.updateMany({
    where: {
      id,
      userId: req.user!.userId,
    },
    data: {
      ...(quantity !== undefined && { quantity }),
      ...(customFieldData !== undefined && { customFieldData }),
    },
  });

  res.json({ success: true });
}));

// Remove from cart
router.delete('/cart/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  await prisma.cartItem.deleteMany({
    where: {
      id,
      userId: req.user!.userId,
    },
  });

  res.json({ success: true });
}));

// Clear cart
router.delete('/cart', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.user!.userId },
  });

  res.json({ success: true });
}));

// =============================================
// EMAIL PREFERENCES
// =============================================

// Get user email preferences
router.get('/email-preferences', asyncHandler(async (req: AuthRequest, res) => {
  let prefs = await prisma.userEmailPreferences.findUnique({
    where: { userId: req.user!.userId },
  });

  // Create default preferences if not exists
  if (!prefs) {
    prefs = await prisma.userEmailPreferences.create({
      data: { userId: req.user!.userId },
    });
  }

  res.json(prefs);
}));

// Update user email preferences
router.patch('/email-preferences', asyncHandler(async (req: AuthRequest, res) => {
  const updateSchema = z.object({
    // Master toggle
    emailEnabled: z.boolean().optional(),
    
    // Category toggles
    authEmails: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    orderEmails: z.boolean().optional(),
    paymentEmails: z.boolean().optional(),
    invoiceEmails: z.boolean().optional(),
    promotionEmails: z.boolean().optional(),
    voucherEmails: z.boolean().optional(),
    newsletterEmails: z.boolean().optional(),
    socialEmails: z.boolean().optional(),
    messageEmails: z.boolean().optional(),
    rewardEmails: z.boolean().optional(),
    checkinEmails: z.boolean().optional(),
    auctionEmails: z.boolean().optional(),
    groupOrderEmails: z.boolean().optional(),
    wishlistEmails: z.boolean().optional(),
    cartReminderEmails: z.boolean().optional(),
    primeEmails: z.boolean().optional(),
    vipEmails: z.boolean().optional(),
    sellerEmails: z.boolean().optional(),
    affiliateEmails: z.boolean().optional(),
    eventEmails: z.boolean().optional(),
  });

  const data = updateSchema.parse(req.body);

  const prefs = await prisma.userEmailPreferences.upsert({
    where: { userId: req.user!.userId },
    update: data,
    create: { 
      userId: req.user!.userId,
      ...data 
    },
  });

  res.json(prefs);
}));

// Toggle all email preferences on/off
router.post('/email-preferences/toggle-all', asyncHandler(async (req: AuthRequest, res) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);

  const prefs = await prisma.userEmailPreferences.upsert({
    where: { userId: req.user!.userId },
    update: { emailEnabled: enabled },
    create: { 
      userId: req.user!.userId,
      emailEnabled: enabled 
    },
  });

  res.json(prefs);
}));

// Enable all categories (but respects master toggle)
router.post('/email-preferences/enable-all-categories', asyncHandler(async (req: AuthRequest, res) => {
  const prefs = await prisma.userEmailPreferences.upsert({
    where: { userId: req.user!.userId },
    update: {
      authEmails: true,
      securityAlerts: true,
      orderEmails: true,
      paymentEmails: true,
      invoiceEmails: true,
      promotionEmails: true,
      voucherEmails: true,
      newsletterEmails: true,
      socialEmails: true,
      messageEmails: true,
      rewardEmails: true,
      checkinEmails: true,
      auctionEmails: true,
      groupOrderEmails: true,
      wishlistEmails: true,
      cartReminderEmails: true,
      primeEmails: true,
      vipEmails: true,
      sellerEmails: true,
      affiliateEmails: true,
      eventEmails: true,
    },
    create: { 
      userId: req.user!.userId,
      authEmails: true,
      securityAlerts: true,
      orderEmails: true,
      paymentEmails: true,
      invoiceEmails: true,
      promotionEmails: true,
      voucherEmails: true,
      newsletterEmails: true,
      socialEmails: true,
      messageEmails: true,
      rewardEmails: true,
      checkinEmails: true,
      auctionEmails: true,
      groupOrderEmails: true,
      wishlistEmails: true,
      cartReminderEmails: true,
      primeEmails: true,
      vipEmails: true,
      sellerEmails: true,
      affiliateEmails: true,
      eventEmails: true,
    },
  });

  res.json(prefs);
}));

// Disable all categories (keep only essential)
router.post('/email-preferences/disable-all-categories', asyncHandler(async (req: AuthRequest, res) => {
  const prefs = await prisma.userEmailPreferences.upsert({
    where: { userId: req.user!.userId },
    update: {
      // Keep security and auth enabled for safety
      authEmails: true,
      securityAlerts: true,
      // Disable everything else
      orderEmails: false,
      paymentEmails: false,
      invoiceEmails: false,
      promotionEmails: false,
      voucherEmails: false,
      newsletterEmails: false,
      socialEmails: false,
      messageEmails: false,
      rewardEmails: false,
      checkinEmails: false,
      auctionEmails: false,
      groupOrderEmails: false,
      wishlistEmails: false,
      cartReminderEmails: false,
      primeEmails: false,
      vipEmails: false,
      sellerEmails: false,
      affiliateEmails: false,
      eventEmails: false,
    },
    create: { 
      userId: req.user!.userId,
      authEmails: true,
      securityAlerts: true,
      orderEmails: false,
      paymentEmails: false,
      invoiceEmails: false,
      promotionEmails: false,
      voucherEmails: false,
      newsletterEmails: false,
      socialEmails: false,
      messageEmails: false,
      rewardEmails: false,
      checkinEmails: false,
      auctionEmails: false,
      groupOrderEmails: false,
      wishlistEmails: false,
      cartReminderEmails: false,
      primeEmails: false,
      vipEmails: false,
      sellerEmails: false,
      affiliateEmails: false,
      eventEmails: false,
    },
  });

  res.json(prefs);
}));

export default router;
