import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@prime.vn',
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.username);

  // Create VIP levels
  const vipLevels = [
    { name: 'Member', minSpending: 0, discountPercent: 0, sortOrder: 1 },
    { name: 'Bronze', minSpending: 1000000, discountPercent: 2, sortOrder: 2 },
    { name: 'Silver', minSpending: 5000000, discountPercent: 5, sortOrder: 3 },
    { name: 'Gold', minSpending: 15000000, discountPercent: 8, sortOrder: 4 },
    { name: 'Platinum', minSpending: 30000000, discountPercent: 10, sortOrder: 5 },
    { name: 'Diamond', minSpending: 50000000, discountPercent: 15, sortOrder: 6 },
  ];

  for (const level of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { id: level.name.toLowerCase() },
      update: {},
      create: {
        id: level.name.toLowerCase(),
        ...level,
      },
    });
  }
  console.log('✅ VIP levels created:', vipLevels.length);

  // Create default categories
  const categories = [
    { name: 'Game', slug: 'game', description: 'Tài khoản game các loại', icon: '🎮', order: 1 },
    { name: 'Streaming', slug: 'streaming', description: 'Netflix, Spotify, Youtube Premium...', icon: '📺', order: 2 },
    { name: 'VPN', slug: 'vpn', description: 'NordVPN, ExpressVPN...', icon: '🔐', order: 3 },
    { name: 'Phần mềm', slug: 'software', description: 'Windows, Office, Adobe...', icon: '💻', order: 4 },
    { name: 'Mạng xã hội', slug: 'social', description: 'Facebook, Instagram, TikTok...', icon: '📱', order: 5 },
    { name: 'Khác', slug: 'other', description: 'Các dịch vụ khác', icon: '📦', order: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created:', categories.length);

  // Create site settings
  const settings = [
    { key: 'site_name', value: 'Prime Shop', group: 'general' },
    { key: 'site_description', value: 'Cửa hàng tài khoản số 1 Việt Nam', group: 'general' },
    { key: 'contact_email', value: 'support@prime.vn', group: 'contact' },
    { key: 'contact_phone', value: '0123456789', group: 'contact' },
    { key: 'facebook_url', value: 'https://facebook.com/primeshop', group: 'social' },
    { key: 'zalo_url', value: 'https://zalo.me/primeshop', group: 'social' },
    { key: 'telegram_url', value: 'https://t.me/primeshop', group: 'social' },
    { key: 'maintenance_mode', value: 'false', group: 'system' },
    { key: 'min_deposit_amount', value: '10000', group: 'payment' },
    { key: 'max_deposit_amount', value: '50000000', group: 'payment' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Site settings created:', settings.length);

  // Create sample voucher
  await prisma.voucher.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      discountType: 'percentage',
      discountValue: 10,
      maxDiscount: 50000,
      minOrderAmount: 100000,
      maxUses: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
    },
  });
  console.log('✅ Welcome voucher created');

  // Create email templates
  const emailTemplates = [
    {
      name: 'order_confirmation',
      subject: 'Xác nhận đơn hàng #{{orderNumber}}',
      bodyHtml: `
        <h1>Cảm ơn bạn đã đặt hàng!</h1>
        <p>Đơn hàng <strong>#{{orderNumber}}</strong> của bạn đã được tiếp nhận.</p>
        <p>Tổng tiền: <strong>{{totalAmount}}</strong></p>
        <p>Chúng tôi sẽ xử lý đơn hàng trong thời gian sớm nhất.</p>
      `,
      variables: ['orderNumber', 'totalAmount'],
    },
    {
      name: 'order_completed',
      subject: 'Đơn hàng #{{orderNumber}} đã hoàn thành',
      bodyHtml: `
        <h1>Đơn hàng đã hoàn thành!</h1>
        <p>Đơn hàng <strong>#{{orderNumber}}</strong> của bạn đã được giao thành công.</p>
        <p>Cảm ơn bạn đã mua sắm tại Prime Shop!</p>
      `,
      variables: ['orderNumber'],
    },
    {
      name: 'deposit_success',
      subject: 'Nạp tiền thành công',
      bodyHtml: `
        <h1>Nạp tiền thành công!</h1>
        <p>Bạn đã nạp thành công <strong>{{amount}}</strong> vào tài khoản.</p>
        <p>Số dư hiện tại: <strong>{{balance}}</strong></p>
      `,
      variables: ['amount', 'balance'],
    },
    {
      name: 'password_reset',
      subject: 'Đặt lại mật khẩu',
      bodyHtml: `
        <h1>Đặt lại mật khẩu</h1>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tiếp tục:</p>
        <p><a href="{{resetLink}}">Đặt lại mật khẩu</a></p>
        <p>Link này sẽ hết hạn sau 24 giờ.</p>
      `,
      variables: ['resetLink'],
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

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
