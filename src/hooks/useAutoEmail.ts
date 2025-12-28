import { supabase } from '@/integrations/supabase/client';

// Get user's preferred language
const getUserLanguage = (): 'vi' | 'en' => {
  const stored = localStorage.getItem('language');
  return (stored === 'en' ? 'en' : 'vi') as 'vi' | 'en';
};

// Format currency based on language
const formatCurrency = (amount: number, language: 'vi' | 'en' = 'vi'): string => {
  if (language === 'en') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 23000);
  }
  return amount.toLocaleString('vi-VN') + 'đ';
};

// Format date based on language
const formatDate = (date: Date = new Date(), language: 'vi' | 'en' = 'vi'): string => {
  return date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
};

// Base email sending function
const sendEmail = async (
  templateName: string,
  recipient: string,
  variables: Record<string, string>,
  language?: 'vi' | 'en'
) => {
  try {
    const lang = language || getUserLanguage();
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        recipient,
        template_name: templateName,
        variables,
        language: lang,
      },
    });

    if (error) {
      console.error(`[Email] Failed to send ${templateName}:`, error);
      return { success: false, error };
    }
    
    console.log(`[Email] Sent ${templateName} to ${recipient}`);
    return { success: true };
  } catch (err) {
    console.error(`[Email] Error sending ${templateName}:`, err);
    return { success: false, error: err };
  }
};

// Template names for order events
export const ORDER_EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_PROCESSING: 'order_processing',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',
} as const;

// All template names
export const EMAIL_TEMPLATES = {
  // Order related
  ...ORDER_EMAIL_TEMPLATES,
  
  // User related
  WELCOME: 'welcome',
  LOGIN_NOTIFICATION: 'login_notification',
  OTP_VERIFICATION: 'otp_verification',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_VERIFICATION: 'email_verification',
  DEPOSIT_SUCCESS: 'deposit_success',
  WITHDRAWAL_REQUEST: 'withdrawal_request',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  
  // Chat related
  CHAT_NEW_MESSAGE_ADMIN: 'chat_new_message_admin',
  CHAT_NEW_MESSAGE_USER: 'chat_new_message_user',
  
  // Ticket related
  TICKET_CREATED: 'ticket_created',
  TICKET_REPLY: 'ticket_reply',
  TICKET_CLOSED: 'ticket_closed',
  
  // Referral related
  REFERRAL_REGISTRATION_RECEIVED: 'referral_registration_received',
  REFERRAL_APPROVED: 'referral_approved',
  REFERRAL_REJECTED: 'referral_rejected',
  REFERRAL_REWARD: 'referral_reward',
  REFERRAL_COMMISSION: 'referral_commission',
  REWARD_REQUEST_RECEIVED: 'reward_request_received',
  
  // Auction related
  AUCTION_OUTBID: 'auction_outbid',
  AUCTION_WON: 'auction_won',
  AUCTION_ENDED: 'auction_ended',
  AUCTION_STARTING_SOON: 'auction_starting_soon',
  
  // Gift Card related
  GIFT_CARD_RECEIVED: 'gift_card_received',
  GIFT_CARD_USED: 'gift_card_used',
  
  // Product related
  WISHLIST_SALE: 'wishlist_sale',
  STOCK_BACK: 'stock_back',
  PRICE_DROP: 'price_drop',
  
  // SMM related
  SMM_ORDER_COMPLETED: 'smm_order_completed',
  SMM_ORDER_PARTIAL: 'smm_order_partial',
  SMM_ORDER_CANCELLED: 'smm_order_cancelled',
  
  // Invoice
  INVOICE_SENT: 'invoice_sent',
  
  // Newsletter
  NEWSLETTER: 'newsletter',
  
  // VIP
  VIP_UPGRADE: 'vip_upgrade',
  VIP_EXPIRING: 'vip_expiring',
} as const;

// Map order status to email template
export const getEmailTemplateForStatus = (status: string): string | null => {
  const statusTemplateMap: Record<string, string> = {
    'PAID': ORDER_EMAIL_TEMPLATES.PAYMENT_SUCCESS,
    'PAYMENT_FAILED': ORDER_EMAIL_TEMPLATES.PAYMENT_FAILED,
    'PROCESSING': ORDER_EMAIL_TEMPLATES.ORDER_PROCESSING,
    'DELIVERED': ORDER_EMAIL_TEMPLATES.ORDER_DELIVERED,
    'COMPLETED': ORDER_EMAIL_TEMPLATES.ORDER_COMPLETED,
    'CANCELLED': ORDER_EMAIL_TEMPLATES.ORDER_CANCELLED,
    'REFUNDED': ORDER_EMAIL_TEMPLATES.ORDER_REFUNDED,
  };

  return statusTemplateMap[status] || null;
};

// ==================== ORDER EMAILS ====================

// Send order-related email
export const sendOrderEmail = async (
  templateName: string,
  orderData: {
    order_number: string;
    customer_email: string;
    customer_name?: string;
    total_amount: number;
    delivery_content?: string;
    refund_amount?: number;
    refund_reason?: string;
    payment_provider?: string;
  },
  language?: 'vi' | 'en'
) => {
  const lang = language || getUserLanguage();
  const variables: Record<string, string> = {
    order_number: orderData.order_number,
    customer_email: orderData.customer_email,
    customer_name: orderData.customer_name || (lang === 'en' ? 'Valued Customer' : 'Quý khách'),
    total_amount: formatCurrency(orderData.total_amount, lang),
    delivery_content: orderData.delivery_content || '',
    date: formatDate(new Date(), lang),
  };

  if (orderData.refund_amount !== undefined) {
    variables.refund_amount = formatCurrency(orderData.refund_amount, lang);
  }
  if (orderData.refund_reason) {
    variables.refund_reason = orderData.refund_reason;
  }
  if (orderData.payment_provider) {
    variables.payment_provider = orderData.payment_provider;
  }

  return sendEmail(templateName, orderData.customer_email, variables, lang);
};

// ==================== USER EMAILS ====================

// Send welcome email
export const sendWelcomeEmail = async (
  userEmail: string,
  fullName: string,
  loginUrl: string = window.location.origin + '/auth'
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.WELCOME, userEmail, {
    full_name: fullName || (lang === 'en' ? 'Friend' : 'Bạn'),
    login_url: loginUrl,
  }, lang);
};

// Send login notification
export const sendLoginNotificationEmail = async (
  userEmail: string,
  fullName: string,
  loginTime: Date,
  device: string,
  location: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.LOGIN_NOTIFICATION, userEmail, {
    full_name: fullName,
    login_time: formatDate(loginTime, lang),
    device,
    location,
  }, lang);
};

// Send OTP verification email
export const sendOTPEmail = async (
  userEmail: string,
  fullName: string,
  otpCode: string,
  expiryMinutes: number = 10
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.OTP_VERIFICATION, userEmail, {
    full_name: fullName,
    otp_code: otpCode,
    expiry_minutes: expiryMinutes.toString(),
  }, lang);
};

// Send password reset email
export const sendPasswordResetEmail = async (
  userEmail: string,
  fullName: string,
  resetUrl: string
) => {
  const lang = getUserLanguage();
  return sendEmail(EMAIL_TEMPLATES.PASSWORD_RESET, userEmail, {
    full_name: fullName,
    reset_url: resetUrl,
  }, lang);
};

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
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        recipient,
        subject,
        html: htmlContent,
      },
    });

    if (error) {
      console.error('[Email] Failed to send direct email:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (err) {
    console.error('[Email] Error sending direct email:', err);
    return { success: false, error: err };
  }
};
