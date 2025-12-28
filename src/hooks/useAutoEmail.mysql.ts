import { apiClient } from '@/lib/api-client';

// Email template types - 89 templates total
export const EMAIL_TEMPLATES = {
  // Authentication & Account
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  OTP_VERIFICATION: 'otp_verification',
  LOGIN_NOTIFICATION: 'login_notification',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  SECURITY_ALERT: 'security_alert',
  PROFILE_UPDATED: 'profile_updated',
  ACCOUNT_BANNED: 'account_banned',
  ACCOUNT_UNBANNED: 'account_unbanned',
  ACCOUNT_REACTIVATION: 'account_reactivation',
  ACCOUNT_DELETION_REQUEST: 'account_deletion_request',
  
  // Orders
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_PROCESSING: 'order_processing',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',
  ORDER_STATUS_UPDATE: 'order_status_update',
  ORDER_ACCOUNT_DELIVERED: 'order_account_delivered',
  
  // Payments & Wallet
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  DEPOSIT_SUCCESS: 'deposit_success',
  TOPUP_SUCCESS: 'topup_success',
  TOPUP_FAILED: 'topup_failed',
  WITHDRAWAL_REQUEST: 'withdrawal_request',
  WITHDRAWAL_SUCCESS: 'withdrawal_success',
  WITHDRAWAL_FAILED: 'withdrawal_failed',
  INVOICE_SENT: 'invoice_sent',
  MONTHLY_STATEMENT: 'monthly_statement',
  
  // Referral & Affiliate
  REFERRAL_REGISTRATION_RECEIVED: 'referral_registration_received',
  REFERRAL_APPROVED: 'referral_approved',
  REFERRAL_REJECTED: 'referral_rejected',
  REFERRAL_COMMISSION: 'referral_commission',
  AFFILIATE_PAYOUT: 'affiliate_payout',
  AFFILIATE_TIER_UPGRADE: 'affiliate_tier_upgrade',
  
  // Tickets & Support
  TICKET_CREATED: 'ticket_created',
  TICKET_REPLY: 'ticket_reply',
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_RESOLVED: 'dispute_resolved',
  
  // VIP & Prime
  VIP_LEVEL_UP: 'vip_level_up',
  PRIME_ACTIVATED: 'prime_activated',
  PRIME_EXPIRING: 'prime_expiring',
  PRIME_EXPIRED: 'prime_expired',
  
  // Subscriptions
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_RENEWAL_REMINDER: 'subscription_renewal_reminder',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Flash Sales & Promotions
  FLASH_SALE_NOTIFICATION: 'flash_sale_notification',
  NEW_PRODUCT_NOTIFICATION: 'new_product_notification',
  WISHLIST_PRICE_DROP: 'wishlist_price_drop',
  WISHLIST_BACK_IN_STOCK: 'wishlist_back_in_stock',
  WISHLIST_SALE: 'wishlist_sale',
  STOCK_BACK: 'stock_back',
  
  // Vouchers & Gifts
  VOUCHER_GIFT: 'voucher_gift',
  VOUCHER_EXPIRING: 'voucher_expiring',
  GIFT_CARD_RECEIVED: 'gift_card_received',
  GIFT_CARD_SENT: 'gift_card_sent',
  
  // Group Orders
  GROUP_ORDER_INVITATION: 'group_order_invitation',
  GROUP_ORDER_SUCCESS: 'group_order_success',
  GROUP_ORDER_FAILED: 'group_order_failed',
  
  // Auctions
  AUCTION_BID_PLACED: 'auction_bid_placed',
  AUCTION_OUTBID: 'auction_outbid',
  AUCTION_WON: 'auction_won',
  AUCTION_LOST: 'auction_lost',
  
  // Gamification
  DAILY_CHECKIN_REWARD: 'daily_checkin_reward',
  POINTS_EARNED: 'points_earned',
  POINTS_REDEEMED: 'points_redeemed',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',
  REWARD_CLAIM_REMINDER: 'reward_claim_reminder',
  
  // Social
  NEW_FOLLOWER: 'new_follower',
  NEW_COMMENT: 'new_comment',
  NEW_REVIEW: 'new_review',
  REVIEW_REMINDER: 'review_reminder',
  NEW_MESSAGE: 'new_message',
  CHAT_MESSAGE: 'chat_message',
  BIRTHDAY_GREETING: 'birthday_greeting',
  
  // Seller
  PRODUCT_APPROVED: 'product_approved',
  PRODUCT_REJECTED: 'product_rejected',
  SELLER_APPROVED: 'seller_approved',
  SELLER_REJECTED: 'seller_rejected',
  SELLER_NEW_SALE: 'seller_new_sale',
  SELLER_DAILY_REPORT: 'seller_daily_report',
  LOW_STOCK_ALERT: 'low_stock_alert',
  
  // Cart & Shopping
  CART_ABANDONED: 'cart_abandoned',
  
  // Events & System
  EVENT_INVITATION: 'event_invitation',
  EVENT_REMINDER: 'event_reminder',
  MAINTENANCE_NOTICE: 'maintenance_notice',
  SYSTEM_UPDATE: 'system_update',
  SURVEY_INVITATION: 'survey_invitation',
  WEEKLY_DIGEST: 'weekly_digest',
  
  // Legacy aliases (for backward compatibility)
  VIP_UPGRADE: 'vip_level_up',
} as const;

// Get user's preferred language
const getUserLanguage = (): string => {
  return localStorage.getItem('preferred_language') || 
         navigator.language?.split('-')[0] || 
         'vi';
};

// Format currency based on language
const formatCurrency = (amount: number, lang: string): string => {
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  const currency = lang === 'vi' ? 'VND' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date based on language
const formatDate = (date: Date, lang: string): string => {
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Base send email function
const sendEmail = async (
  templateName: string,
  recipientEmail: string,
  data: Record<string, string>,
  lang: string = 'vi'
) => {
  try {
    const response = await apiClient.post('/email/send', {
      template: templateName,
      recipient: recipientEmail,
      data,
      lang,
    });
    return { success: true, data: response };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ORDER EMAILS ====================

// Send order confirmation email
export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderItems: string,
  totalAmount: number,
  orderUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.ORDER_CONFIRMATION, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    order_items: orderItems,
    total_amount: formatCurrency(totalAmount, lang),
    order_url: orderUrl,
  }, lang);
};

// Send order status update email
export const sendOrderStatusEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderStatus: string,
  orderUrl: string
) => {
  const lang = getUserLanguage();
  const statusTranslations: Record<string, Record<string, string>> = {
    vi: {
      pending: 'Đang chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    },
    en: {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    },
  };
  const translatedStatus = statusTranslations[lang]?.[orderStatus] || orderStatus;
  
  return sendEmail(EMAIL_TEMPLATES.ORDER_STATUS_UPDATE, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    order_status: translatedStatus,
    order_url: orderUrl,
  }, lang);
};

// Send order cancelled email
export const sendOrderCancelledEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  cancelReason: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.ORDER_CANCELLED, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    cancel_reason: cancelReason,
  }, lang);
};

// Send order refund email
export const sendOrderRefundEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  refundAmount: number,
  refundReason: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.ORDER_REFUNDED, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    refund_amount: formatCurrency(refundAmount, lang),
    refund_reason: refundReason,
  }, lang);
};

// Send account delivery email
export const sendAccountDeliveryEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  accountDetails: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.ORDER_ACCOUNT_DELIVERED, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    account_details: accountDetails,
  }, lang);
};

// ==================== USER EMAILS ====================

// Send welcome email
export const sendWelcomeEmail = async (
  userEmail: string,
  fullName: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.WELCOME, userEmail, {
    full_name: fullName || (lang === 'en' ? 'User' : 'Người dùng'),
  }, lang);
};

// Send OTP verification email
export const sendOTPEmail = async (
  userEmail: string,
  otpCode: string,
  fullName?: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.OTP_VERIFICATION, userEmail, {
    full_name: fullName || userEmail.split('@')[0],
    otp_code: otpCode,
  }, lang);
};

// Send password reset email
export const sendPasswordResetEmail = async (
  userEmail: string,
  resetLink: string,
  fullName?: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.PASSWORD_RESET, userEmail, {
    full_name: fullName || userEmail.split('@')[0],
    reset_link: resetLink,
  }, lang);
};

// ==================== CHAT EMAILS ====================

// Send new message notification email
export const sendNewMessageEmail = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  chatUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.NEW_MESSAGE, recipientEmail, {
    recipient_name: recipientName,
    sender_name: senderName,
    message_preview: messagePreview,
    chat_url: chatUrl,
  }, lang);
};

// Send chat message notification
export const sendChatMessageEmail = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  chatUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.CHAT_MESSAGE, recipientEmail, {
    recipient_name: recipientName,
    sender_name: senderName,
    message_preview: messagePreview,
    chat_url: chatUrl,
  }, lang);
};

// ==================== DEPOSIT EMAILS ====================

// Send deposit success email
export const sendDepositSuccessEmail = async (
  userEmail: string,
  fullName: string,
  amount: number,
  balance: number
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.DEPOSIT_SUCCESS, userEmail, {
    full_name: fullName,
    amount: formatCurrency(amount, lang),
    balance: formatCurrency(balance, lang),
  }, lang);
};

// ==================== AUCTION EMAILS ====================

// Send auction outbid notification
export const sendAuctionOutbidEmail = async (
  userEmail: string,
  customerName: string,
  auctionTitle: string,
  yourBid: number,
  currentPrice: number,
  auctionUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.AUCTION_OUTBID, userEmail, {
    customer_name: customerName,
    auction_title: auctionTitle,
    your_bid: formatCurrency(yourBid, lang),
    current_price: formatCurrency(currentPrice, lang),
    auction_url: auctionUrl,
  }, lang);
};

// Send auction won notification
export const sendAuctionWonEmail = async (
  userEmail: string,
  customerName: string,
  auctionTitle: string,
  winningPrice: number,
  paymentUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.AUCTION_WON, userEmail, {
    customer_name: customerName,
    auction_title: auctionTitle,
    winning_price: formatCurrency(winningPrice, lang),
    payment_url: paymentUrl,
  }, lang);
};

// ==================== GIFT CARD EMAILS ====================

// Send gift card received notification
export const sendGiftCardReceivedEmail = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  amount: number,
  message: string,
  giftCode: string,
  redeemUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.GIFT_CARD_RECEIVED, recipientEmail, {
    recipient_name: recipientName || (lang === 'en' ? 'Friend' : 'Bạn'),
    sender_name: senderName,
    amount: formatCurrency(amount, lang),
    message: message || '',
    gift_code: giftCode,
    redeem_url: redeemUrl,
  }, lang);
};

// ==================== PRODUCT EMAILS ====================

// Send wishlist sale notification
export const sendWishlistSaleEmail = async (
  userEmail: string,
  customerName: string,
  productName: string,
  originalPrice: number,
  salePrice: number,
  discountPercent: number,
  productUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.WISHLIST_SALE, userEmail, {
    customer_name: customerName,
    product_name: productName,
    original_price: formatCurrency(originalPrice, lang),
    sale_price: formatCurrency(salePrice, lang),
    discount_percent: discountPercent.toString(),
    product_url: productUrl,
  }, lang);
};

// Send stock back notification
export const sendStockBackEmail = async (
  userEmail: string,
  customerName: string,
  productName: string,
  productUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.STOCK_BACK, userEmail, {
    customer_name: customerName,
    product_name: productName,
    product_url: productUrl,
  }, lang);
};

// ==================== REFERRAL EMAILS ====================

// Send referral registration received
export const sendReferralRegistrationEmail = async (
  userEmail: string,
  fullName: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.REFERRAL_REGISTRATION_RECEIVED, userEmail, {
    full_name: fullName,
  }, lang);
};

// Send referral approved
export const sendReferralApprovedEmail = async (
  userEmail: string,
  fullName: string,
  referralCode: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.REFERRAL_APPROVED, userEmail, {
    full_name: fullName,
    referral_code: referralCode,
  }, lang);
};

// Send referral commission notification
export const sendReferralCommissionEmail = async (
  userEmail: string,
  fullName: string,
  commissionAmount: number,
  orderNumber: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.REFERRAL_COMMISSION, userEmail, {
    full_name: fullName,
    commission_amount: formatCurrency(commissionAmount, lang),
    order_number: orderNumber,
  }, lang);
};

// ==================== TICKET EMAILS ====================

// Send ticket created
export const sendTicketCreatedEmail = async (
  userEmail: string,
  fullName: string,
  ticketNumber: string,
  subject: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.TICKET_CREATED, userEmail, {
    full_name: fullName,
    ticket_number: ticketNumber,
    subject,
  }, lang);
};

// Send ticket reply notification
export const sendTicketReplyEmail = async (
  userEmail: string,
  fullName: string,
  ticketNumber: string,
  subject: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.TICKET_REPLY, userEmail, {
    full_name: fullName,
    ticket_number: ticketNumber,
    subject,
  }, lang);
};

// ==================== VIP EMAILS ====================

// Send VIP upgrade notification
export const sendVIPUpgradeEmail = async (
  userEmail: string,
  fullName: string,
  vipLevel: string,
  discountPercent: number
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.VIP_UPGRADE, userEmail, {
    full_name: fullName,
    vip_level: vipLevel,
    discount_percent: discountPercent.toString(),
  }, lang);
};

// ==================== INVOICE EMAILS ====================

// Send invoice email
export const sendInvoiceEmail = async (
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  totalAmount: number,
  invoiceLink: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.INVOICE_SENT, customerEmail, {
    customer_name: customerName,
    order_number: orderNumber,
    total_amount: formatCurrency(totalAmount, lang),
    created_date: formatDate(new Date(), lang),
    invoice_link: invoiceLink,
  }, lang);
};

// ==================== BULK EMAIL ====================

// Send direct/bulk email
export const sendDirectEmail = async (
  recipient: string,
  subject: string,
  htmlContent: string
) => {
  try {
    const response = await apiClient.post('/email/send-direct', {
      recipient,
      subject,
      html: htmlContent,
    });
    return { success: true, data: response };
  } catch (error: any) {
    console.error('[Email] Failed to send direct email:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
export const sendBulkEmail = async (
  recipients: string[],
  subject: string,
  htmlContent: string
) => {
  try {
    const response = await apiClient.post('/email/send-bulk', {
      recipients,
      subject,
      html: htmlContent,
    });
    return { success: true, data: response };
  } catch (error: any) {
    console.error('[Email] Failed to send bulk email:', error);
    return { success: false, error: error.message };
  }
};
