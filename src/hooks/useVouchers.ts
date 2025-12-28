import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbVoucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useVouchers = (activeOnly = false) => {
  return useQuery({
    queryKey: ['vouchers', activeOnly],
    queryFn: async () => {
      let query = supabase.from('vouchers').select('*').order('created_at', { ascending: false });
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as DbVoucher[];
    },
  });
};

export const useValidateVoucher = () => {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Mã giảm giá không tồn tại');
      
      const voucher = data as DbVoucher;
      
      // Check expiration
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        throw new Error('Mã giảm giá đã hết hạn');
      }
      
      // Check usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }
      
      // Check minimum order value
      if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
        throw new Error(`Đơn hàng tối thiểu ${voucher.min_order_value.toLocaleString()}đ`);
      }
      
      // Calculate discount
      let discount = 0;
      if (voucher.discount_type === 'percentage') {
        discount = (orderAmount * voucher.discount_value) / 100;
        if (voucher.max_discount) {
          discount = Math.min(discount, voucher.max_discount);
        }
      } else {
        discount = voucher.discount_value;
      }
      
      return { voucher, discount };
    },
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (voucher: Omit<DbVoucher, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => {
      const { data, error } = await supabase.from('vouchers').insert([voucher]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbVoucher> & { id: string }) => {
      const { data, error } = await supabase.from('vouchers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

export const useIncrementVoucherUsage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: voucher } = await supabase.from('vouchers').select('used_count').eq('id', id).single();
      const { error } = await supabase.from('vouchers').update({ 
        used_count: (voucher?.used_count || 0) + 1 
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};
