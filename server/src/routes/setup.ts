import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';

const router = Router();

// Path to setup lock file
const SETUP_LOCK_FILE = path.join(__dirname, '../../.setup-complete');

// Check if setup is complete
const isSetupComplete = (): boolean => {
  return fs.existsSync(SETUP_LOCK_FILE);
};

// Create setup lock file
const markSetupComplete = (): void => {
  fs.writeFileSync(SETUP_LOCK_FILE, new Date().toISOString());
};

/**
 * Run seed data for initial setup
 */
const runSeedData = async () => {
  console.log('🌱 Starting seed data import...');

  // 1. VIP Levels
  const vipLevels = [
    { name: 'Member', minSpending: 0, discountPercent: 0, sortOrder: 1 },
    { name: 'Bronze', minSpending: 500000, discountPercent: 2, sortOrder: 2 },
    { name: 'Silver', minSpending: 2000000, discountPercent: 5, sortOrder: 3 },
    { name: 'Gold', minSpending: 5000000, discountPercent: 8, sortOrder: 4 },
    { name: 'Diamond', minSpending: 10000000, discountPercent: 12, sortOrder: 5 },
  ];
  for (const level of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { name: level.name },
      update: {},
      create: level,
    });
  }
  console.log('✅ VIP Levels created');

  // 2. Default site settings
  const defaultSettings = [
    { key: 'site_name', value: '"Prime Shop"' },
    { key: 'site_logo', value: '""' },
    { key: 'site_favicon', value: '""' },
    { key: 'tax_rate', value: '10' },
    { key: 'referral_commission_percent', value: '5' },
    { key: 'min_reward_request', value: '100000' },
    { key: 'welcome_voucher_value', value: '10000' },
    { key: 'company_address', value: '"123 Đường ABC, Quận 1, TP.HCM"' },
    { key: 'company_phone', value: '"0123 456 789"' },
    { key: 'support_email', value: '"support@primeshop.vn"' },
    { key: 'sender_email', value: '"noreply@primeshop.vn"' },
    { key: 'google_login_enabled', value: 'false' },
    { key: 'discord_login_enabled', value: 'false' },
    { key: 'seasonal_effect_enabled', value: 'false' },
    { key: 'seasonal_effect_type', value: '"snow"' },
    { key: 'seasonal_effect_count', value: '50' },
    { key: 'seasonal_effect_speed', value: '1' },
    { key: 'captcha_enabled', value: 'false' },
    { key: 'captcha_provider', value: '"turnstile"' },
    { key: 'captcha_site_key', value: '""' },
    { key: 'captcha_secret_key', value: '""' },
    { key: 'captcha_mode', value: '"always"' },
    { key: 'login_rate_limit_enabled', value: 'false' },
    { key: 'require_email_verification', value: 'true' },
    { key: 'session_timeout_minutes', value: '1440' },
  ];
  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Default site settings created');

  // 3. Sample Categories
  const categories = [
    { name: 'Tài khoản Premium', nameEn: 'Premium Accounts', slug: 'tai-khoan-premium', description: 'Các tài khoản premium chất lượng cao', descriptionEn: 'High quality premium accounts', sortOrder: 1, isActive: true, style: 'premium' },
    { name: 'Account Game', nameEn: 'Game Accounts', slug: 'account-game', description: 'Tài khoản game các loại', descriptionEn: 'Various game accounts', sortOrder: 2, isActive: true, style: 'game_account' },
    { name: 'Nạp Game', nameEn: 'Game Topup', slug: 'nap-game', description: 'Dịch vụ nạp game nhanh chóng', descriptionEn: 'Fast game topup services', sortOrder: 3, isActive: true, style: 'game_topup' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // 4. Site Sections
  const sections = [
    { sectionKey: 'hero_banner', sectionName: 'Hero Banner', isEnabled: true, sortOrder: 1 },
    { sectionKey: 'flash_sales', sectionName: 'Flash Sales', isEnabled: true, sortOrder: 2 },
    { sectionKey: 'featured_products', sectionName: 'Sản phẩm nổi bật', isEnabled: true, sortOrder: 3 },
    { sectionKey: 'categories', sectionName: 'Danh mục sản phẩm', isEnabled: true, sortOrder: 4 },
    { sectionKey: 'new_products', sectionName: 'Sản phẩm mới', isEnabled: true, sortOrder: 5 },
    { sectionKey: 'best_sellers', sectionName: 'Bán chạy nhất', isEnabled: true, sortOrder: 6 },
    { sectionKey: 'testimonials', sectionName: 'Đánh giá khách hàng', isEnabled: true, sortOrder: 7 },
    { sectionKey: 'partners', sectionName: 'Đối tác', isEnabled: true, sortOrder: 8 },
    { sectionKey: 'news', sectionName: 'Tin tức', isEnabled: true, sortOrder: 9 },
    { sectionKey: 'newsletter', sectionName: 'Đăng ký nhận tin', isEnabled: true, sortOrder: 10 },
  ];
  for (const section of sections) {
    await prisma.siteSection.upsert({
      where: { sectionKey: section.sectionKey },
      update: {},
      create: section,
    });
  }
  console.log('✅ Site sections created');

  // 5. Welcome Voucher
  await prisma.voucher.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 50000,
      minOrderValue: 100000,
      usageLimit: 1000,
      isActive: true,
    },
  });
  console.log('✅ Welcome voucher created');

  // 6. Email Templates (essential ones)
  const emailTemplates = [
    {
      name: 'welcome',
      subject: 'Chào mừng bạn đến với {{site_name}}!',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">🎉 Chào mừng bạn!</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Cảm ơn bạn đã đăng ký tài khoản tại {{site_name}}.</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "site_name", "login_url"]',
      isActive: true,
    },
    {
      name: 'order_confirmation',
      subject: '✅ Xác nhận đơn hàng #{{order_id}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #16a34a;">Đơn hàng đã được tiếp nhận!</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Đơn hàng <strong>#{{order_id}}</strong> đã được xác nhận.</p><p><strong>Tổng tiền:</strong> {{total}}</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "order_id", "total", "order_url", "site_name"]',
      isActive: true,
    },
    {
      name: 'password_reset',
      subject: '🔑 Đặt lại mật khẩu - {{site_name}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Đặt lại mật khẩu</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Click vào nút bên dưới để đặt lại mật khẩu:</p><div style="text-align: center; margin: 24px 0;"><a href="{{reset_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Đặt lại mật khẩu</a></div><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "reset_url", "site_name"]',
      isActive: true,
    },
    {
      name: 'email_verification',
      subject: '📧 Xác minh email - {{site_name}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Xác minh địa chỉ email</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Click vào nút bên dưới để xác minh email:</p><div style="text-align: center; margin: 24px 0;"><a href="{{verify_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xác minh email</a></div><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "verify_url", "site_name"]',
      isActive: true,
    },
    {
      name: 'otp_verification',
      subject: '🔐 Mã OTP xác thực - {{site_name}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Mã OTP của bạn</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Mã OTP của bạn là:</p><div style="text-align: center; margin: 24px 0;"><div style="background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">{{otp_code}}</div></div><p>Mã này có hiệu lực trong {{expiry_minutes}} phút.</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "otp_code", "expiry_minutes", "site_name"]',
      isActive: true,
    },
    {
      name: 'payment_success',
      subject: '💳 Thanh toán thành công - Đơn hàng #{{order_id}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #16a34a;">Thanh toán thành công!</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Thanh toán cho đơn hàng <strong>#{{order_id}}</strong> đã được xác nhận.</p><p><strong>Số tiền:</strong> {{amount}}</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "order_id", "amount", "payment_method", "site_name"]',
      isActive: true,
    },
    {
      name: 'deposit_success',
      subject: '💰 Nạp tiền thành công - {{site_name}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #16a34a;">Nạp tiền thành công!</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Bạn đã nạp thành công <strong>{{amount}}</strong> vào tài khoản.</p><p><strong>Số dư mới:</strong> {{new_balance}}</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "amount", "new_balance", "site_name"]',
      isActive: true,
    },
    {
      name: 'ticket_created',
      subject: '🎫 Ticket hỗ trợ #{{ticket_id}} đã được tạo',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Ticket đã được tạo</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Ticket hỗ trợ <strong>#{{ticket_id}}</strong> của bạn đã được tiếp nhận.</p><p><strong>Tiêu đề:</strong> {{subject}}</p><p>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "ticket_id", "subject", "site_name"]',
      isActive: true,
    },
    {
      name: 'ticket_reply',
      subject: '💬 Phản hồi ticket #{{ticket_id}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Có phản hồi mới</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Ticket <strong>#{{ticket_id}}</strong> có phản hồi mới từ {{staff_name}}.</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "ticket_id", "staff_name", "reply_preview", "site_name"]',
      isActive: true,
    },
    {
      name: 'order_account_delivered',
      subject: '📬 Tài khoản đã được giao - Đơn hàng #{{order_id}}',
      body: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #16a34a;">Tài khoản của bạn đã sẵn sàng!</h2><p>Xin chào <strong>{{customer_name}}</strong>,</p><p>Đơn hàng <strong>#{{order_id}}</strong> đã được xử lý. Thông tin tài khoản đã được gửi.</p><p style="color: #dc2626;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi nhận tài khoản.</p><p>Trân trọng,<br>{{site_name}}</p></div>',
      variables: '["customer_name", "order_id", "product_name", "account_info", "order_url", "site_name"]',
      isActive: true,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log('✅ Email templates created:', emailTemplates.length);

  console.log('🎉 Seed data import completed!');
};

/**
 * Check if setup is already complete
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const setupComplete = isSetupComplete();
    res.json({ isSetupComplete: setupComplete });
  } catch (error) {
    res.json({ isSetupComplete: false });
  }
});

/**
 * Test database connection - SQLite version (always succeeds)
 */
router.post('/test-db', async (req: Request, res: Response) => {
  if (isSetupComplete()) {
    return res.status(403).json({ success: false, message: 'Setup đã hoàn tất, không thể truy cập' });
  }

  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'SQLite database sẵn sàng!' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

/**
 * Run full setup installation - SQLite version
 */
router.post('/install', async (req: Request, res: Response) => {
  if (isSetupComplete()) {
    return res.status(403).json({ success: false, message: 'Setup đã hoàn tất, không thể truy cập' });
  }

  const {
    adminUsername,
    adminEmail,
    adminPassword,
    siteName,
    siteUrl,
    supportEmail,
    senderEmail,
  } = req.body;

  try {
    // Step 1: Run seed data first (VIP levels, categories, email templates, etc.)
    await runSeedData();
    console.log('✅ Seed data imported');

    // Step 2: Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'super_admin',
        isActive: true,
      }
    });
    console.log('✅ Admin user created');

    // Step 3: Update site settings with user-provided values
    const userSettings = [
      { key: 'site_name', value: `"${siteName}"` },
      { key: 'site_url', value: `"${siteUrl}"` },
      { key: 'support_email', value: `"${supportEmail || adminEmail}"` },
      { key: 'sender_email', value: `"${senderEmail || adminEmail}"` },
    ];

    for (const setting of userSettings) {
      await prisma.siteSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      });
    }
    console.log('✅ Site settings updated with user values');

    // Step 4: Mark setup as complete
    markSetupComplete();
    console.log('✅ Setup marked as complete');

    res.json({ 
      success: true, 
      message: 'Setup hoàn tất thành công! Dữ liệu mẫu đã được import.' 
    });

  } catch (error: any) {
    console.error('Setup failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Setup thất bại' 
    });
  }
});

export default router;
