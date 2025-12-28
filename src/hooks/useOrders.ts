import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderEmail, getEmailTemplateForStatus } from './useAutoEmail';
import { 
  notifyOrderPaid, 
  notifyOrderCompleted, 
  notifyOrderCancelled, 
  notifyOrderRefunded,
  notifyOrderDelivered 
} from '@/services/notificationService';

export interface DbOrder {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  voucher_id: string | null;
  voucher_code: string | null;
  referral_code: string | null;
  delivery_content: string | null;
  notes: string | null;
  product_snapshot: any;
  created_at: string;
  updated_at: string;
}

export interface DbPayment {
  id: string;
  order_id: string;
  payment_provider: string;
  payment_id: string | null;
  amount: number;
  status: string;
  payment_url: string | null;
  payment_data: any;
  created_at: string;
  updated_at: string;
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbOrder[];
    },
  });
};

export const useOrdersByEmail = (email: string) => {
  return useQuery({
    queryKey: ['orders', 'email', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbOrder[];
    },
    enabled: !!email,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Omit<DbOrder, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('orders').insert([order]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbOrder> & { id: string }) => {
      // Get current order to check status change
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
      if (error) throw error;

      // Send automatic email on status change
      if (updates.status && currentOrder && currentOrder.status !== updates.status) {
        const templateName = getEmailTemplateForStatus(updates.status);
        if (templateName) {
          sendOrderEmail(templateName, {
            order_number: data.order_number,
            customer_email: data.customer_email,
            customer_name: data.customer_name || undefined,
            total_amount: data.total_amount,
            delivery_content: data.delivery_content || undefined,
          });
        }
        
        // Get user_id from customer email to send notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', data.customer_email)
          .maybeSingle();
        
        if (profile?.user_id) {
          // Send appropriate notification based on status
          switch (updates.status) {
            case 'paid':
            case 'processing':
              notifyOrderPaid(profile.user_id, data.order_number);
              break;
            case 'completed':
              notifyOrderCompleted(profile.user_id, data.order_number);
              break;
            case 'cancelled':
              notifyOrderCancelled(profile.user_id, data.order_number);
              break;
            case 'refunded':
              notifyOrderRefunded(profile.user_id, data.order_number, data.total_amount);
              break;
            case 'delivered':
              notifyOrderDelivered(profile.user_id, data.order_number);
              break;
          }
        }
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
};

// Payments
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, order:orders(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Omit<DbPayment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('payments').insert([payment]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbPayment> & { id: string }) => {
      const { data, error } = await supabase.from('payments').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
};
