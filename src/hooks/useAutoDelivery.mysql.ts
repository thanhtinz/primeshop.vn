// Hooks for Auto Delivery - MySQL version
import { db, rpc } from '@/lib/api-client';
import { toast } from 'sonner';
import { sendDiscordNotification } from '@/hooks/useDiscordNotify.mysql';
import { claimRandomAccount } from '@/hooks/useGameAccountInventory.mysql';

interface DeliveryResult {
  success: boolean;
  message?: string;
  deliveryContent?: string;
  deliveryType?: 'naperis' | 'game_account' | 'manual';
}

/**
 * Process automatic delivery for an order based on product type
 */
export const processAutoDelivery = async (orderId: string): Promise<DeliveryResult> => {
  try {
    // Get order with product snapshot
    const { data: order, error: orderError } = await db
      .from<any>('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Failed to fetch order:', orderError);
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    const snapshot = order.productSnapshot as any;
    const product = snapshot?.product;
    const selectedPackage = snapshot?.selectedPackage;
    const style = product?.style;

    console.log('Processing auto delivery:', { orderId, style, productId: product?.id });

    // Route to appropriate handler based on product style/config
    if (style === 'game_topup' && product?.externalApi === 'naperis') {
      return await processNaperisTopupInternal(order, product, selectedPackage, snapshot?.customFieldValues);
    }

    if (style === 'game_account' && product?.id) {
      return await processGameAccountDelivery(order, product);
    }

    // No auto-delivery available
    return {
      success: false,
      message: 'Sản phẩm không hỗ trợ giao hàng tự động',
      deliveryType: 'manual',
    };
  } catch (error) {
    console.error('Auto delivery error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi không xác định',
    };
  }
};

/**
 * Process Naperis topup delivery
 */
async function processNaperisTopupInternal(
  order: any,
  product: any,
  selectedPackage: any,
  customFieldValues: any
): Promise<DeliveryResult> {
  if (!product.externalCategoryId || !selectedPackage?.externalProductId) {
    console.error('Missing naperis config:', {
      categoryId: product.externalCategoryId,
      productId: selectedPackage?.externalProductId,
    });
    return { success: false, message: 'Thiếu cấu hình Naperis (categoryId hoặc productId)' };
  }

  console.log('Processing naperis topup:', {
    orderId: order.id,
    categoryId: product.externalCategoryId,
    productId: selectedPackage.externalProductId,
    data: customFieldValues,
  });

  // Call naperis API via RPC
  const { data: naperisResult, error: naperisError } = await rpc('naperis-topup', {
    action: 'create_order',
    categoryId: product.externalCategoryId,
    productId: selectedPackage.externalProductId,
    data: customFieldValues || {},
  });

  if (naperisError) {
    console.error('Naperis API error:', naperisError);

    await db
      .from('orders')
      .update({
        notes: `Lỗi nạp tự động: ${naperisError.message}`,
        status: 'PROCESSING',
      })
      .eq('id', order.id);

    sendDiscordNotification('topup_failed', {
      order_number: order.orderNumber,
      customer_email: order.customerEmail,
      product_name: product.name,
      error: naperisError.message,
    });

    return { success: false, message: naperisError.message, deliveryType: 'naperis' };
  }

  console.log('Naperis result:', naperisResult);

  const deliveryContent = formatNaperisDelivery(naperisResult, product, selectedPackage);

  await db
    .from('orders')
    .update({
      deliveryContent,
      status: 'DELIVERED',
      notes: `Naperis Order ID: ${naperisResult?.orderId || naperisResult?.id || 'N/A'}`,
    })
    .eq('id', order.id);

  sendDiscordNotification('topup_success', {
    order_number: order.orderNumber,
    customer_email: order.customerEmail,
    product_name: product.name,
    package_name: selectedPackage.name,
    naperis_order_id: naperisResult?.orderId || naperisResult?.id,
  });

  return {
    success: true,
    deliveryContent,
    deliveryType: 'naperis',
  };
}

/**
 * Process game account inventory delivery
 */
async function processGameAccountDelivery(order: any, product: any): Promise<DeliveryResult> {
  console.log('Processing game account delivery:', { orderId: order.id, productId: product.id });

  // Claim a random available account
  const claimed = await claimRandomAccount(product.id, order.id);

  if (!claimed) {
    console.error('No available accounts for product:', product.id);

    await db
      .from('orders')
      .update({
        notes: 'Hết account trong kho - cần bổ sung',
        status: 'PROCESSING',
      })
      .eq('id', order.id);

    sendDiscordNotification('topup_failed', {
      order_number: order.orderNumber,
      customer_email: order.customerEmail,
      product_name: product.name,
      error: 'Hết account trong kho',
    });

    return {
      success: false,
      message: 'Hết account trong kho - vui lòng liên hệ hỗ trợ',
      deliveryType: 'game_account',
    };
  }

  const deliveryContent = formatGameAccountDelivery(claimed.accountData, product);

  await db
    .from('orders')
    .update({
      deliveryContent,
      status: 'DELIVERED',
      notes: `Account ID: ${claimed.accountId}`,
    })
    .eq('id', order.id);

  sendDiscordNotification('topup_success', {
    order_number: order.orderNumber,
    customer_email: order.customerEmail,
    product_name: product.name,
    naperis_order_id: claimed.accountId,
  });

  return {
    success: true,
    deliveryContent,
    deliveryType: 'game_account',
  };
}

function formatNaperisDelivery(result: any, product: any, selectedPackage: any): string {
  const lines = [
    `=== THÔNG TIN NẠP GAME ===`,
    `Sản phẩm: ${product?.name || 'N/A'}`,
    `Gói: ${selectedPackage?.name || 'N/A'}`,
    `Mã đơn Naperis: ${result?.orderId || result?.id || 'N/A'}`,
    `Trạng thái: ${result?.status || 'Đã xử lý'}`,
    ``,
  ];

  if (result?.data) {
    lines.push('--- Chi tiết ---');
    if (typeof result.data === 'object') {
      Object.entries(result.data).forEach(([key, value]) => {
        lines.push(`${key}: ${value}`);
      });
    } else {
      lines.push(String(result.data));
    }
  }

  if (result?.message) {
    lines.push(``, `Ghi chú: ${result.message}`);
  }

  lines.push(``, `Thời gian: ${new Date().toLocaleString('vi-VN')}`);

  return lines.join('\n');
}

function formatGameAccountDelivery(accountData: string, product: any): string {
  const lines = [
    `=== THÔNG TIN TÀI KHOẢN ===`,
    `Sản phẩm: ${product?.name || 'N/A'}`,
    ``,
    `--- Thông tin đăng nhập ---`,
    accountData,
    ``,
    `⚠️ Lưu ý:`,
    `- Vui lòng đổi mật khẩu ngay sau khi nhận`,
    `- Không chia sẻ thông tin này cho người khác`,
    `- Liên hệ hỗ trợ nếu gặp vấn đề`,
    ``,
    `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
  ];

  return lines.join('\n');
}

// Hook for components
export const useAutoDelivery = () => {
  const processDelivery = async (orderId: string) => {
    const result = await processAutoDelivery(orderId);

    if (result.success) {
      toast.success('Giao hàng tự động thành công!');
    } else if (result.deliveryType === 'manual') {
      toast.info('Sản phẩm cần giao hàng thủ công');
    } else {
      toast.error(`Lỗi giao hàng: ${result.message}`);
    }

    return result;
  };

  return { processDelivery };
};
