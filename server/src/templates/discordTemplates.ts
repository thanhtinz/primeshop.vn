// Discord notification message templates
export interface DiscordMessageTemplate {
  title: string;
  message: string;
  color: number;
  footer?: string;
  thumbnail?: string;
}

export const DISCORD_TEMPLATES = {
  // ============ ORDER NOTIFICATIONS ============
  ORDER_PLACED: (data: { orderNumber: string; total: string; items: number }) => ({
    title: '🛒 Order Placed Successfully',
    message: `Your order **#${data.orderNumber}** has been placed and is being processed.\n\nWe'll notify you once it's ready for delivery.`,
    color: 0x00D26A,
    metadata: {
      'Order Number': `#${data.orderNumber}`,
      'Total Amount': data.total,
      'Items': data.items.toString(),
      'Status': 'Processing',
    },
  }),

  ORDER_CONFIRMED: (data: { orderNumber: string; total: string }) => ({
    title: '✅ Order Confirmed',
    message: `Your order **#${data.orderNumber}** has been confirmed and will be delivered soon.`,
    color: 0x00D26A,
    metadata: {
      'Order Number': `#${data.orderNumber}`,
      'Total Amount': data.total,
      'Status': 'Confirmed',
    },
  }),

  ORDER_DELIVERED: (data: { orderNumber: string; total: string; items: number }) => ({
    title: '🎉 Order Delivered!',
    message: `Great news! Your order **#${data.orderNumber}** has been successfully delivered.\n\nThank you for shopping with us!`,
    color: 0x00D26A,
    metadata: {
      'Order Number': `#${data.orderNumber}`,
      'Total Amount': data.total,
      'Items Delivered': data.items.toString(),
    },
  }),

  ORDER_CANCELLED: (data: { orderNumber: string; reason?: string }) => ({
    title: '❌ Order Cancelled',
    message: `Your order **#${data.orderNumber}** has been cancelled.\n${data.reason ? `\n**Reason:** ${data.reason}` : ''}`,
    color: 0xEF4444,
    metadata: {
      'Order Number': `#${data.orderNumber}`,
      'Status': 'Cancelled',
    },
  }),

  ORDER_REFUNDED: (data: { orderNumber: string; amount: string }) => ({
    title: '💸 Order Refunded',
    message: `Your order **#${data.orderNumber}** has been refunded.\n\nThe amount will be credited back to your wallet.`,
    color: 0xF59E0B,
    metadata: {
      'Order Number': `#${data.orderNumber}`,
      'Refund Amount': data.amount,
    },
  }),

  // ============ PAYMENT NOTIFICATIONS ============
  PAYMENT_SUCCESS: (data: { amount: string; method: string; transactionId: string }) => ({
    title: '💰 Payment Successful',
    message: `Your payment of **${data.amount}** has been processed successfully!`,
    color: 0x00D26A,
    metadata: {
      'Amount': data.amount,
      'Payment Method': data.method,
      'Transaction ID': data.transactionId,
      'Status': 'Completed',
    },
  }),

  PAYMENT_FAILED: (data: { amount: string; reason: string }) => ({
    title: '❌ Payment Failed',
    message: `Your payment of **${data.amount}** could not be processed.\n\n**Reason:** ${data.reason}\n\nPlease try again or contact support.`,
    color: 0xEF4444,
    metadata: {
      'Amount': data.amount,
      'Status': 'Failed',
    },
  }),

  DEPOSIT_SUCCESS: (data: { amount: string; balance: string }) => ({
    title: '💵 Deposit Successful',
    message: `**${data.amount}** has been added to your wallet.\n\nYour new balance is **${data.balance}**.`,
    color: 0x00D26A,
    metadata: {
      'Deposit Amount': data.amount,
      'New Balance': data.balance,
    },
  }),

  WITHDRAWAL_REQUEST: (data: { amount: string; bankName: string }) => ({
    title: '🏦 Withdrawal Request Received',
    message: `Your withdrawal request for **${data.amount}** has been received and is being processed.\n\nFunds will be transferred to your ${data.bankName} account within 1-3 business days.`,
    color: 0xF59E0B,
    metadata: {
      'Amount': data.amount,
      'Bank': data.bankName,
      'Status': 'Processing',
    },
  }),

  WITHDRAWAL_COMPLETED: (data: { amount: string; bankName: string }) => ({
    title: '✅ Withdrawal Completed',
    message: `Your withdrawal of **${data.amount}** has been completed!\n\nPlease check your ${data.bankName} account.`,
    color: 0x00D26A,
    metadata: {
      'Amount': data.amount,
      'Bank': data.bankName,
    },
  }),

  // ============ ACCOUNT NOTIFICATIONS ============
  WELCOME: (data: { username: string }) => ({
    title: '🎉 Welcome to Prime Shop!',
    message: `Hi **${data.username}**!\n\nThank you for joining Prime Shop. We're excited to have you here!\n\nYour Discord account has been successfully linked. You'll now receive important notifications right here in your DMs.`,
    color: 0x3B82F6,
    metadata: {
      'Username': data.username,
      'Account Type': 'User',
    },
  }),

  PROFILE_UPDATED: (data: { changes: string[] }) => ({
    title: '✏️ Profile Updated',
    message: `Your profile has been updated successfully.\n\n**Changes:**\n${data.changes.map(c => `• ${c}`).join('\n')}`,
    color: 0x3B82F6,
  }),

  VIP_UPGRADE: (data: { tier: string; benefits: string[] }) => ({
    title: '⭐ VIP Tier Upgraded!',
    message: `Congratulations! You've been upgraded to **${data.tier}** tier!\n\n**New Benefits:**\n${data.benefits.map(b => `• ${b}`).join('\n')}`,
    color: 0xF59E0B,
    metadata: {
      'New Tier': data.tier,
    },
  }),

  ACHIEVEMENT_UNLOCKED: (data: { name: string; description: string; reward?: string }) => ({
    title: '🏆 Achievement Unlocked!',
    message: `**${data.name}**\n\n${data.description}${data.reward ? `\n\n**Reward:** ${data.reward}` : ''}`,
    color: 0xF59E0B,
  }),

  // ============ SECURITY NOTIFICATIONS ============
  LOGIN_ALERT: (data: { ip: string; location: string; device: string; time: string }) => ({
    title: '🔐 New Login Detected',
    message: `A new login to your account was detected.\n\n**If this wasn't you, please secure your account immediately.**`,
    color: 0xEF4444,
    metadata: {
      'IP Address': data.ip,
      'Location': data.location,
      'Device': data.device,
      'Time': data.time,
    },
  }),

  PASSWORD_CHANGED: (data: { time: string; ip: string }) => ({
    title: '🔒 Password Changed',
    message: `Your password has been changed successfully.\n\n**If you didn't make this change, contact support immediately.**`,
    color: 0xF59E0B,
    metadata: {
      'Changed At': data.time,
      'IP Address': data.ip,
    },
  }),

  SUSPICIOUS_ACTIVITY: (data: { activity: string; time: string }) => ({
    title: '⚠️ Suspicious Activity Detected',
    message: `We detected suspicious activity on your account:\n\n**${data.activity}**\n\nFor your security, please verify your account and change your password if necessary.`,
    color: 0xEF4444,
    metadata: {
      'Activity': data.activity,
      'Detected At': data.time,
    },
  }),

  TWO_FACTOR_ENABLED: () => ({
    title: '✅ Two-Factor Authentication Enabled',
    message: `Two-factor authentication has been successfully enabled on your account.\n\nYour account is now more secure!`,
    color: 0x00D26A,
  }),

  // ============ SOCIAL NOTIFICATIONS ============
  NEW_FOLLOWER: (data: { username: string; profileUrl: string }) => ({
    title: '👥 New Follower',
    message: `**${data.username}** started following you!`,
    color: 0xEC4899,
    metadata: {
      'User': data.username,
    },
  }),

  POST_LIKED: (data: { username: string; postTitle: string }) => ({
    title: '❤️ Someone Liked Your Post',
    message: `**${data.username}** liked your post: "${data.postTitle}"`,
    color: 0xEC4899,
  }),

  NEW_COMMENT: (data: { username: string; postTitle: string; comment: string }) => ({
    title: '💬 New Comment on Your Post',
    message: `**${data.username}** commented on "${data.postTitle}":\n\n"${comment.length > 100 ? comment.substring(0, 100) + '...' : comment}"`,
    color: 0xEC4899,
  }),

  FRIEND_REQUEST: (data: { username: string }) => ({
    title: '🤝 Friend Request',
    message: `**${data.username}** sent you a friend request!`,
    color: 0xEC4899,
    metadata: {
      'From': data.username,
    },
  }),

  // ============ MARKETPLACE NOTIFICATIONS ============
  SHOP_APPROVED: (data: { shopName: string }) => ({
    title: '🏪 Shop Approved!',
    message: `Congratulations! Your shop **${data.shopName}** has been approved and is now live!`,
    color: 0x8B5CF6,
    metadata: {
      'Shop Name': data.shopName,
      'Status': 'Active',
    },
  }),

  NEW_SALE: (data: { productName: string; amount: string; buyer: string }) => ({
    title: '💰 New Sale!',
    message: `You made a sale!\n\n**${data.productName}** was purchased by **${data.buyer}**.`,
    color: 0x8B5CF6,
    metadata: {
      'Product': data.productName,
      'Amount': data.amount,
      'Buyer': data.buyer,
    },
  }),

  PRODUCT_REVIEW: (data: { productName: string; rating: number; reviewer: string }) => ({
    title: '⭐ New Product Review',
    message: `**${data.reviewer}** left a ${data.rating}-star review on your product: **${data.productName}**`,
    color: 0x8B5CF6,
    metadata: {
      'Product': data.productName,
      'Rating': `${data.rating}/5 ⭐`,
      'Reviewer': data.reviewer,
    },
  }),

  LOW_STOCK_ALERT: (data: { productName: string; remaining: number }) => ({
    title: '📦 Low Stock Alert',
    message: `Your product **${data.productName}** is running low!\n\nOnly **${data.remaining}** items remaining. Consider restocking.`,
    color: 0xF59E0B,
    metadata: {
      'Product': data.productName,
      'Remaining Stock': data.remaining.toString(),
    },
  }),

  SELLER_PAYOUT: (data: { amount: string; period: string }) => ({
    title: '💸 Seller Payout',
    message: `Your seller payout for ${data.period} has been processed!\n\nAmount: **${data.amount}**`,
    color: 0x00D26A,
    metadata: {
      'Amount': data.amount,
      'Period': data.period,
    },
  }),

  // ============ SYSTEM NOTIFICATIONS ============
  MAINTENANCE_SCHEDULED: (data: { startTime: string; duration: string }) => ({
    title: '🔧 Scheduled Maintenance',
    message: `Prime Shop will undergo scheduled maintenance.\n\n**Start Time:** ${data.startTime}\n**Duration:** ${data.duration}\n\nThe site may be unavailable during this time.`,
    color: 0x6B7280,
    metadata: {
      'Start Time': data.startTime,
      'Duration': data.duration,
    },
  }),

  NEW_FEATURE: (data: { featureName: string; description: string }) => ({
    title: '🎊 New Feature Released!',
    message: `**${data.featureName}**\n\n${data.description}`,
    color: 0x3B82F6,
  }),

  ANNOUNCEMENT: (data: { title: string; message: string }) => ({
    title: `📢 ${data.title}`,
    message: data.message,
    color: 0x3B82F6,
  }),

  VOUCHER_AVAILABLE: (data: { code: string; discount: string; expiresAt: string }) => ({
    title: '🎁 New Voucher Available!',
    message: `Use code **${data.code}** to get ${data.discount} discount!\n\n**Expires:** ${data.expiresAt}`,
    color: 0xF59E0B,
    metadata: {
      'Voucher Code': data.code,
      'Discount': data.discount,
      'Expires At': data.expiresAt,
    },
  }),

  FLASH_SALE_ALERT: (data: { productName: string; discount: string; endsAt: string }) => ({
    title: '⚡ Flash Sale Alert!',
    message: `**${data.productName}** is on flash sale!\n\nGet ${data.discount} discount - ends ${data.endsAt}!`,
    color: 0xEF4444,
    metadata: {
      'Product': data.productName,
      'Discount': data.discount,
      'Ends At': data.endsAt,
    },
  }),

  // ============ SUPPORT NOTIFICATIONS ============
  TICKET_CREATED: (data: { ticketId: string; subject: string }) => ({
    title: '🎫 Support Ticket Created',
    message: `Your support ticket **#${data.ticketId}** has been created.\n\n**Subject:** ${data.subject}\n\nOur team will respond shortly.`,
    color: 0x3B82F6,
    metadata: {
      'Ticket ID': `#${data.ticketId}`,
      'Subject': data.subject,
    },
  }),

  TICKET_REPLIED: (data: { ticketId: string; responder: string }) => ({
    title: '💬 Support Ticket Updated',
    message: `**${data.responder}** replied to your ticket **#${data.ticketId}**.`,
    color: 0x3B82F6,
    metadata: {
      'Ticket ID': `#${data.ticketId}`,
      'Responder': data.responder,
    },
  }),

  TICKET_RESOLVED: (data: { ticketId: string }) => ({
    title: '✅ Support Ticket Resolved',
    message: `Your support ticket **#${data.ticketId}** has been marked as resolved.\n\nThank you for contacting us!`,
    color: 0x00D26A,
    metadata: {
      'Ticket ID': `#${data.ticketId}`,
      'Status': 'Resolved',
    },
  }),
};

// Helper function to get template
export function getDiscordTemplate(
  templateKey: keyof typeof DISCORD_TEMPLATES,
  data: any
): { title: string; message: string; color: number; metadata?: Record<string, string> } {
  const template = DISCORD_TEMPLATES[templateKey];
  if (typeof template === 'function') {
    return template(data);
  }
  return template;
}

// Color constants
export const DISCORD_COLORS = {
  SUCCESS: 0x00D26A,   // Green
  WARNING: 0xF59E0B,   // Orange
  ERROR: 0xEF4444,     // Red
  INFO: 0x3B82F6,      // Blue
  SOCIAL: 0xEC4899,    // Pink
  MARKETPLACE: 0x8B5CF6, // Purple
  SYSTEM: 0x6B7280,    // Gray
};
