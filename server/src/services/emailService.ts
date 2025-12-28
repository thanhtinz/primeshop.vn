import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

// Email category mapping for preference checking
type EmailCategory = 
  | 'auth'
  | 'security'
  | 'order'
  | 'payment'
  | 'invoice'
  | 'promotion'
  | 'voucher'
  | 'newsletter'
  | 'social'
  | 'message'
  | 'reward'
  | 'checkin'
  | 'auction'
  | 'group_order'
  | 'wishlist'
  | 'cart_reminder'
  | 'prime'
  | 'vip'
  | 'seller'
  | 'affiliate'
  | 'event';

// Map email templates to categories
const templateCategoryMap: Record<string, EmailCategory> = {
  // Auth
  'welcome': 'auth',
  'email_verification': 'auth',
  'password_reset': 'auth',
  'password_changed': 'auth',
  'otp_verification': 'auth',
  'login_notification': 'auth',
  'two_factor_enabled': 'auth',
  'account_deletion_request': 'auth',
  
  // Security
  'security_alert': 'security',
  'account_banned': 'security',
  'account_unbanned': 'security',
  'profile_updated': 'security',
  
  // Orders
  'order_confirmation': 'order',
  'order_processing': 'order',
  'order_delivered': 'order',
  'order_completed': 'order',
  'order_cancelled': 'order',
  'order_refunded': 'order',
  'order_status_update': 'order',
  'order_account_delivered': 'order',
  
  // Payment
  'payment_success': 'payment',
  'payment_failed': 'payment',
  'deposit_success': 'payment',
  'topup_success': 'payment',
  'topup_failed': 'payment',
  'withdrawal_request': 'payment',
  'withdrawal_success': 'payment',
  'withdrawal_failed': 'payment',
  
  // Invoice
  'invoice_sent': 'invoice',
  'monthly_statement': 'invoice',
  
  // Promotion
  'flash_sale_notification': 'promotion',
  'new_product_notification': 'promotion',
  'account_reactivation': 'promotion',
  
  // Voucher
  'voucher_gift': 'voucher',
  'voucher_expiring': 'voucher',
  'gift_card_received': 'voucher',
  'gift_card_sent': 'voucher',
  'birthday_greeting': 'voucher',
  
  // Newsletter
  'weekly_digest': 'newsletter',
  'system_update': 'newsletter',
  'maintenance_notice': 'newsletter',
  'survey_invitation': 'newsletter',
  
  // Social
  'new_follower': 'social',
  'new_comment': 'social',
  'new_review': 'social',
  'review_reminder': 'social',
  
  // Message
  'new_message': 'message',
  'chat_message': 'message',
  'ticket_created': 'message',
  'ticket_reply': 'message',
  'dispute_opened': 'message',
  'dispute_resolved': 'message',
  
  // Reward
  'points_earned': 'reward',
  'points_redeemed': 'reward',
  'achievement_unlocked': 'reward',
  'level_up': 'reward',
  'reward_claim_reminder': 'reward',
  
  // Checkin
  'daily_checkin_reward': 'checkin',
  
  // Auction
  'auction_bid_placed': 'auction',
  'auction_outbid': 'auction',
  'auction_won': 'auction',
  'auction_lost': 'auction',
  
  // Group Order
  'group_order_invitation': 'group_order',
  'group_order_success': 'group_order',
  'group_order_failed': 'group_order',
  
  // Wishlist
  'wishlist_price_drop': 'wishlist',
  'wishlist_back_in_stock': 'wishlist',
  'wishlist_sale': 'wishlist',
  'stock_back': 'wishlist',
  
  // Cart
  'cart_abandoned': 'cart_reminder',
  
  // Prime
  'prime_activated': 'prime',
  'prime_expiring': 'prime',
  'prime_expired': 'prime',
  'subscription_started': 'prime',
  'subscription_renewal_reminder': 'prime',
  'subscription_cancelled': 'prime',
  
  // VIP
  'vip_level_up': 'vip',
  
  // Seller
  'product_approved': 'seller',
  'product_rejected': 'seller',
  'seller_approved': 'seller',
  'seller_rejected': 'seller',
  'seller_new_sale': 'seller',
  'seller_daily_report': 'seller',
  'low_stock_alert': 'seller',
  
  // Affiliate
  'referral_registration_received': 'affiliate',
  'referral_approved': 'affiliate',
  'referral_rejected': 'affiliate',
  'referral_commission': 'affiliate',
  'affiliate_payout': 'affiliate',
  'affiliate_tier_upgrade': 'affiliate',
  
  // Event
  'event_invitation': 'event',
  'event_reminder': 'event',
};

// Map category to preference field
const categoryPreferenceMap: Record<EmailCategory, string> = {
  'auth': 'authEmails',
  'security': 'securityAlerts',
  'order': 'orderEmails',
  'payment': 'paymentEmails',
  'invoice': 'invoiceEmails',
  'promotion': 'promotionEmails',
  'voucher': 'voucherEmails',
  'newsletter': 'newsletterEmails',
  'social': 'socialEmails',
  'message': 'messageEmails',
  'reward': 'rewardEmails',
  'checkin': 'checkinEmails',
  'auction': 'auctionEmails',
  'group_order': 'groupOrderEmails',
  'wishlist': 'wishlistEmails',
  'cart_reminder': 'cartReminderEmails',
  'prime': 'primeEmails',
  'vip': 'vipEmails',
  'seller': 'sellerEmails',
  'affiliate': 'affiliateEmails',
  'event': 'eventEmails',
};

// Check if user has enabled email for this template
const checkUserEmailPreference = async (userId: string | undefined, template: string): Promise<boolean> => {
  // If no userId, always send (system emails, admin emails)
  if (!userId) return true;
  
  try {
    const prefs = await prisma.userEmailPreferences.findUnique({
      where: { userId }
    });
    
    // If no preferences exist, create default and allow email
    if (!prefs) {
      await prisma.userEmailPreferences.create({
        data: { userId }
      }).catch(() => {}); // Ignore if already exists
      return true;
    }
    
    // Check master toggle first
    if (!prefs.emailEnabled) {
      console.log(`[Email] User ${userId} has disabled all emails`);
      return false;
    }
    
    // Get category for this template
    const category = templateCategoryMap[template];
    if (!category) {
      // Unknown template, allow by default
      return true;
    }
    
    // Get preference field for this category
    const prefField = categoryPreferenceMap[category];
    const isEnabled = (prefs as any)[prefField];
    
    if (!isEnabled) {
      console.log(`[Email] User ${userId} has disabled ${category} emails`);
      return false;
    }
    
    return true;
  } catch (error) {
    // On error, allow email to be sent
    console.error('[Email] Error checking preferences:', error);
    return true;
  }
};

// Get user ID from email address
const getUserIdByEmail = async (email: string): Promise<string | undefined> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return user?.id;
  } catch {
    return undefined;
  }
};

// Get email config from database or environment
const getEmailConfig = async (): Promise<EmailConfig> => {
  // Try to get from database settings
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          'secret_smtp_host',
          'secret_smtp_port', 
          'secret_smtp_secure',
          'secret_smtp_user',
          'secret_smtp_pass',
          'secret_smtp_from_name',
          'secret_smtp_from_email',
        ]
      }
    }
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    host: settingsMap['secret_smtp_host'] || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(settingsMap['secret_smtp_port'] || process.env.SMTP_PORT || '587'),
    secure: (settingsMap['secret_smtp_secure'] || process.env.SMTP_SECURE) === 'true',
    auth: {
      user: settingsMap['secret_smtp_user'] || process.env.SMTP_USER || '',
      pass: settingsMap['secret_smtp_pass'] || process.env.SMTP_PASS || '',
    },
    from: {
      name: settingsMap['secret_smtp_from_name'] || process.env.SMTP_FROM_NAME || 'Prime Shop',
      email: settingsMap['secret_smtp_from_email'] || process.env.SMTP_FROM_EMAIL || 'noreply@primeshop.vn',
    },
  };
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (!transporter) {
    const config = await getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }
  return transporter;
};

// Reset transporter (call when config changes)
export const resetTransporter = () => {
  transporter = null;
};

// Email template types - 89 templates total
export type EmailTemplate = 
  // Authentication & Account
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'password_changed'
  | 'otp_verification'
  | 'login_notification'
  | 'two_factor_enabled'
  | 'security_alert'
  | 'profile_updated'
  | 'account_banned'
  | 'account_unbanned'
  | 'account_reactivation'
  | 'account_deletion_request'
  
  // Orders
  | 'order_confirmation'
  | 'order_processing'
  | 'order_delivered'
  | 'order_completed'
  | 'order_cancelled'
  | 'order_refunded'
  | 'order_status_update'
  | 'order_account_delivered'
  
  // Payments & Wallet
  | 'payment_success'
  | 'payment_failed'
  | 'deposit_success'
  | 'topup_success'
  | 'topup_failed'
  | 'withdrawal_request'
  | 'withdrawal_success'
  | 'withdrawal_failed'
  | 'invoice_sent'
  | 'monthly_statement'
  
  // Referral & Affiliate
  | 'referral_registration_received'
  | 'referral_approved'
  | 'referral_rejected'
  | 'referral_commission'
  | 'affiliate_payout'
  | 'affiliate_tier_upgrade'
  
  // Tickets & Support
  | 'ticket_created'
  | 'ticket_reply'
  | 'dispute_opened'
  | 'dispute_resolved'
  
  // VIP & Prime
  | 'vip_level_up'
  | 'prime_activated'
  | 'prime_expiring'
  | 'prime_expired'
  
  // Subscriptions
  | 'subscription_started'
  | 'subscription_renewal_reminder'
  | 'subscription_cancelled'
  
  // Flash Sales & Promotions
  | 'flash_sale_notification'
  | 'new_product_notification'
  | 'wishlist_price_drop'
  | 'wishlist_back_in_stock'
  | 'wishlist_sale'
  | 'stock_back'
  
  // Vouchers & Gifts
  | 'voucher_gift'
  | 'voucher_expiring'
  | 'gift_card_received'
  | 'gift_card_sent'
  
  // Group Orders
  | 'group_order_invitation'
  | 'group_order_success'
  | 'group_order_failed'
  
  // Auctions
  | 'auction_bid_placed'
  | 'auction_outbid'
  | 'auction_won'
  | 'auction_lost'
  
  // Gamification
  | 'daily_checkin_reward'
  | 'points_earned'
  | 'points_redeemed'
  | 'achievement_unlocked'
  | 'level_up'
  | 'reward_claim_reminder'
  
  // Social
  | 'new_follower'
  | 'new_comment'
  | 'new_review'
  | 'review_reminder'
  | 'new_message'
  | 'chat_message'
  | 'birthday_greeting'
  
  // Seller
  | 'product_approved'
  | 'product_rejected'
  | 'seller_approved'
  | 'seller_rejected'
  | 'seller_new_sale'
  | 'seller_daily_report'
  | 'low_stock_alert'
  
  // Cart & Shopping
  | 'cart_abandoned'
  
  // Events & System
  | 'event_invitation'
  | 'event_reminder'
  | 'maintenance_notice'
  | 'system_update'
  | 'survey_invitation'
  | 'weekly_digest';

// Get email template from database
const getEmailTemplate = async (templateName: EmailTemplate, lang: string = 'vi') => {
  const template = await prisma.emailTemplate.findFirst({
    where: {
      name: templateName,
      language: lang,
      isActive: true,
    }
  });

  if (!template) {
    // Fallback to Vietnamese
    const fallback = await prisma.emailTemplate.findFirst({
      where: {
        name: templateName,
        language: 'vi',
        isActive: true,
      }
    });
    return fallback;
  }

  return template;
};

// Replace template variables
const replaceVariables = (content: string, data: Record<string, string>) => {
  let result = content;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    result = result.replace(new RegExp(`{${key}}`, 'g'), value || '');
  });
  return result;
};

// Main send email function
export const sendEmail = async (
  to: string,
  template: EmailTemplate,
  data: Record<string, string>,
  lang: string = 'vi',
  options?: { skipPreferenceCheck?: boolean; userId?: string }
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: boolean }> => {
  try {
    // Check user email preferences (unless explicitly skipped)
    if (!options?.skipPreferenceCheck) {
      const userId = options?.userId || await getUserIdByEmail(to);
      const canSend = await checkUserEmailPreference(userId, template);
      
      if (!canSend) {
        console.log(`[Email] Skipped ${template} to ${to} - user preference disabled`);
        return { success: true, skipped: true };
      }
    }
    
    const config = await getEmailConfig();
    const transport = await getTransporter();
    const emailTemplate = await getEmailTemplate(template, lang);

    if (!emailTemplate) {
      console.warn(`[Email] Template not found: ${template}`);
      // Use a basic fallback
      return sendRawEmail(to, 'Thông báo từ Prime Shop', `<p>${JSON.stringify(data)}</p>`);
    }

    const subject = replaceVariables(emailTemplate.subject, data);
    const html = replaceVariables(emailTemplate.html_content || '', data);
    const text = replaceVariables(emailTemplate.text_content || '', data);

    const info = await transport.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to,
      subject,
      text: text || undefined,
      html,
    });

    // Log email sent
    await prisma.emailLog.create({
      data: {
        recipient: to,
        template: template,
        subject,
        status: 'sent',
        message_id: info.messageId,
      }
    }).catch(() => {}); // Ignore if table doesn't exist

    console.log(`[Email] Sent ${template} to ${to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email] Send failed:', error);
    
    // Log failed attempt
    await prisma.emailLog.create({
      data: {
        recipient: to,
        template: template,
        subject: template,
        status: 'failed',
        error: error.message,
      }
    }).catch(() => {});

    return { success: false, error: error.message };
  }
};

// Send raw email (no template)
export const sendRawEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const config = await getEmailConfig();
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to,
      subject,
      text: text || undefined,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email] Raw send failed:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
export const sendBulkEmail = async (
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendRawEmail(recipient, subject, html, text);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    // Rate limiting - wait 100ms between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success: failed === 0, sent, failed };
};

// Test email connection
export const testEmailConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const transport = await getTransporter();
    await transport.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Helper functions for common emails
export const sendWelcomeEmail = (email: string, fullName: string, lang: string = 'vi') => 
  sendEmail(email, 'welcome', { full_name: fullName }, lang);

export const sendOTPEmail = (email: string, otp: string, fullName: string, lang: string = 'vi') =>
  sendEmail(email, 'otp_verification', { otp_code: otp, full_name: fullName }, lang);

export const sendPasswordResetEmail = (email: string, resetLink: string, fullName: string, lang: string = 'vi') =>
  sendEmail(email, 'password_reset', { reset_link: resetLink, full_name: fullName }, lang);

export const sendOrderConfirmationEmail = (
  email: string,
  data: {
    customer_name: string;
    order_number: string;
    order_items: string;
    total_amount: string;
    order_url: string;
  },
  lang: string = 'vi'
) => sendEmail(email, 'order_confirmation', data, lang);

export const sendOrderStatusEmail = (
  email: string,
  data: {
    customer_name: string;
    order_number: string;
    order_status: string;
    order_url: string;
  },
  lang: string = 'vi'
) => sendEmail(email, 'order_status_update', data, lang);

// ============================================
// Additional Helper Functions for 89 Templates
// ============================================

// Security Emails
export const sendLoginNotificationEmail = (
  email: string,
  data: { customer_name: string; login_time: string; device: string; ip_address: string; location: string },
  lang: string = 'vi'
) => sendEmail(email, 'login_notification', data, lang);

export const sendSecurityAlertEmail = (
  email: string,
  data: { customer_name: string; activity_type: string; timestamp: string; ip_address: string; location: string; security_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'security_alert', data, lang);

export const sendPasswordChangedEmail = (
  email: string,
  data: { customer_name: string; timestamp: string; ip_address: string },
  lang: string = 'vi'
) => sendEmail(email, 'password_changed', data, lang);

// Payment Emails
export const sendPaymentSuccessEmail = (
  email: string,
  data: { customer_name: string; order_number: string; amount: string; payment_method: string; payment_time: string },
  lang: string = 'vi'
) => sendEmail(email, 'payment_success', data, lang);

export const sendPaymentFailedEmail = (
  email: string,
  data: { customer_name: string; order_number: string; amount: string; reason: string; retry_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'payment_failed', data, lang);

export const sendDepositSuccessEmail = (
  email: string,
  data: { customer_name: string; amount: string; new_balance: string; transaction_id: string },
  lang: string = 'vi'
) => sendEmail(email, 'deposit_success', data, lang);

export const sendWithdrawalRequestEmail = (
  email: string,
  data: { customer_name: string; amount: string; method: string; account_info: string; request_id: string },
  lang: string = 'vi'
) => sendEmail(email, 'withdrawal_request', data, lang);

export const sendWithdrawalSuccessEmail = (
  email: string,
  data: { customer_name: string; amount: string; method: string; transaction_id: string },
  lang: string = 'vi'
) => sendEmail(email, 'withdrawal_success', data, lang);

// Prime & VIP Emails
export const sendPrimeActivatedEmail = (
  email: string,
  data: { customer_name: string; plan_name: string; duration: string; expiry_date: string },
  lang: string = 'vi'
) => sendEmail(email, 'prime_activated', data, lang);

export const sendPrimeExpiringEmail = (
  email: string,
  data: { customer_name: string; expiry_date: string; days_left: string; renew_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'prime_expiring', data, lang);

export const sendVipLevelUpEmail = (
  email: string,
  data: { customer_name: string; new_level: string; benefits: string },
  lang: string = 'vi'
) => sendEmail(email, 'vip_level_up', data, lang);

// Auction Emails
export const sendAuctionBidPlacedEmail = (
  email: string,
  data: { customer_name: string; product_name: string; bid_amount: string; end_time: string },
  lang: string = 'vi'
) => sendEmail(email, 'auction_bid_placed', data, lang);

export const sendAuctionOutbidEmail = (
  email: string,
  data: { customer_name: string; product_name: string; your_bid: string; current_bid: string; end_time: string; auction_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'auction_outbid', data, lang);

export const sendAuctionWonEmail = (
  email: string,
  data: { customer_name: string; product_name: string; winning_bid: string; payment_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'auction_won', data, lang);

export const sendAuctionLostEmail = (
  email: string,
  data: { customer_name: string; product_name: string; your_bid: string; winning_bid: string },
  lang: string = 'vi'
) => sendEmail(email, 'auction_lost', data, lang);

// Group Order Emails
export const sendGroupOrderInvitationEmail = (
  email: string,
  data: { customer_name: string; inviter_name: string; product_name: string; group_price: string; current_members: string; required_members: string; end_time: string; group_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'group_order_invitation', data, lang);

export const sendGroupOrderSuccessEmail = (
  email: string,
  data: { customer_name: string; product_name: string; group_price: string; savings: string },
  lang: string = 'vi'
) => sendEmail(email, 'group_order_success', data, lang);

export const sendGroupOrderFailedEmail = (
  email: string,
  data: { customer_name: string; product_name: string; current_members: string; required_members: string },
  lang: string = 'vi'
) => sendEmail(email, 'group_order_failed', data, lang);

// Gamification Emails
export const sendDailyCheckinRewardEmail = (
  email: string,
  data: { customer_name: string; day: string; reward: string; streak: string },
  lang: string = 'vi'
) => sendEmail(email, 'daily_checkin_reward', data, lang);

export const sendPointsEarnedEmail = (
  email: string,
  data: { customer_name: string; points: string; order_number: string; total_points: string },
  lang: string = 'vi'
) => sendEmail(email, 'points_earned', data, lang);

export const sendAchievementUnlockedEmail = (
  email: string,
  data: { customer_name: string; achievement_icon: string; achievement_name: string; achievement_description: string; reward: string },
  lang: string = 'vi'
) => sendEmail(email, 'achievement_unlocked', data, lang);

export const sendLevelUpEmail = (
  email: string,
  data: { customer_name: string; new_level: string; total_xp: string; new_benefits: string },
  lang: string = 'vi'
) => sendEmail(email, 'level_up', data, lang);

// Wishlist & Notifications
export const sendWishlistPriceDropEmail = (
  email: string,
  data: { customer_name: string; product_name: string; old_price: string; new_price: string; discount_percent: string; product_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'wishlist_price_drop', data, lang);

export const sendWishlistBackInStockEmail = (
  email: string,
  data: { customer_name: string; product_name: string; price: string; stock_quantity: string; product_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'wishlist_back_in_stock', data, lang);

export const sendCartAbandonedEmail = (
  email: string,
  data: { customer_name: string; item_count: string; cart_items: string; total_amount: string; cart_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'cart_abandoned', data, lang);

// Seller Emails
export const sendSellerNewSaleEmail = (
  email: string,
  data: { seller_name: string; order_number: string; product_name: string; quantity: string; total_amount: string; customer_name: string; order_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'seller_new_sale', data, lang);

export const sendSellerDailyReportEmail = (
  email: string,
  data: { seller_name: string; date: string; orders_count: string; revenue: string; profit: string; products_sold: string; dashboard_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'seller_daily_report', data, lang);

export const sendLowStockAlertEmail = (
  email: string,
  data: { seller_name: string; products_count: string; low_stock_products: string; inventory_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'low_stock_alert', data, lang);

export const sendProductApprovedEmail = (
  email: string,
  data: { seller_name: string; product_name: string; price: string; product_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'product_approved', data, lang);

export const sendProductRejectedEmail = (
  email: string,
  data: { seller_name: string; product_name: string; rejection_reason: string; edit_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'product_rejected', data, lang);

// Affiliate Emails
export const sendAffiliatePayoutEmail = (
  email: string,
  data: { affiliate_name: string; amount: string; period: string; orders_count: string; transaction_id: string },
  lang: string = 'vi'
) => sendEmail(email, 'affiliate_payout', data, lang);

export const sendAffiliateTierUpgradeEmail = (
  email: string,
  data: { affiliate_name: string; new_tier: string; commission_rate: string; new_benefits: string },
  lang: string = 'vi'
) => sendEmail(email, 'affiliate_tier_upgrade', data, lang);

// Gift & Voucher Emails
export const sendGiftCardReceivedEmail = (
  email: string,
  data: { customer_name: string; sender_name: string; amount: string; gift_code: string; message: string; redeem_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'gift_card_received', data, lang);

export const sendVoucherGiftEmail = (
  email: string,
  data: { customer_name: string; voucher_code: string; discount_value: string; min_order: string; expiry_date: string },
  lang: string = 'vi'
) => sendEmail(email, 'voucher_gift', data, lang);

export const sendVoucherExpiringEmail = (
  email: string,
  data: { customer_name: string; voucher_code: string; discount_value: string; expiry_date: string },
  lang: string = 'vi'
) => sendEmail(email, 'voucher_expiring', data, lang);

// Social Emails
export const sendNewFollowerEmail = (
  email: string,
  data: { customer_name: string; follower_name: string; follower_avatar: string; profile_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'new_follower', data, lang);

export const sendNewCommentEmail = (
  email: string,
  data: { customer_name: string; commenter_name: string; product_name: string; comment_content: string; product_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'new_comment', data, lang);

export const sendNewReviewEmail = (
  email: string,
  data: { customer_name: string; reviewer_name: string; product_name: string; rating: string; review_content: string; product_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'new_review', data, lang);

export const sendBirthdayGreetingEmail = (
  email: string,
  data: { customer_name: string; birthday_voucher: string; voucher_code: string; expiry_date: string },
  lang: string = 'vi'
) => sendEmail(email, 'birthday_greeting', data, lang);

// Event & System Emails
export const sendEventInvitationEmail = (
  email: string,
  data: { customer_name: string; event_name: string; event_date: string; event_location: string; event_description: string; register_url: string },
  lang: string = 'vi'
) => sendEmail(email, 'event_invitation', data, lang);

export const sendMaintenanceNoticeEmail = (
  email: string,
  data: { customer_name: string; start_time: string; end_time: string; duration: string },
  lang: string = 'vi'
) => sendEmail(email, 'maintenance_notice', data, lang);

export const sendWeeklyDigestEmail = (
  email: string,
  data: { customer_name: string; orders_count: string; total_spent: string; points_earned: string; savings: string; hot_products: string },
  lang: string = 'vi'
) => sendEmail(email, 'weekly_digest', data, lang);
