// MySQL version - useNaperisTopup
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface TopupResult {
  success: boolean;
  orderId?: string;
  message?: string;
  deliveryContent?: string;
}

export const processNaperisTopup = async (orderId: string): Promise<TopupResult> => {
  try {
    // Get order with product snapshot
    const { data: order, error: orderError } = await apiClient.from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Failed to fetch order:', orderError);
      return { success: false, message: 'Không tìm thấy đơn hàng' };
    }

    const snapshot = order.product_snapshot || order.productSnapshot;
    const product = snapshot?.product;
    const selectedPackage = snapshot?.selectedPackage;
    const customFieldValues = snapshot?.customFieldValues || {};

    // Check if this is a naperis topup product
    if (!product?.external_api || product.external_api !== 'naperis') {
      console.log('Order is not a naperis topup product');
      return { success: false, message: 'Đơn hàng không phải sản phẩm nạp game Naperis' };
    }

    if (!product.external_category_id || !selectedPackage?.external_product_id) {
      console.error('Missing naperis config:', { 
        categoryId: product.external_category_id, 
        productId: selectedPackage?.external_product_id 
      });
      return { success: false, message: 'Thiếu cấu hình Naperis (categoryId hoặc productId)' };
    }

    console.log('Processing naperis topup:', {
      orderId,
      categoryId: product.external_category_id,
      productId: selectedPackage.external_product_id,
      data: customFieldValues,
    });

    // Call backend API for naperis topup
    const { data: naperisResult, error: naperisError } = await apiClient.post('/integrations/naperis-topup', {
      action: 'create_order',
      categoryId: product.external_category_id,
      productId: selectedPackage.external_product_id,
      data: customFieldValues,
    });

    if (naperisError) {
      console.error('Naperis API error:', naperisError);
      
      // Update order with error
      await apiClient.from('orders').update({
        notes: `Lỗi nạp tự động: ${naperisError.message || naperisError}`,
        status: 'PROCESSING',
      }).eq('id', orderId);

      // Send Discord notification (via backend)
      await apiClient.post('/notifications/discord', {
        type: 'topup_failed',
        data: {
          order_number: order.order_number || order.orderNumber,
          customer_email: order.customer_email || order.customerEmail,
          product_name: product.name,
          error: naperisError.message || naperisError,
        }
      });

      return { success: false, message: naperisError.message || String(naperisError) };
    }

    console.log('Naperis result:', naperisResult);

    // Format delivery content
    const deliveryContent = formatDeliveryContent(naperisResult, product, selectedPackage);

    // Update order with result
    await apiClient.from('orders').update({
      delivery_content: deliveryContent,
      status: 'DELIVERED',
      notes: `Naperis Order ID: ${naperisResult?.orderId || naperisResult?.id || 'N/A'}`,
    }).eq('id', orderId);

    // Send Discord notification
    await apiClient.post('/notifications/discord', {
      type: 'topup_success',
      data: {
        order_number: order.order_number || order.orderNumber,
        customer_email: order.customer_email || order.customerEmail,
        product_name: product.name,
        package_name: selectedPackage.name,
        naperis_order_id: naperisResult?.orderId || naperisResult?.id,
      }
    });

    return { 
      success: true, 
      orderId: naperisResult?.orderId || naperisResult?.id,
      deliveryContent,
    };
  } catch (error) {
    console.error('Topup processing error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Lỗi không xác định' 
    };
  }
};

function formatDeliveryContent(result: any, product: any, selectedPackage: any): string {
  const lines = [
    `=== THÔNG TIN NẠP GAME ===`,
    `Sản phẩm: ${product?.name || 'N/A'}`,
    `Gói: ${selectedPackage?.name || 'N/A'}`,
    `Mã đơn Naperis: ${result?.orderId || result?.id || 'N/A'}`,
    `Trạng thái: ${result?.status || 'Đã xử lý'}`,
    ``,
  ];

  // Add any additional result data
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

// Hook to use in components
export const useProcessTopup = () => {
  const processTopup = async (orderId: string) => {
    const result = await processNaperisTopup(orderId);
    
    if (result.success) {
      toast.success('Đã nạp game thành công');
    } else {
      toast.error(`Lỗi nạp game: ${result.message}`);
    }
    
    return result;
  };

  return { processTopup };
};
