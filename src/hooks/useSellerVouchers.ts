import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeller } from './useMarketplace';

export interface SellerVoucher {
  id: string;
  seller_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  per_user_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSellerVouchers = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['seller-vouchers', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await supabase
        .from('seller_vouchers')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SellerVoucher[];
    },
    enabled: !!seller
  });
};

export const useCreateSellerVoucher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<SellerVoucher, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => {
      const { data: voucher, error } = await supabase
        .from('seller_vouchers')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return voucher as SellerVoucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    }
  });
};

export const useUpdateSellerVoucher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SellerVoucher> & { id: string }) => {
      const { data: voucher, error } = await supabase
        .from('seller_vouchers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return voucher as SellerVoucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    }
  });
};

export const useDeleteSellerVoucher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seller_vouchers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    }
  });
};

// Get voucher by code for a specific seller (used during checkout)
export const useSellerVoucherByCode = (sellerId: string, code: string) => {
  return useQuery({
    queryKey: ['seller-voucher', sellerId, code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_vouchers')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_to', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .single();
      
      if (error) return null;
      
      // Check usage limit
      if (data.max_uses && data.used_count >= data.max_uses) {
        return null;
      }
      
      return data as SellerVoucher;
    },
    enabled: !!sellerId && !!code
  });
};
