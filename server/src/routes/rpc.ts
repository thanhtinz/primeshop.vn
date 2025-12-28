// RPC (Remote Procedure Call) routes - replaces Supabase RPC functions
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Get dashboard stats
router.post('/get_dashboard_stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'completed' },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
      },
    }),
  ]);

  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    recentOrders,
  });
}));

// Get product by slug
router.post('/get_product_by_slug', asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.body;
  
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      packages: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      images: {
        orderBy: { order: 'asc' },
      },
      customFields: true,
      reviews: {
        include: {
          user: {
            select: { id: true },
            include: {
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Update view count
  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  res.json(product);
}));

// Search products
router.post('/search_products', asyncHandler(async (req: Request, res: Response) => {
  const { query, category, minPrice, maxPrice, sortBy, limit = 20, offset = 0 } = req.body;

  const where: any = { isActive: true };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (minPrice !== undefined) {
    where.price = { ...where.price, gte: minPrice };
  }

  if (maxPrice !== undefined) {
    where.price = { ...where.price, lte: maxPrice };
  }

  let orderBy: any = { createdAt: 'desc' };
  switch (sortBy) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'popular':
      orderBy = { soldCount: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        category: true,
        packages: {
          where: { isActive: true },
          take: 1,
          orderBy: { price: 'asc' },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total });
}));

// Get user stats
router.post('/get_user_stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [
    totalOrders,
    totalSpent,
    pendingOrders,
    completedOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { userId, status: 'completed' },
    }),
    prisma.order.count({ where: { userId, status: 'pending' } }),
    prisma.order.count({ where: { userId, status: 'completed' } }),
  ]);

  res.json({
    totalOrders,
    totalSpent: totalSpent._sum.totalAmount || 0,
    pendingOrders,
    completedOrders,
  });
}));

// Apply voucher
router.post('/apply_voucher', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { code, totalAmount } = req.body;
  const userId = req.user!.id;

  const voucher = await prisma.voucher.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
  });

  if (!voucher) {
    throw new AppError('Voucher not found or expired', 404);
  }

  if (voucher.usedCount >= voucher.maxUses) {
    throw new AppError('Voucher has reached maximum uses', 400);
  }

  if (totalAmount < voucher.minOrderAmount) {
    throw new AppError(`Minimum order amount is ${voucher.minOrderAmount}`, 400);
  }

  let discount = 0;
  if (voucher.discountType === 'percentage') {
    discount = (totalAmount * voucher.discountValue) / 100;
    if (voucher.maxDiscount && discount > voucher.maxDiscount) {
      discount = voucher.maxDiscount;
    }
  } else {
    discount = voucher.discountValue;
  }

  res.json({
    valid: true,
    voucher,
    discount,
    finalAmount: totalAmount - discount,
  });
}));

// Create notification
router.post('/create_notification', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, message, type, link } = req.body;

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: type || 'info',
      link,
    },
  });

  // Emit real-time notification (will be handled by socket.io)
  // This is a placeholder - actual implementation depends on socket setup

  res.json(notification);
}));

// Mark notifications as read
router.post('/mark_notifications_read', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { notificationIds } = req.body;

  if (notificationIds && notificationIds.length > 0) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  res.json({ success: true });
}));

// Get unread notification count
router.post('/get_unread_count', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  res.json({ count });
}));

// Check if product in wishlist
router.post('/check_wishlist', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  const item = await prisma.wishlistItem.findFirst({
    where: { userId, productId },
  });

  res.json({ inWishlist: !!item });
}));

// Toggle wishlist item
router.post('/toggle_wishlist', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    res.json({ added: false });
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    res.json({ added: true });
  }
}));

// Update cart item quantity
router.post('/update_cart_quantity', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { cartItemId, quantity } = req.body;

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId, userId },
    });
    res.json({ deleted: true });
  } else {
    const updated = await prisma.cartItem.update({
      where: { id: cartItemId, userId },
      data: { quantity },
    });
    res.json(updated);
  }
}));

// Get related products
router.post('/get_related_products', asyncHandler(async (req: Request, res: Response) => {
  const { productId, categoryId, limit = 4 } = req.body;

  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: productId },
      isActive: true,
    },
    take: limit,
    orderBy: { soldCount: 'desc' },
    include: {
      category: true,
    },
  });

  res.json(products);
}));

// Increment product view
router.post('/increment_product_view', asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;

  await prisma.product.update({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
  });

  res.json({ success: true });
}));

// ============ CRITICAL PAYMENT RPC FUNCTIONS ============

// Pay with balance - atomic transaction
router.post('/pay_with_balance', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_user_id, p_amount, p_reference_type, p_reference_id, p_note } = req.body;
  
  // Security check - user can only pay for themselves
  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const amount = Number(p_amount);
  if (isNaN(amount) || amount <= 0) {
    throw new AppError('Invalid amount', 400);
  }

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get user with lock
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const balance = Number(user.balance);
    if (balance < amount) {
      return { success: false, error: 'Số dư không đủ' };
    }

    // Deduct balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    // Create transaction record
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'payment',
        referenceType: p_reference_type,
        referenceId: p_reference_id,
        note: p_note || 'Thanh toán đơn hàng',
        status: 'completed',
      },
    });

    return { success: true };
  });

  res.json(result);
}));

// Create seller order with escrow - atomic transaction
router.post('/create_seller_order_with_escrow', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user!.id;
  const { 
    p_buyer_id, p_seller_id, p_product_id, p_amount, 
    p_platform_fee, p_net_amount, p_auto_confirm_hours 
  } = req.body;

  // Security check
  if (p_buyer_id !== buyerId) {
    throw new AppError('Unauthorized', 403);
  }

  const amount = Number(p_amount);
  const platformFee = Number(p_platform_fee) || 0;
  const netAmount = Number(p_net_amount) || (amount - platformFee);

  const result = await prisma.$transaction(async (tx) => {
    // Check buyer balance
    const buyer = await tx.user.findUnique({
      where: { id: buyerId },
      select: { balance: true },
    });

    if (!buyer || Number(buyer.balance) < amount) {
      return { success: false, error: 'Số dư không đủ' };
    }

    // Deduct buyer balance
    await tx.user.update({
      where: { id: buyerId },
      data: { balance: { decrement: amount } },
    });

    // Create order
    const order = await tx.sellerOrder.create({
      data: {
        buyerId,
        sellerId: p_seller_id,
        productId: p_product_id,
        amount,
        platformFee,
        netAmount,
        status: 'pending',
        autoConfirmAt: new Date(Date.now() + (p_auto_confirm_hours || 72) * 60 * 60 * 1000),
      },
    });

    // Create escrow record
    await tx.escrowTransaction.create({
      data: {
        orderId: order.id,
        buyerId,
        sellerId: p_seller_id,
        amount: netAmount,
        status: 'held',
      },
    });

    // Record buyer transaction
    await tx.walletTransaction.create({
      data: {
        userId: buyerId,
        amount: -amount,
        type: 'purchase',
        referenceType: 'seller_order',
        referenceId: order.id,
        note: 'Mua sản phẩm từ shop',
        status: 'completed',
      },
    });

    return { success: true, orderId: order.id };
  });

  res.json(result);
}));

// Create SMM order atomic
router.post('/create_smm_order_atomic', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_user_id, p_service_id, p_link, p_quantity, p_charge } = req.body;

  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const charge = Number(p_charge);
  
  const result = await prisma.$transaction(async (tx) => {
    // Check balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || Number(user.balance) < charge) {
      return { success: false, error: 'Số dư không đủ' };
    }

    // Deduct balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: charge } },
    });

    // Create SMM order
    const order = await tx.smmOrder.create({
      data: {
        userId,
        serviceId: p_service_id,
        link: p_link,
        quantity: p_quantity,
        charge,
        status: 'pending',
      },
    });

    // Record transaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -charge,
        type: 'smm_order',
        referenceType: 'smm_order',
        referenceId: order.id,
        note: 'Đặt dịch vụ SMM',
        status: 'completed',
      },
    });

    return { success: true, orderId: order.id };
  });

  res.json(result);
}));

// Increment voucher usage
router.post('/increment_voucher_usage', asyncHandler(async (req: Request, res: Response) => {
  const { voucher_id } = req.body;

  await prisma.voucher.update({
    where: { id: voucher_id },
    data: { usedCount: { increment: 1 } },
  });

  res.json({ success: true });
}));

// Refund SMM order
router.post('/refund_smm_order', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { p_order_id, p_refund_amount, p_admin_note } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.smmOrder.findUnique({
      where: { id: p_order_id },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status === 'refunded') {
      return { success: false, error: 'Order already refunded' };
    }

    const refundAmount = Number(p_refund_amount) || Number(order.charge);

    // Refund to user
    await tx.user.update({
      where: { id: order.userId },
      data: { balance: { increment: refundAmount } },
    });

    // Update order status
    await tx.smmOrder.update({
      where: { id: p_order_id },
      data: { 
        status: 'refunded',
        adminNote: p_admin_note,
      },
    });

    // Record refund transaction
    await tx.walletTransaction.create({
      data: {
        userId: order.userId,
        amount: refundAmount,
        type: 'refund',
        referenceType: 'smm_order',
        referenceId: p_order_id,
        note: 'Hoàn tiền đơn SMM',
        status: 'completed',
      },
    });

    return { success: true };
  });

  res.json(result);
}));

// Admin adjust user balance
router.post('/admin_adjust_user_balance', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { p_user_id, p_amount, p_reason, p_admin_id } = req.body;

  const amount = Number(p_amount);

  const result = await prisma.$transaction(async (tx) => {
    // Update user balance
    await tx.user.update({
      where: { id: p_user_id },
      data: { balance: { increment: amount } },
    });

    // Record transaction
    await tx.walletTransaction.create({
      data: {
        userId: p_user_id,
        amount,
        type: amount > 0 ? 'admin_credit' : 'admin_debit',
        referenceType: 'admin_adjustment',
        referenceId: p_admin_id,
        note: p_reason || 'Điều chỉnh số dư bởi admin',
        status: 'completed',
      },
    });

    return { success: true };
  });

  res.json(result);
}));

// Daily checkin
router.post('/perform_daily_checkin', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_user_id } = req.body;

  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCheckin = await prisma.dailyCheckin.findFirst({
    where: {
      userId,
      checkinDate: { gte: today },
    },
  });

  if (existingCheckin) {
    return res.json({ success: false, error: 'Đã điểm danh hôm nay' });
  }

  // Get user's streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCheckin = await prisma.dailyCheckin.findFirst({
    where: { userId },
    orderBy: { checkinDate: 'desc' },
  });

  let currentStreak = 1;
  if (lastCheckin) {
    const lastDate = new Date(lastCheckin.checkinDate);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === yesterday.getTime()) {
      currentStreak = lastCheckin.streakCount + 1;
    }
  }

  // Calculate reward (base 10 points + streak bonus)
  const basePoints = 10;
  const streakBonus = Math.min(currentStreak - 1, 6) * 5; // Max 30 bonus
  const totalPoints = basePoints + streakBonus;

  await prisma.$transaction(async (tx) => {
    // Create checkin record
    await tx.dailyCheckin.create({
      data: {
        userId,
        checkinDate: new Date(),
        streakCount: currentStreak,
        pointsEarned: totalPoints,
      },
    });

    // Add points to user
    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: totalPoints } },
    });
  });

  res.json({ 
    success: true, 
    points_earned: totalPoints, 
    current_streak: currentStreak 
  });
}));

// Redeem points reward
router.post('/redeem_points_reward', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_user_id, p_reward_id } = req.body;

  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const reward = await prisma.pointsReward.findUnique({
    where: { id: p_reward_id },
  });

  if (!reward || !reward.isActive) {
    return res.json({ success: false, error: 'Phần thưởng không tồn tại' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user || user.points < reward.pointsCost) {
    return res.json({ success: false, error: 'Không đủ điểm' });
  }

  await prisma.$transaction(async (tx) => {
    // Deduct points
    await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: reward.pointsCost } },
    });

    // Add balance if reward type is balance
    if (reward.rewardType === 'balance') {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: reward.rewardValue } },
      });
    }

    // Record redemption
    await tx.pointsRedemption.create({
      data: {
        userId,
        rewardId: p_reward_id,
        pointsSpent: reward.pointsCost,
        status: 'completed',
      },
    });
  });

  res.json({ success: true });
}));

// Place auction bid
router.post('/place_auction_bid', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_auction_id, p_bid_amount, p_user_id } = req.body;

  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const bidAmount = Number(p_bid_amount);

  const result = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({
      where: { id: p_auction_id },
    });

    if (!auction || auction.status !== 'active') {
      return { success: false, error: 'Đấu giá không khả dụng' };
    }

    if (new Date() > new Date(auction.endTime)) {
      return { success: false, error: 'Đấu giá đã kết thúc' };
    }

    if (bidAmount <= Number(auction.currentBid)) {
      return { success: false, error: 'Giá đặt phải cao hơn giá hiện tại' };
    }

    // Check user balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || Number(user.balance) < bidAmount) {
      return { success: false, error: 'Số dư không đủ' };
    }

    // Create bid
    await tx.auctionBid.create({
      data: {
        auctionId: p_auction_id,
        userId,
        amount: bidAmount,
      },
    });

    // Update auction
    await tx.auction.update({
      where: { id: p_auction_id },
      data: {
        currentBid: bidAmount,
        currentBidderId: userId,
        bidCount: { increment: 1 },
      },
    });

    return { success: true };
  });

  res.json(result);
}));

// Generate affiliate code
router.post('/generate_affiliate_code', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Check if user already has a code
  const existing = await prisma.affiliateCode.findFirst({
    where: { userId },
  });

  if (existing) {
    return res.json({ code: existing.code });
  }

  // Generate unique code
  const code = `AFF${userId.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

  await prisma.affiliateCode.create({
    data: {
      userId,
      code,
    },
  });

  res.json({ code });
}));

// Track affiliate click
router.post('/track_affiliate_click', asyncHandler(async (req: Request, res: Response) => {
  const { p_affiliate_code, p_referrer_url } = req.body;

  const affiliate = await prisma.affiliateCode.findFirst({
    where: { code: p_affiliate_code },
  });

  if (affiliate) {
    await prisma.affiliateClick.create({
      data: {
        affiliateCodeId: affiliate.id,
        referrerUrl: p_referrer_url,
        ipAddress: req.ip,
      },
    });
  }

  res.json({ success: true });
}));

// Auction buy now
router.post('/auction_buy_now', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_auction_id, p_user_id } = req.body;

  if (p_user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  const result = await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUnique({
      where: { id: p_auction_id },
    });

    if (!auction || auction.status !== 'active') {
      return { success: false, error: 'Đấu giá không khả dụng' };
    }

    if (!auction.buyNowPrice) {
      return { success: false, error: 'Đấu giá không hỗ trợ mua ngay' };
    }

    const buyNowPrice = Number(auction.buyNowPrice);

    // Check user balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user || Number(user.balance) < buyNowPrice) {
      return { success: false, error: 'Số dư không đủ' };
    }

    // Deduct balance
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: buyNowPrice } },
    });

    // Credit seller
    if (auction.sellerId) {
      await tx.user.update({
        where: { id: auction.sellerId },
        data: { balance: { increment: buyNowPrice } },
      });
    }

    // Update auction
    await tx.auction.update({
      where: { id: p_auction_id },
      data: {
        status: 'completed',
        winnerId: userId,
        finalPrice: buyNowPrice,
      },
    });

    // Record transaction
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -buyNowPrice,
        type: 'auction_buy_now',
        referenceType: 'auction',
        referenceId: p_auction_id,
        note: 'Mua ngay đấu giá',
        status: 'completed',
      },
    });

    return { success: true };
  });

  res.json(result);
}));

// Log handover action
router.post('/log_handover_action', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { p_order_id, p_action_type, p_performed_by, p_details } = req.body;

  // Verify user is involved in the order
  const order = await prisma.sellerOrder.findUnique({
    where: { id: p_order_id },
    select: { buyerId: true, sellerId: true },
  });

  if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
    throw new AppError('Unauthorized', 403);
  }

  await prisma.handoverLog.create({
    data: {
      orderId: p_order_id,
      actionType: p_action_type,
      performedBy: p_performed_by,
      details: p_details,
    },
  });

  res.json({ success: true });
}));

// Resolve design dispute
router.post('/resolve_design_dispute', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { p_order_id, p_resolution, p_refund_amount, p_admin_note } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.designOrder.findUnique({
      where: { id: p_order_id },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const refundAmount = Number(p_refund_amount) || 0;

    // Process refund if applicable
    if (refundAmount > 0 && order.buyerId) {
      await tx.user.update({
        where: { id: order.buyerId },
        data: { balance: { increment: refundAmount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: order.buyerId,
          amount: refundAmount,
          type: 'refund',
          referenceType: 'design_order',
          referenceId: p_order_id,
          note: `Hoàn tiền từ tranh chấp: ${p_admin_note || ''}`,
          status: 'completed',
        },
      });
    }

    // Update order status
    await tx.designOrder.update({
      where: { id: p_order_id },
      data: {
        status: p_resolution === 'refund_full' ? 'refunded' : 'resolved',
        adminNote: p_admin_note,
      },
    });

    return { success: true };
  });

  res.json(result);
}));

export default router;
