// Hooks for User Vouchers - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DbVoucher } from './useVouchers.mysql';

export interface UserVoucher {
  id: string;
  userId: string;
  voucherId: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  voucher?: DbVoucher;
  // Legacy mappings
  user_id?: string;
  voucher_id?: string;
  is_used?: boolean;
  used_at?: string | null;
  created_at?: string;
  expires_at?: string | null;
}

const mapToLegacy = (uv: any): UserVoucher => ({
  ...uv,
  user_id: uv.userId,
  voucher_id: uv.voucherId,
  is_used: uv.isUsed,
  used_at: uv.usedAt,
  created_at: uv.createdAt,
  expires_at: uv.expiresAt,
});

// Get user's assigned vouchers
export const useUserVouchers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-vouchers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await db
        .from<any>('user_vouchers')
        .select('*, voucher:vouchers(*)')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacy) as UserVoucher[];
    },
    enabled: !!user,
  });
};

// Get all user voucher assignments (admin)
export const useAllUserVouchers = () => {
  return useQuery({
    queryKey: ['all-user-vouchers'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('user_vouchers')
        .select('*, voucher:vouchers(*)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacy) as UserVoucher[];
    },
  });
};

// Assign voucher to users
export const useAssignVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      voucherId,
      userIds,
      expiresAt,
    }: {
      voucherId: string;
      userIds: string[];
      expiresAt?: string;
    }) => {
      const records = userIds.map(userId => ({
        userId,
        voucherId,
        expiresAt: expiresAt || null,
      }));

      const { data, error } = await db.from('user_vouchers').insert(records).select();

      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-vouchers'] });
      toast.success('Đã gán voucher cho người dùng');
    },
    onError: (error: any) => {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        toast.error('Voucher đã được gán cho người dùng này');
      } else {
        toast.error(error.message);
      }
    },
  });
};

// Remove voucher from user
export const useRemoveUserVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('user_vouchers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-vouchers'] });
      toast.success('Đã xóa voucher của người dùng');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Mark voucher as used
export const useMarkVoucherUsed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db
        .from('user_vouchers')
        .update({
          isUsed: true,
          usedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
    },
  });
};
