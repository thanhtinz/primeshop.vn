import { db } from '@/lib/api-client';

export type NotificationType = 'order' | 'security' | 'system' | 'promo';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Create a single notification
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link
}: CreateNotificationParams) => {
  try {
    const { error } = await db
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

// Create notifications for multiple users
export const createBulkNotifications = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      link,
    }));

    const { error } = await db
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating bulk notifications:', error);
    }
  } catch (err) {
    console.error('Failed to create bulk notifications:', err);
  }
};

// ================== ORDER NOTIFICATIONS ==================

export const notifyOrderCreated = async (userId: string, orderNumber: string, orderType: string, link?: string) => {
  const typeLabels: Record<string, string> = {
    premium: 'Premium',
    account: 'Tài khoản',
    topup: 'Nạp game',
    design: 'Thiết kế',
    smm: 'SMM',
    default: 'Đơn hàng'
  };
  
  const typeLabel = typeLabels[orderType] || typeLabels.default;
  
  await createNotification({
    userId,
    type: 'order',
    title: `Đặt hàng ${typeLabel} thành công`,
    message: `Đơn hàng ${orderNumber} đã được tạo thành công. Vui lòng thanh toán để tiếp tục.`,
    link: link || `/orders/${orderNumber}`,
  });
};

export const notifyOrderPaid = async (userId: string, orderNumber: string, link?: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Thanh toán thành công',
    message: `Đơn hàng ${orderNumber} đã được thanh toán. Đang xử lý giao hàng...`,
    link: link || `/orders/${orderNumber}`,
  });
};

export const notifyOrderCompleted = async (userId: string, orderNumber: string, link?: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Đơn hàng hoàn thành',
    message: `Đơn hàng ${orderNumber} đã hoàn thành. Cảm ơn bạn đã mua hàng!`,
    link: link || `/orders/${orderNumber}`,
  });
};

export const notifyOrderCancelled = async (userId: string, orderNumber: string, reason?: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Đơn hàng đã hủy',
    message: reason 
      ? `Đơn hàng ${orderNumber} đã bị hủy. Lý do: ${reason}` 
      : `Đơn hàng ${orderNumber} đã bị hủy.`,
    link: `/orders/${orderNumber}`,
  });
};

export const notifyOrderRefunded = async (userId: string, orderNumber: string, amount: number) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Hoàn tiền thành công',
    message: `Đơn hàng ${orderNumber} đã được hoàn ${amount.toLocaleString('vi-VN')}đ vào ví của bạn.`,
    link: `/orders/${orderNumber}`,
  });
};

export const notifyOrderDelivered = async (userId: string, orderNumber: string, link?: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Đơn hàng đã giao',
    message: `Đơn hàng ${orderNumber} đã được giao. Vui lòng kiểm tra và xác nhận nhận hàng.`,
    link: link || `/orders/${orderNumber}`,
  });
};

// ================== SELLER ORDER NOTIFICATIONS ==================

export const notifySellerNewOrder = async (sellerId: string, orderNumber: string, buyerName: string) => {
  await createNotification({
    userId: sellerId,
    type: 'order',
    title: 'Đơn hàng mới',
    message: `Bạn có đơn hàng mới ${orderNumber} từ ${buyerName}.`,
    link: `/seller/orders`,
  });
};

export const notifySellerOrderPaid = async (sellerId: string, orderNumber: string) => {
  await createNotification({
    userId: sellerId,
    type: 'order',
    title: 'Đơn hàng đã thanh toán',
    message: `Đơn hàng ${orderNumber} đã được thanh toán. Vui lòng xử lý giao hàng.`,
    link: `/seller/orders`,
  });
};

// ================== CHAT/MESSAGE NOTIFICATIONS ==================

export const notifyNewMessage = async (userId: string, senderName: string, roomId: string, preview?: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: `Tin nhắn mới từ ${senderName}`,
    message: preview ? preview.substring(0, 100) + (preview.length > 100 ? '...' : '') : 'Bạn có tin nhắn mới',
    link: `/chat?room=${roomId}`,
  });
};

// ================== SOCIAL NOTIFICATIONS ==================

export const notifyPostLiked = async (userId: string, likerName: string, postId: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Bài viết được yêu thích',
    message: `${likerName} đã thích bài viết của bạn.`,
    link: `/posts/${postId}`,
  });
};

export const notifyPostCommented = async (userId: string, commenterName: string, postId: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Bình luận mới',
    message: `${commenterName} đã bình luận bài viết của bạn.`,
    link: `/posts/${postId}`,
  });
};

export const notifyNewFollower = async (userId: string, followerName: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Người theo dõi mới',
    message: `${followerName} đã bắt đầu theo dõi bạn.`,
    link: `/profile`,
  });
};

// ================== PROMO NOTIFICATIONS ==================

export const notifyNewVoucher = async (userId: string, voucherCode: string, discountText: string) => {
  await createNotification({
    userId,
    type: 'promo',
    title: 'Voucher mới dành cho bạn',
    message: `Bạn nhận được voucher ${voucherCode} - ${discountText}. Sử dụng ngay!`,
    link: `/vouchers`,
  });
};

export const notifyFlashSale = async (userId: string, productName: string) => {
  await createNotification({
    userId,
    type: 'promo',
    title: 'Flash Sale đang diễn ra!',
    message: `${productName} đang giảm giá. Nhanh tay kẻo hết!`,
    link: `/flash-sale`,
  });
};

// ================== WALLET NOTIFICATIONS ==================

export const notifyDepositSuccess = async (userId: string, amount: number) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Nạp tiền thành công',
    message: `Bạn đã nạp ${amount.toLocaleString('vi-VN')}đ vào ví thành công.`,
    link: `/wallet`,
  });
};

export const notifyWithdrawSuccess = async (userId: string, amount: number) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Rút tiền thành công',
    message: `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ đã được xử lý.`,
    link: `/wallet`,
  });
};

export const notifyReferralReward = async (userId: string, amount: number, referralName: string) => {
  await createNotification({
    userId,
    type: 'promo',
    title: 'Hoa hồng giới thiệu',
    message: `Bạn nhận được ${amount.toLocaleString('vi-VN')}đ từ giới thiệu ${referralName}.`,
    link: `/referrals`,
  });
};

// ================== SECURITY NOTIFICATIONS ==================

export const notifyNewLogin = async (userId: string, device: string, location?: string) => {
  await createNotification({
    userId,
    type: 'security',
    title: 'Đăng nhập mới',
    message: location 
      ? `Tài khoản vừa đăng nhập từ ${device} tại ${location}.`
      : `Tài khoản vừa đăng nhập từ ${device}.`,
    link: `/settings/security`,
  });
};

export const notifyPasswordChanged = async (userId: string) => {
  await createNotification({
    userId,
    type: 'security',
    title: 'Mật khẩu đã thay đổi',
    message: 'Mật khẩu tài khoản của bạn đã được thay đổi thành công.',
    link: `/settings/security`,
  });
};

// ================== SYSTEM NOTIFICATIONS ==================

export const notifySystemAnnouncement = async (userIds: string[], title: string, message: string) => {
  await createBulkNotifications(userIds, 'system', title, message);
};

export const notifyAccountVerified = async (userId: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Xác thực tài khoản thành công',
    message: 'Tài khoản của bạn đã được xác thực. Bạn có thể sử dụng đầy đủ tính năng.',
    link: `/profile`,
  });
};

// ================== CHECKIN NOTIFICATIONS ==================

export const notifyCheckinReward = async (userId: string, points: number, streak: number) => {
  await createNotification({
    userId,
    type: 'promo',
    title: 'Điểm danh thành công',
    message: `Bạn nhận được ${points} điểm! Chuỗi điểm danh: ${streak} ngày.`,
    link: `/checkin`,
  });
};

// ================== AUCTION NOTIFICATIONS ==================

export const notifyAuctionOutbid = async (userId: string, auctionTitle: string, auctionId: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Đã bị vượt giá',
    message: `Có người đã đặt giá cao hơn bạn cho "${auctionTitle}".`,
    link: `/auctions/${auctionId}`,
  });
};

export const notifyAuctionWon = async (userId: string, auctionTitle: string, amount: number, auctionId: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Thắng đấu giá!',
    message: `Chúc mừng! Bạn đã thắng đấu giá "${auctionTitle}" với ${amount.toLocaleString('vi-VN')}đ.`,
    link: `/auctions/${auctionId}`,
  });
};

export const notifyAuctionEnding = async (userId: string, auctionTitle: string, auctionId: string) => {
  await createNotification({
    userId,
    type: 'order',
    title: 'Đấu giá sắp kết thúc',
    message: `"${auctionTitle}" sắp kết thúc. Đặt giá ngay!`,
    link: `/auctions/${auctionId}`,
  });
};

// ================== SELLER NOTIFICATIONS ==================

export const notifyProductApproved = async (userId: string, productName: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Sản phẩm đã duyệt',
    message: `Sản phẩm "${productName}" đã được duyệt và hiển thị trên cửa hàng.`,
    link: `/seller/products`,
  });
};

export const notifyProductRejected = async (userId: string, productName: string, reason?: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Sản phẩm bị từ chối',
    message: reason 
      ? `Sản phẩm "${productName}" bị từ chối. Lý do: ${reason}`
      : `Sản phẩm "${productName}" bị từ chối. Vui lòng kiểm tra lại.`,
    link: `/seller/products`,
  });
};

export const notifyNewReview = async (userId: string, productName: string, rating: number) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Đánh giá mới',
    message: `Sản phẩm "${productName}" nhận được đánh giá ${rating} sao.`,
    link: `/seller/reviews`,
  });
};

// ================== TICKET NOTIFICATIONS ==================

export const notifyTicketReplied = async (userId: string, ticketId: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Phản hồi yêu cầu hỗ trợ',
    message: 'Yêu cầu hỗ trợ của bạn đã có phản hồi mới.',
    link: `/support/tickets/${ticketId}`,
  });
};

export const notifyTicketResolved = async (userId: string, ticketId: string) => {
  await createNotification({
    userId,
    type: 'system',
    title: 'Yêu cầu đã giải quyết',
    message: 'Yêu cầu hỗ trợ của bạn đã được giải quyết.',
    link: `/support/tickets/${ticketId}`,
  });
};
