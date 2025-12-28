import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DbVoucher } from './useVouchers';

export interface UserVoucher {
  id: string;
  user_id: string;
  voucher_id: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  voucher?: DbVoucher;
}

// Get user's assigned vouchers
export const useUserVouchers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-vouchers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_vouchers')
        .select(`
          *,
          voucher:vouchers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserVoucher[];
    },
    enabled: !!user,
  });
};

// Get all user voucher assignments (admin)
export const useAllUserVouchers = () => {
  return useQuery({
    queryKey: ['all-user-vouchers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_vouchers')
        .select(`
          *,
          voucher:vouchers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserVoucher[];
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
      expiresAt 
    }: { 
      voucherId: string; 
      userIds: string[]; 
      expiresAt?: string 
    }) => {
      const records = userIds.map(userId => ({
        user_id: userId,
        voucher_id: voucherId,
        expires_at: expiresAt || null,
      }));

      const { data, error } = await (supabase as any)
        .from('user_vouchers')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-vouchers'] });
      toast.success('Đã gán voucher cho người dùng');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Voucher đã được gán cho người dùng này');
      } else {
        toast.error(error.message);
      }
    },
  });
};

// Delete user voucher assignment
export const useDeleteUserVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('user_vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-vouchers'] });
      toast.success('Đã xóa voucher');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Mark voucher as used
export const useMarkVoucherUsed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userVoucherId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('user_vouchers')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', userVoucherId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
    },
  });
};
