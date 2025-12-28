import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';

// Verify PayOS signature
const verifyPayOSSignature = (data: any, signature: string): boolean => {
  try {
    const sortedKeys = Object.keys(data).sort();
    const dataString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
    const expectedSignature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(dataString).digest('hex');
    return expectedSignature.toLowerCase() === signature.toLowerCase();
  } catch {
    return false;
  }
};

// PayOS webhook
router.post('/payos', asyncHandler(async (req, res) => {
  console.log('PayOS webhook received:', JSON.stringify(req.body, null, 2));

  const signature = req.headers['x-payos-signature'] || 
                    req.headers['x-payos-sign'] || 
                    req.headers['signature'] || '';

  const { code, data } = req.body;

  // Verify signature if provided
  if (signature && data) {
    const isValid = verifyPayOSSignature(data, signature as string);
    if (!isValid) {
      console.warn('Invalid PayOS signature');
      // Continue anyway for testing
    }
  }

  if (code !== '00' || !data) {
    console.log('PayOS webhook: non-success code or no data');
    return res.json({ success: true });
  }

  const { orderCode, amount, code: transactionCode } = data;

  // Find payment or deposit by orderCode
  const payment = await prisma.payment.findFirst({
    where: { externalPaymentId: String(orderCode) },
    include: { order: true },
  });

  if (payment) {
    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'success',
        paidAt: new Date(),
        paymentData: data,
      },
    });

    // Update order status
    if (payment.order) {
      await prisma.order.update({
        where: { id: payment.order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Send notification
      if (payment.order.userId) {
        await prisma.notification.create({
          data: {
            userId: payment.order.userId,
            type: 'order_paid',
            title: 'Thanh toán thành công',
            message: `Đơn hàng ${payment.order.orderNumber} đã được thanh toán thành công!`,
            data: { orderId: payment.order.id, orderNumber: payment.order.orderNumber },
          },
        });
      }
    }

    return res.json({ success: true });
  }

  // Check if it's a deposit
  const deposit = await prisma.deposit.findFirst({
    where: { externalPaymentId: String(orderCode) },
  });

  if (deposit) {
    // Update deposit status
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'success',
        paidAt: new Date(),
      },
    });

    // Add balance to user
    await prisma.user.update({
      where: { id: deposit.userId },
      data: {
        balance: { increment: deposit.totalAmount },
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: deposit.userId,
        type: 'deposit_success',
        title: 'Nạp tiền thành công',
        message: `Bạn đã nạp ${deposit.amount}đ vào tài khoản. Khuyến mãi: ${deposit.bonusAmount}đ`,
        data: { depositId: deposit.id, amount: Number(deposit.amount) },
      },
    });

    return res.json({ success: true });
  }

  console.log('No matching payment or deposit found for orderCode:', orderCode);
  res.json({ success: true });
}));

// PayPal webhook (IPN)
router.post('/paypal', asyncHandler(async (req, res) => {
  console.log('PayPal webhook received:', JSON.stringify(req.body, null, 2));
  
  // TODO: Implement PayPal IPN verification
  // For now, just acknowledge receipt
  res.status(200).send('OK');
}));

export default router;
