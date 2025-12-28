import { discordService } from '../services/discordService';

// Example usage in order completion with template
export async function sendOrderNotification(userId: string, order: any) {
  // Send Discord notification using template
  await discordService.sendTemplateNotification(
    userId,
    'ORDER_DELIVERED',
    {
      orderNumber: order.orderNumber,
      total: `${order.totalAmount.toLocaleString()} VND`,
      items: order.items.length,
    },
    'order',
    `${process.env.FRONTEND_URL}/settings/orders/${order.id}`
  );
}

// Example usage in order placement
export async function sendOrderPlacedNotification(userId: string, order: any) {
  await discordService.sendTemplateNotification(
    userId,
    'ORDER_PLACED',
    {
      orderNumber: order.orderNumber,
      total: `${order.totalAmount.toLocaleString()} VND`,
      items: order.items.length,
    },
    'order',
    `${process.env.FRONTEND_URL}/settings/orders/${order.id}`
  );
}

// Example usage in order cancellation
export async function sendOrderCancelledNotification(userId: string, order: any, reason?: string) {
  await discordService.sendTemplateNotification(
    userId,
    'ORDER_CANCELLED',
    {
      orderNumber: order.orderNumber,
      reason,
    },
    'order'
  );
}

// Example usage in payment completion with template
export async function sendPaymentNotification(userId: string, payment: any) {
  await discordService.sendTemplateNotification(
    userId,
    'PAYMENT_SUCCESS',
    {
      amount: `${payment.amount.toLocaleString()} VND`,
      method: payment.gateway,
      transactionId: payment.transactionId,
    },
    'payment'
  );
}

// Example usage in deposit
export async function sendDepositNotification(userId: string, amount: number, newBalance: number) {
  await discordService.sendTemplateNotification(
    userId,
    'DEPOSIT_SUCCESS',
    {
      amount: `${amount.toLocaleString()} VND`,
      balance: `${newBalance.toLocaleString()} VND`,
    },
    'payment'
  );
}

// Example usage in withdrawal
export async function sendWithdrawalNotification(userId: string, withdrawal: any) {
  const templateKey = withdrawal.status === 'completed' 
    ? 'WITHDRAWAL_COMPLETED' 
    : 'WITHDRAWAL_REQUEST';

  await discordService.sendTemplateNotification(
    userId,
    templateKey,
    {
      amount: `${withdrawal.amount.toLocaleString()} VND`,
      bankName: withdrawal.bankName,
    },
    'payment'
  );
}

// Example usage in security alerts with template
export async function sendSecurityAlert(userId: string, alert: any) {
  await discordService.sendTemplateNotification(
    userId,
    'LOGIN_ALERT',
    {
      ip: alert.ip,
      location: alert.location || 'Unknown',
      device: alert.device || 'Unknown Device',
      time: new Date().toLocaleString(),
    },
    'security'
  );
}

// Example usage in password change
export async function sendPasswordChangedNotification(userId: string, ip: string) {
  await discordService.sendTemplateNotification(
    userId,
    'PASSWORD_CHANGED',
    {
      time: new Date().toLocaleString(),
      ip,
    },
    'security'
  );
}

// Example usage in social notifications with template
export async function sendSocialNotification(userId: string, notification: any) {
  let templateKey = 'NEW_FOLLOWER';
  let templateData: any = {};

  switch (notification.type) {
    case 'follow':
      templateKey = 'NEW_FOLLOWER';
      templateData = {
        username: notification.fromUser.username,
        profileUrl: `${process.env.FRONTEND_URL}/profile/${notification.fromUser.id}`,
      };
      break;
    case 'like':
      templateKey = 'POST_LIKED';
      templateData = {
        username: notification.fromUser.username,
        postTitle: notification.post.title,
      };
      break;
    case 'comment':
      templateKey = 'NEW_COMMENT';
      templateData = {
        username: notification.fromUser.username,
        postTitle: notification.post.title,
        comment: notification.comment.content,
      };
      break;
    case 'friend_request':
      templateKey = 'FRIEND_REQUEST';
      templateData = {
        username: notification.fromUser.username,
      };
      break;
  }

  await discordService.sendTemplateNotification(
    userId,
    templateKey,
    templateData,
    'social',
    notification.url
  );
}

// Example usage in marketplace notifications with template
export async function sendMarketplaceNotification(userId: string, notification: any) {
  let templateKey = notification.templateKey || 'NEW_SALE';
  
  await discordService.sendTemplateNotification(
    userId,
    templateKey,
    notification.data,
    'marketplace',
    notification.url
  );
}

// Example: Shop approval
export async function sendShopApprovedNotification(userId: string, shop: any) {
  await discordService.sendTemplateNotification(
    userId,
    'SHOP_APPROVED',
    {
      shopName: shop.name,
    },
    'marketplace',
    `${process.env.FRONTEND_URL}/seller/dashboard`
  );
}

// Example: New sale
export async function sendNewSaleNotification(sellerId: string, sale: any) {
  await discordService.sendTemplateNotification(
    sellerId,
    'NEW_SALE',
    {
      productName: sale.product.name,
      amount: `${sale.amount.toLocaleString()} VND`,
      buyer: sale.buyer.username,
    },
    'marketplace',
    `${process.env.FRONTEND_URL}/seller/orders/${sale.id}`
  );
}

// Example: Low stock alert
export async function sendLowStockAlert(sellerId: string, product: any) {
  await discordService.sendTemplateNotification(
    sellerId,
    'LOW_STOCK_ALERT',
    {
      productName: product.name,
      remaining: product.stock,
    },
    'marketplace',
    `${process.env.FRONTEND_URL}/seller/products/${product.id}`
  );
}

// Example: VIP upgrade
export async function sendVipUpgradeNotification(userId: string, tier: string, benefits: string[]) {
  await discordService.sendTemplateNotification(
    userId,
    'VIP_UPGRADE',
    {
      tier,
      benefits,
    },
    'account'
  );
}

// Example: Welcome message
export async function sendWelcomeNotification(userId: string, username: string) {
  await discordService.sendTemplateNotification(
    userId,
    'WELCOME',
    {
      username,
    },
    'account'
  );
}

// Example: Flash sale alert
export async function sendFlashSaleAlert(userId: string, flashSale: any) {
  await discordService.sendTemplateNotification(
    userId,
    'FLASH_SALE_ALERT',
    {
      productName: flashSale.product.name,
      discount: `${flashSale.discount}%`,
      endsAt: new Date(flashSale.endsAt).toLocaleString(),
    },
    'system',
    `${process.env.FRONTEND_URL}/products/${flashSale.product.id}`
  );
}
