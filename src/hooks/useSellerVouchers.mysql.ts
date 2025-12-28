// Hooks for Seller Vouchers - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useCurrentSeller } from './useMarketplace.mysql';

export interface SellerVoucher {
  id: string;
  sellerId: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  seller_id?: string;
  min_order_amount?: number;
  max_uses?: number | null;
  per_user_limit?: number | null;
  used_count?: number;
  valid_from?: string;
  valid_to?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const mapVoucherToLegacy = (v: any): SellerVoucher => ({
  ...v,
  seller_id: v.sellerId,
  min_order_amount: v.minOrderAmount,
  max_uses: v.maxUses,
  per_user_limit: v.perUserLimit,
  used_count: v.usedCount,
  valid_from: v.validFrom,
  valid_to: v.validTo,
  is_active: v.isActive,
  created_at: v.createdAt,
  updated_at: v.updatedAt,
});

export const useSellerVouchers = () => {
  const { data: seller } = useCurrentSeller();

  return useQuery({
    queryKey: ['seller-vouchers', seller?.id],
    queryFn: async () => {
      if (!seller) return [];

      const { data, error } = await db
        .from<any>('seller_vouchers')
        .select('*')
        .eq('sellerId', seller.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapVoucherToLegacy) as SellerVoucher[];
    },
    enabled: !!seller,
  });
};

export const useCreateSellerVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: voucher, error } = await db
        .from('seller_vouchers')
        .insert({
          sellerId: data.seller_id,
          code: data.code,
          type: data.type,
          value: data.value,
          minOrderAmount: data.min_order_amount || 0,
          maxUses: data.max_uses,
          perUserLimit: data.per_user_limit,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          isActive: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapVoucherToLegacy(voucher) as SellerVoucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    },
  });
};

export const useUpdateSellerVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const updates: any = {};
      if (data.code) updates.code = data.code;
      if (data.type) updates.type = data.type;
      if (data.value !== undefined) updates.value = data.value;
      if (data.min_order_amount !== undefined) updates.minOrderAmount = data.min_order_amount;
      if (data.max_uses !== undefined) updates.maxUses = data.max_uses;
      if (data.per_user_limit !== undefined) updates.perUserLimit = data.per_user_limit;
      if (data.valid_from) updates.validFrom = data.valid_from;
      if (data.valid_to) updates.validTo = data.valid_to;
      if (data.is_active !== undefined) updates.isActive = data.is_active;

      const { data: voucher, error } = await db
        .from('seller_vouchers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapVoucherToLegacy(voucher) as SellerVoucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    },
  });
};

export const useDeleteSellerVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('seller_vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-vouchers'] });
    },
  });
};

// Get voucher by code for a specific seller (used during checkout)
export const useSellerVoucherByCode = (sellerId: string, code: string) => {
  return useQuery({
    queryKey: ['seller-voucher', sellerId, code],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await db
        .from<any>('seller_vouchers')
        .select('*')
        .eq('sellerId', sellerId)
        .eq('code', code.toUpperCase())
        .eq('isActive', true)
        .gte('validTo', now)
        .lte('validFrom', now)
        .single();

      if (error) return null;

      // Check usage limit
      if (data.maxUses && data.usedCount >= data.maxUses) {
        return null;
      }

      return mapVoucherToLegacy(data) as SellerVoucher;
    },
    enabled: !!sellerId && !!code,
  });
};
