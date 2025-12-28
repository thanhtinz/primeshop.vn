// Hooks for Orders - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  voucherId: string | null;
  voucherCode: string | null;
  referralCode: string | null;
  deliveryContent: string | null;
  notes: string | null;
  productSnapshot: any;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  order_number?: string;
  user_id?: string | null;
  customer_email?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  discount_amount?: number;
  total_amount?: number;
  voucher_id?: string | null;
  voucher_code?: string | null;
  referral_code?: string | null;
  delivery_content?: string | null;
  product_snapshot?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DbPayment {
  id: string;
  orderId: string;
  paymentProvider: string;
  paymentId: string | null;
  amount: number;
  status: string;
  paymentUrl: string | null;
  paymentData: any;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  order_id?: string;
  payment_provider?: string;
  payment_id?: string | null;
  payment_url?: string | null;
  payment_data?: any;
  created_at?: string;
  updated_at?: string;
}

const mapOrderToLegacy = (order: any): DbOrder => ({
  ...order,
  order_number: order.orderNumber,
  user_id: order.userId,
  customer_email: order.customerEmail,
  customer_name: order.customerName,
  customer_phone: order.customerPhone,
  discount_amount: order.discountAmount,
  total_amount: order.totalAmount,
  voucher_id: order.voucherId,
  voucher_code: order.voucherCode,
  referral_code: order.referralCode,
  delivery_content: order.deliveryContent,
  product_snapshot: order.productSnapshot,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
});

const mapPaymentToLegacy = (payment: any): DbPayment => ({
  ...payment,
  order_id: payment.orderId,
  payment_provider: payment.paymentProvider,
  payment_id: payment.paymentId,
  payment_url: payment.paymentUrl,
  payment_data: payment.paymentData,
  created_at: payment.createdAt,
  updated_at: payment.updatedAt,
});

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbOrder>('orders')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapOrderToLegacy);
    },
  });
};

export const useUserOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orders', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<DbOrder>('orders')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapOrderToLegacy);
    },
    enabled: !!user,
  });
};

export const useOrdersByEmail = (email: string) => {
  return useQuery({
    queryKey: ['orders', 'email', email],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbOrder>('orders')
        .select('*')
        .eq('customerEmail', email)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapOrderToLegacy);
    },
    enabled: !!email,
  });
};

export const useOrderByNumber = (orderNumber: string) => {
  return useQuery({
    queryKey: ['orders', 'number', orderNumber],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbOrder>('orders')
        .select('*')
        .eq('orderNumber', orderNumber)
        .single();
      if (error) throw error;
      return data ? mapOrderToLegacy(data) : null;
    },
    enabled: !!orderNumber,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (order: Partial<DbOrder>) => {
      const { data, error } = await db
        .from<DbOrder>('orders')
        .insert({
          orderNumber: order.orderNumber || order.order_number || `ORD${Date.now()}`,
          userId: user?.id || order.userId || order.user_id,
          customerEmail: order.customerEmail || order.customer_email || '',
          customerName: order.customerName || order.customer_name,
          customerPhone: order.customerPhone || order.customer_phone,
          status: order.status || 'pending',
          subtotal: order.subtotal || 0,
          discountAmount: order.discountAmount || order.discount_amount || 0,
          totalAmount: order.totalAmount || order.total_amount || 0,
          voucherId: order.voucherId || order.voucher_id,
          voucherCode: order.voucherCode || order.voucher_code,
          referralCode: order.referralCode || order.referral_code,
          deliveryContent: order.deliveryContent || order.delivery_content,
          notes: order.notes,
          productSnapshot: order.productSnapshot || order.product_snapshot,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapOrderToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbOrder> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.deliveryContent !== undefined || updates.delivery_content !== undefined) {
        updateData.deliveryContent = updates.deliveryContent || updates.delivery_content;
      }
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await db
        .from<DbOrder>('orders')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapOrderToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

// Payments
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbPayment>('payments')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapPaymentToLegacy);
    },
  });
};

export const usePaymentsByOrder = (orderId: string) => {
  return useQuery({
    queryKey: ['payments', 'order', orderId],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbPayment>('payments')
        .select('*')
        .eq('orderId', orderId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapPaymentToLegacy);
    },
    enabled: !!orderId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Partial<DbPayment>) => {
      const { data, error } = await db
        .from<DbPayment>('payments')
        .insert({
          orderId: payment.orderId || payment.order_id || '',
          paymentProvider: payment.paymentProvider || payment.payment_provider || 'payos',
          paymentId: payment.paymentId || payment.payment_id,
          amount: payment.amount || 0,
          status: payment.status || 'pending',
          paymentUrl: payment.paymentUrl || payment.payment_url,
          paymentData: payment.paymentData || payment.payment_data,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapPaymentToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbPayment> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paymentId !== undefined || updates.payment_id !== undefined) {
        updateData.paymentId = updates.paymentId || updates.payment_id;
      }
      if (updates.paymentData !== undefined || updates.payment_data !== undefined) {
        updateData.paymentData = updates.paymentData || updates.payment_data;
      }

      const { data, error } = await db
        .from<DbPayment>('payments')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapPaymentToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
};
