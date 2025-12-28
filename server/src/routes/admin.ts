import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

// ============ CATEGORIES ============

router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
    },
  });
  res.json(categories);
}));

router.post('/categories', asyncHandler(async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    nameEn: z.string().optional(),
    slug: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }).parse(req.body);

  const category = await prisma.category.create({ data });
  res.status(201).json(category);
}));

router.patch('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = z.object({
    name: z.string().min(1).optional(),
    nameEn: z.string().optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }).parse(req.body);

  const category = await prisma.category.update({
    where: { id },
    data,
  });
  res.json(category);
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
}));

// ============ PRODUCTS ============

router.get('/products', asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', category, search } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (category) where.categoryId = category;
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { slug: { contains: search as string } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        packages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

router.post('/products', asyncHandler(async (req, res) => {
  const data = z.object({
    name: z.string().min(1),
    nameEn: z.string().optional(),
    slug: z.string().min(1),
    categoryId: z.string().uuid().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    imageUrl: z.string().url().optional(),
    productStyle: z.string().default('default'),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  }).parse(req.body);

  const product = await prisma.product.create({ data });
  res.status(201).json(product);
}));

router.patch('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = z.object({
    name: z.string().min(1).optional(),
    nameEn: z.string().optional(),
    slug: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    productStyle: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }).parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data,
  });
  res.json(product);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.product.delete({ where: { id } });
  res.json({ success: true });
}));

// ============ PRODUCT PACKAGES ============

router.post('/products/:productId/packages', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const data = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
    isInStock: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }).parse(req.body);

  const pkg = await prisma.productPackage.create({
    data: { ...data, productId },
  });
  res.status(201).json(pkg);
}));

router.patch('/packages/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
    isInStock: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }).parse(req.body);

  const pkg = await prisma.productPackage.update({
    where: { id },
    data,
  });
  res.json(pkg);
}));

router.delete('/packages/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.productPackage.delete({ where: { id } });
  res.json({ success: true });
}));

// ============ ORDERS ============

router.get('/orders', asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', status, search } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string } },
      { customerEmail: { contains: search as string } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
        user: { select: { id: true, displayName: true, email: true } },
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

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, deliveryContent, notes } = z.object({
    status: z.string(),
    deliveryContent: z.string().optional(),
    notes: z.string().optional(),
  }).parse(req.body);

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(deliveryContent && { deliveryContent }),
      ...(notes && { notes }),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
      ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
    },
  });

  // Send notification to user
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'order_status',
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng ${order.orderNumber} đã được cập nhật sang trạng thái: ${status}`,
        data: { orderId: order.id, status },
      },
    });
  }

  res.json(order);
}));

// ============ VOUCHERS ============

router.get('/vouchers', asyncHandler(async (req, res) => {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(vouchers);
}));

router.post('/vouchers', asyncHandler(async (req, res) => {
  const data = z.object({
    code: z.string().min(1),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    minOrderValue: z.number().positive().optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
    isPrime: z.boolean().default(false),
    expiresAt: z.string().datetime().optional(),
  }).parse(req.body);

  const voucher = await prisma.voucher.create({
    data: {
      ...data,
      code: data.code.toUpperCase(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  res.status(201).json(voucher);
}));

router.patch('/vouchers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = z.object({
    code: z.string().min(1).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().positive().optional(),
    minOrderValue: z.number().positive().optional().nullable(),
    maxDiscount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    isPrime: z.boolean().optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  }).parse(req.body);

  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      ...data,
      ...(data.code && { code: data.code.toUpperCase() }),
      ...(data.expiresAt !== undefined && { 
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null 
      }),
    },
  });
  res.json(voucher);
}));

router.delete('/vouchers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.voucher.delete({ where: { id } });
  res.json({ success: true });
}));

// ============ USERS ============

router.get('/users', asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', search, banned } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search as string } },
      { displayName: { contains: search as string } },
    ];
  }
  if (banned === 'true') where.isBanned = true;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        balance: true,
        points: true,
        isPrime: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

router.patch('/users/:id/ban', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBanned, banReason } = z.object({
    isBanned: z.boolean(),
    banReason: z.string().optional(),
  }).parse(req.body);

  const user = await prisma.user.update({
    where: { id },
    data: {
      isBanned,
      banReason: isBanned ? banReason : null,
    },
  });

  // Invalidate all refresh tokens if banning
  if (isBanned) {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  res.json({ success: true });
}));

// ============ SITE SETTINGS ============

router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await prisma.siteSetting.findMany();
  
  // Convert to object
  const settingsObj = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, any>);

  res.json(settingsObj);
}));

router.patch('/settings', asyncHandler(async (req, res) => {
  const updates = req.body as Record<string, any>;

  // Upsert each setting
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );

  res.json({ success: true });
}));

// ============ DASHBOARD STATS ============

router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['PAID', 'COMPLETED'] } } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'COMPLETED'] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: today },
        status: { in: ['PAID', 'COMPLETED'] },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { in: ['PAID', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      include: {
        user: { select: { displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.product.findMany({
      orderBy: { soldCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        soldCount: true,
      },
    }),
  ]);

  res.json({
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    todayOrders,
    todayRevenue: todayRevenue._sum.totalAmount || 0,
    recentOrders,
    topProducts,
  });
}));

export default router;
