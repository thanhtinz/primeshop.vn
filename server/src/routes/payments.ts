import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate PayOS checksum
const generatePayOSChecksum = (data: Record<string, any>): string => {
  const sortedKeys = Object.keys(data).sort();
  const dataString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
  return crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(dataString).digest('hex');
};

// Create payment for order
router.post('/create', asyncHandler(async (req, res) => {
  const { orderId, paymentMethod = 'payos' } = z.object({
    orderId: z.string().uuid(),
    paymentMethod: z.enum(['payos', 'paypal', 'balance']).default('payos'),
  }).parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return res.status(400).json({ error: 'Order is not awaiting payment' });
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      userId: order.userId,
      paymentProvider: paymentMethod,
      paymentType: 'order',
      amount: order.totalAmount,
      status: 'pending',
    },
  });

  if (paymentMethod === 'payos') {
    // Create PayOS payment
    const orderCode = Date.now();
    const amount = Math.round(Number(order.totalAmount));
    
    const payosData = {
      orderCode,
      amount,
      description: `Thanh toan don hang ${order.orderNumber}`.substring(0, 25),
      cancelUrl: `${FRONTEND_URL}/checkout/cancel?order=${order.orderNumber}`,
      returnUrl: `${FRONTEND_URL}/checkout/success?order=${order.orderNumber}`,
    };

    const signature = generatePayOSChecksum(payosData);

    try {
      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
        },
        body: JSON.stringify({
          ...payosData,
          signature,
        }),
      });

      const payosResult = await response.json();

      if (payosResult.code === '00' && payosResult.data) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            externalPaymentId: String(orderCode),
            checkoutUrl: payosResult.data.checkoutUrl,
            paymentData: payosResult.data,
          },
        });

        return res.json({
          success: true,
          checkoutUrl: payosResult.data.checkoutUrl,
          paymentId: payment.id,
        });
      } else {
        throw new Error(payosResult.desc || 'PayOS error');
      }
    } catch (error: any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      return res.status(500).json({ error: error.message || 'Payment creation failed' });
    }
  }

  // For other payment methods, return payment info
  res.json({
    success: true,
    paymentId: payment.id,
    paymentMethod,
  });
}));

// Create deposit payment
router.post('/deposit', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { amount, paymentMethod = 'payos' } = z.object({
    amount: z.number().positive().min(10000),
    paymentMethod: z.enum(['payos', 'paypal']).default('payos'),
  }).parse(req.body);

  // Calculate bonus (example: 5% bonus for deposits over 500k)
  let bonusAmount = 0;
  if (amount >= 500000) {
    bonusAmount = amount * 0.05;
  }

  const totalAmount = amount + bonusAmount;

  // Create deposit record
  const deposit = await prisma.deposit.create({
    data: {
      userId: req.user!.userId,
      amount,
      bonusAmount,
      totalAmount,
      paymentProvider: paymentMethod,
      status: 'pending',
    },
  });

  if (paymentMethod === 'payos') {
    const orderCode = Date.now();
    
    const payosData = {
      orderCode,
      amount: Math.round(amount),
      description: `Nap tien ${amount}`.substring(0, 25),
      cancelUrl: `${FRONTEND_URL}/wallet?status=cancelled`,
      returnUrl: `${FRONTEND_URL}/wallet?status=success&deposit=${deposit.id}`,
    };

    const signature = generatePayOSChecksum(payosData);

    try {
      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
        },
        body: JSON.stringify({
          ...payosData,
          signature,
        }),
      });

      const payosResult = await response.json();

      if (payosResult.code === '00' && payosResult.data) {
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: {
            externalPaymentId: String(orderCode),
            paymentUrl: payosResult.data.checkoutUrl,
          },
        });

        return res.json({
          success: true,
          checkoutUrl: payosResult.data.checkoutUrl,
          depositId: deposit.id,
        });
      } else {
        throw new Error(payosResult.desc || 'PayOS error');
      }
    } catch (error: any) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'failed' },
      });
      return res.status(500).json({ error: error.message || 'Deposit creation failed' });
    }
  }

  res.json({
    success: true,
    depositId: deposit.id,
  });
}));

// Get deposit history
router.get('/deposits', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '10' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [deposits, total] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.deposit.count({ where: { userId: req.user!.userId } }),
  ]);

  res.json({
    data: deposits,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

export default router;
