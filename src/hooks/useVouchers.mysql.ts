// Hooks for Vouchers - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';

export interface DbVoucher {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_order_value?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  used_count?: number;
  is_active?: boolean;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (voucher: any): DbVoucher => ({
  ...voucher,
  discount_type: voucher.discountType,
  discount_value: voucher.discountValue,
  min_order_value: voucher.minOrderAmount,
  max_discount: voucher.maxDiscount,
  usage_limit: voucher.maxUses,
  per_user_limit: voucher.perUserLimit,
  used_count: voucher.usedCount,
  is_active: voucher.isActive,
  expires_at: voucher.endDate,
  created_at: voucher.createdAt,
  updated_at: voucher.updatedAt,
});

export const useVouchers = (activeOnly = false) => {
  return useQuery({
    queryKey: ['vouchers', activeOnly],
    queryFn: async () => {
      let query = db.from<DbVoucher>('vouchers').select('*').order('createdAt', { ascending: false });
      if (activeOnly) {
        query = query.eq('isActive', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
  });
};

export const useValidateVoucher = () => {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const { data: voucherData, error } = await db
        .from<DbVoucher>('vouchers')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('isActive', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!voucherData) throw new Error('Mã giảm giá không tồn tại');
      
      const voucher = mapToLegacy(voucherData);
      
      // Check expiration
      const now = new Date();
      if (voucher.startDate && new Date(voucher.startDate) > now) {
        throw new Error('Mã giảm giá chưa có hiệu lực');
      }
      if (voucher.endDate && new Date(voucher.endDate) < now) {
        throw new Error('Mã giảm giá đã hết hạn');
      }
      
      // Check usage limit
      if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng');
      }
      
      // Check minimum order value
      if (voucher.minOrderAmount && orderAmount < voucher.minOrderAmount) {
        throw new Error(`Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString()}đ`);
      }
      
      // Calculate discount
      let discount = 0;
      if (voucher.discountType === 'percentage') {
        discount = (orderAmount * voucher.discountValue) / 100;
        if (voucher.maxDiscount) {
          discount = Math.min(discount, voucher.maxDiscount);
        }
      } else {
        discount = voucher.discountValue;
      }
      
      return { voucher, discount };
    },
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (voucher: Partial<DbVoucher>) => {
      const { data, error } = await db
        .from<DbVoucher>('vouchers')
        .insert({
          code: voucher.code?.toUpperCase() || '',
          description: voucher.description,
          discountType: voucher.discountType || voucher.discount_type || 'percentage',
          discountValue: voucher.discountValue || voucher.discount_value || 0,
          minOrderAmount: voucher.minOrderAmount || voucher.min_order_value,
          maxDiscount: voucher.maxDiscount || voucher.max_discount,
          maxUses: voucher.maxUses || voucher.usage_limit,
          perUserLimit: voucher.perUserLimit || voucher.per_user_limit,
          isActive: voucher.isActive ?? voucher.is_active ?? true,
          startDate: voucher.startDate,
          endDate: voucher.endDate || voucher.expires_at,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbVoucher> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.code !== undefined) updateData.code = updates.code.toUpperCase();
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.discountType !== undefined || updates.discount_type !== undefined) {
        updateData.discountType = updates.discountType || updates.discount_type;
      }
      if (updates.discountValue !== undefined || updates.discount_value !== undefined) {
        updateData.discountValue = updates.discountValue ?? updates.discount_value;
      }
      if (updates.minOrderAmount !== undefined || updates.min_order_value !== undefined) {
        updateData.minOrderAmount = updates.minOrderAmount ?? updates.min_order_value;
      }
      if (updates.maxDiscount !== undefined || updates.max_discount !== undefined) {
        updateData.maxDiscount = updates.maxDiscount ?? updates.max_discount;
      }
      if (updates.maxUses !== undefined || updates.usage_limit !== undefined) {
        updateData.maxUses = updates.maxUses ?? updates.usage_limit;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.endDate !== undefined || updates.expires_at !== undefined) {
        updateData.endDate = updates.endDate || updates.expires_at;
      }

      const { data, error } = await db
        .from<DbVoucher>('vouchers')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};

// Increment voucher usage count
export const useIncrementVoucherUsage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (voucherId: string) => {
      // Get current voucher
      const { data: current, error: getError } = await db
        .from<DbVoucher>('vouchers')
        .select('usedCount')
        .eq('id', voucherId)
        .single();

      if (getError) throw getError;

      // Update count
      const { data, error } = await db
        .from<DbVoucher>('vouchers')
        .update({ usedCount: (current?.usedCount || 0) + 1 })
        .eq('id', voucherId)
        .select('*')
        .single();
        
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vouchers'] }),
  });
};
