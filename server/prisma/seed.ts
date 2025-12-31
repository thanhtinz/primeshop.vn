import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@prime.vn' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@prime.vn',
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@prime.vn / admin123');

  // Create default categories
  const categories = [
    { name: 'Game', slug: 'game', description: 'Tài khoản game các loại', iconName: 'Gamepad2', sortOrder: 1 },
    { name: 'Streaming', slug: 'streaming', description: 'Netflix, Spotify, Youtube Premium...', iconName: 'Play', sortOrder: 2 },
    { name: 'VPN', slug: 'vpn', description: 'NordVPN, ExpressVPN...', iconName: 'Shield', sortOrder: 3 },
    { name: 'Phần mềm', slug: 'software', description: 'Windows, Office, Adobe...', iconName: 'Laptop', sortOrder: 4 },
    { name: 'Mạng xã hội', slug: 'social', description: 'Facebook, Instagram, TikTok...', iconName: 'Share2', sortOrder: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created:', categories.length);

  // Create sample products
  const gameCategory = await prisma.category.findUnique({ where: { slug: 'game' } });
  const streamingCategory = await prisma.category.findUnique({ where: { slug: 'streaming' } });
  
  if (gameCategory) {
    // PUBG Mobile
    const pubg = await prisma.product.upsert({
      where: { slug: 'pubg-mobile-uc' },
      update: {},
      create: {
        name: 'PUBG Mobile UC',
        slug: 'pubg-mobile-uc',
        description: 'Nạp UC PUBG Mobile giá rẻ, giao dịch nhanh chóng',
        categoryId: gameCategory.id,
        imageUrl: 'https://placehold.co/400x300/1a1a2e/eee?text=PUBG+UC',
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      },
    });

    // PUBG packages
    const pubgPackages = [
      { productId: pubg.id, name: '60 UC', price: 20000, sortOrder: 1 },
      { productId: pubg.id, name: '325 UC', price: 99000, sortOrder: 2 },
      { productId: pubg.id, name: '660 UC', price: 199000, sortOrder: 3 },
      { productId: pubg.id, name: '1800 UC', price: 499000, sortOrder: 4 },
    ];
    for (const pkg of pubgPackages) {
      await prisma.productPackage.create({ data: pkg }).catch(() => {});
    }

    // Genshin Impact
    const genshin = await prisma.product.upsert({
      where: { slug: 'genshin-impact-genesis' },
      update: {},
      create: {
        name: 'Genshin Impact Genesis Crystals',
        slug: 'genshin-impact-genesis',
        description: 'Nạp Genesis Crystals Genshin Impact',
        categoryId: gameCategory.id,
        imageUrl: 'https://placehold.co/400x300/3d5a80/eee?text=Genshin',
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
      },
    });

    const genshinPackages = [
      { productId: genshin.id, name: '60 Genesis', price: 22000, sortOrder: 1 },
      { productId: genshin.id, name: '330 Genesis', price: 110000, sortOrder: 2 },
      { productId: genshin.id, name: '1090 Genesis', price: 350000, sortOrder: 3 },
    ];
    for (const pkg of genshinPackages) {
      await prisma.productPackage.create({ data: pkg }).catch(() => {});
    }

    // Free Fire
    const ff = await prisma.product.upsert({
      where: { slug: 'free-fire-diamond' },
      update: {},
      create: {
        name: 'Free Fire Diamond',
        slug: 'free-fire-diamond',
        description: 'Nạp Kim cương Free Fire giá rẻ',
        categoryId: gameCategory.id,
        imageUrl: 'https://placehold.co/400x300/ff6b35/eee?text=Free+Fire',
        isActive: true,
        isFeatured: true,
        sortOrder: 3,
      },
    });

    const ffPackages = [
      { productId: ff.id, name: '100 Kim cương', price: 20000, sortOrder: 1 },
      { productId: ff.id, name: '310 Kim cương', price: 50000, sortOrder: 2 },
      { productId: ff.id, name: '520 Kim cương', price: 100000, sortOrder: 3 },
      { productId: ff.id, name: '1060 Kim cương', price: 200000, sortOrder: 4 },
    ];
    for (const pkg of ffPackages) {
      await prisma.productPackage.create({ data: pkg }).catch(() => {});
    }
  }

  if (streamingCategory) {
    // Netflix
    const netflix = await prisma.product.upsert({
      where: { slug: 'netflix-premium' },
      update: {},
      create: {
        name: 'Netflix Premium',
        slug: 'netflix-premium',
        description: 'Tài khoản Netflix Premium 4K, chia sẻ hoặc riêng',
        categoryId: streamingCategory.id,
        imageUrl: 'https://placehold.co/400x300/e50914/fff?text=Netflix',
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
      },
    });

    const netflixPackages = [
      { productId: netflix.id, name: '1 tháng (chia sẻ)', price: 35000, sortOrder: 1 },
      { productId: netflix.id, name: '1 tháng (riêng)', price: 120000, sortOrder: 2 },
      { productId: netflix.id, name: '3 tháng (riêng)', price: 320000, sortOrder: 3 },
    ];
    for (const pkg of netflixPackages) {
      await prisma.productPackage.create({ data: pkg }).catch(() => {});
    }

    // Spotify
    const spotify = await prisma.product.upsert({
      where: { slug: 'spotify-premium' },
      update: {},
      create: {
        name: 'Spotify Premium',
        slug: 'spotify-premium',
        description: 'Tài khoản Spotify Premium không quảng cáo',
        categoryId: streamingCategory.id,
        imageUrl: 'https://placehold.co/400x300/1db954/fff?text=Spotify',
        isActive: true,
        isFeatured: false,
        sortOrder: 2,
      },
    });

    const spotifyPackages = [
      { productId: spotify.id, name: '1 tháng', price: 25000, sortOrder: 1 },
      { productId: spotify.id, name: '3 tháng', price: 65000, sortOrder: 2 },
      { productId: spotify.id, name: '6 tháng', price: 120000, sortOrder: 3 },
    ];
    for (const pkg of spotifyPackages) {
      await prisma.productPackage.create({ data: pkg }).catch(() => {});
    }
  }

  // Site settings
  const settings = [
    { key: 'site_name', value: 'Prime Shop' },
    { key: 'site_description', value: 'Cửa hàng tài khoản số 1 Việt Nam' },
    { key: 'contact_email', value: 'support@prime.vn' },
    { key: 'contact_phone', value: '0123456789' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Site settings created');

  // Create sample voucher
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
