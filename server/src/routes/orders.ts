import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Create order schema
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    packageId: z.string().uuid(),
    quantity: z.number().int().positive().default(1),
    customFieldData: z.record(z.any()).optional(),
  })).min(1),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  voucherCode: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['payos', 'paypal', 'balance']).default('payos'),
});

// Create order
router.post('/', optionalAuthMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = createOrderSchema.parse(req.body);

  // Fetch all packages with products
  const packages = await prisma.productPackage.findMany({
    where: {
      id: { in: data.items.map(item => item.packageId) },
      isActive: true,
      isInStock: true,
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, imageUrl: true },
      },
    },
  });

  if (packages.length !== data.items.length) {
    return res.status(400).json({ error: 'Some products are not available' });
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = data.items.map(item => {
    const pkg = packages.find(p => p.id === item.packageId)!;
    const totalPrice = Number(pkg.price) * item.quantity;
    subtotal += totalPrice;

    return {
      packageId: item.packageId,
      productName: pkg.product.name,
      packageName: pkg.name,
      quantity: item.quantity,
      unitPrice: pkg.price,
      totalPrice,
      customFieldData: item.customFieldData || null,
    };
  });

  // Apply voucher
  let discountAmount = 0;
  let voucherId: string | null = null;

  if (data.voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: data.voucherCode.toUpperCase() },
    });

    if (voucher && voucher.isActive) {
      if (voucher.expiresAt && voucher.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Voucher has expired' });
      }

      if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ error: 'Voucher usage limit reached' });
      }

      if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
        return res.status(400).json({ 
          error: `Minimum order value is ${voucher.minOrderValue}` 
        });
      }

      if (voucher.discountType === 'percentage') {
        discountAmount = subtotal * (Number(voucher.discountValue) / 100);
        if (voucher.maxDiscount) {
          discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
        }
      } else {
        discountAmount = Number(voucher.discountValue);
      }

      voucherId = voucher.id;
    }
  }

  const totalAmount = subtotal - discountAmount;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user?.userId || null,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      status: 'PENDING_PAYMENT',
      subtotal,
      discountAmount,
      totalAmount,
      voucherId,
      voucherCode: data.voucherCode?.toUpperCase() || null,
      notes: data.notes,
      productSnapshot: orderItems,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
    },
  });

  // Increment voucher usage
  if (voucherId) {
    await prisma.voucher.update({
      where: { id: voucherId },
      data: { usedCount: { increment: 1 } },
    });
  }

  res.status(201).json(order);
}));

// Get order by order number
router.get('/:orderNumber', optionalAuthMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { orderNumber } = req.params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: {
        select: {
          id: true,
          status: true,
          paymentProvider: true,
          amount: true,
          checkoutUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if user owns this order
  if (req.user && order.userId && order.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(order);
}));

// Validate voucher
router.post('/validate-voucher', asyncHandler(async (req, res) => {
  const { code, subtotal } = z.object({
    code: z.string(),
    subtotal: z.number().positive(),
  }).parse(req.body);

  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!voucher || !voucher.isActive) {
    return res.status(404).json({ error: 'Invalid voucher code' });
  }

  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Voucher has expired' });
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return res.status(400).json({ error: 'Voucher usage limit reached' });
  }

  if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
    return res.status(400).json({ 
      error: `Minimum order value is ${voucher.minOrderValue}` 
    });
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discountType === 'percentage') {
    discountAmount = subtotal * (Number(voucher.discountValue) / 100);
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
    }
  } else {
    discountAmount = Number(voucher.discountValue);
  }

  res.json({
    valid: true,
    voucher: {
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
    },
  });
}));

export default router;
