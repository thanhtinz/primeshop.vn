import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface SellerWalletTransaction {
  id: string;
  seller_id: string;
  type: 'sale' | 'fee' | 'withdrawal' | 'refund' | 'boost' | 'escrow_release' | 'escrow_lock' | 'dispute_lock' | 'dispute_release';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: string | null;
  reference_type: string | null;
  note: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface SellerBalance {
  available: number;
  pending: number;
  locked: number;
  total: number;
}

export const useSellerBalance = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-balance', sellerId],
    queryFn: async (): Promise<SellerBalance> => {
      if (!sellerId) return { available: 0, pending: 0, locked: 0, total: 0 };

      const { data, error } = await supabase
        .from('sellers')
        .select('balance, pending_balance, locked_balance')
        .eq('id', sellerId)
        .single();

      if (error) throw error;

      return {
        available: data.balance || 0,
        pending: data.pending_balance || 0,
        locked: data.locked_balance || 0,
        total: (data.balance || 0) + (data.pending_balance || 0) + (data.locked_balance || 0),
      };
    },
    enabled: !!sellerId,
  });
};

export const useSellerTransactions = (sellerId?: string, limit = 50) => {
  return useQuery({
    queryKey: ['seller-transactions', sellerId, limit],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('seller_wallet_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SellerWalletTransaction[];
    },
    enabled: !!sellerId,
  });
};

export const useCreateFastWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      amount,
      bankInfo,
    }: {
      sellerId: string;
      amount: number;
      bankInfo: { bank_name: string; account_number: string; account_name: string; phone_number?: string };
    }) => {
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('create_seller_fast_withdrawal', {
        p_seller_id: sellerId,
        p_amount: amount,
        p_bank_name: bankInfo.bank_name,
        p_bank_account: bankInfo.account_number,
        p_bank_holder: bankInfo.account_name
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; withdrawal_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo yêu cầu rút tiền');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['seller-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
      toast.success('Đã gửi yêu cầu rút tiền nhanh');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo yêu cầu rút tiền');
    },
  });
};

export const useCreateNormalWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sellerId,
      amount,
      bankInfo,
    }: {
      sellerId: string;
      amount: number;
      bankInfo: { bank_name: string; account_number: string; account_name: string; phone_number?: string };
    }) => {
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('create_seller_normal_withdrawal', {
        p_seller_id: sellerId,
        p_amount: amount,
        p_bank_name: bankInfo.bank_name,
        p_bank_account: bankInfo.account_number,
        p_bank_holder: bankInfo.account_name
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; withdrawal_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo yêu cầu rút tiền');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['seller-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
      toast.success('Đã gửi yêu cầu rút tiền. Admin sẽ duyệt trong 1-3 ngày làm việc.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo yêu cầu rút tiền');
    },
  });
};

export const useTransferToWebBalance = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({
      sellerId,
      amount,
    }: {
      sellerId: string;
      amount: number;
    }) => {
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('transfer_seller_to_web_balance', {
        p_seller_id: sellerId,
        p_amount: amount
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_seller_balance?: number; new_user_balance?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể chuyển tiền');
      }

      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      // Refresh profile to update balance in AuthContext
      await refreshProfile();
      toast.success('Đã chuyển tiền sang số dư website');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể chuyển tiền');
    },
  });
};

export const useSellerWithdrawals = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-withdrawals', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });
};
