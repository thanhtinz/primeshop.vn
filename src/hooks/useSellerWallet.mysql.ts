// Hooks for Seller Wallet - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { toast } from 'sonner';

export interface SellerWalletTransaction {
  id: string;
  sellerId: string;
  type: 'sale' | 'fee' | 'withdrawal' | 'refund' | 'boost' | 'escrow_release' | 'escrow_lock' | 'dispute_lock' | 'dispute_release';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  note: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  // Legacy mappings
  seller_id?: string;
  balance_before?: number;
  balance_after?: number;
  reference_id?: string | null;
  reference_type?: string | null;
  created_at?: string;
}

export interface SellerBalance {
  available: number;
  pending: number;
  locked: number;
  total: number;
}

const mapTransactionToLegacy = (t: any): SellerWalletTransaction => ({
  ...t,
  seller_id: t.sellerId,
  balance_before: t.balanceBefore,
  balance_after: t.balanceAfter,
  reference_id: t.referenceId,
  reference_type: t.referenceType,
  created_at: t.createdAt,
});

export const useSellerBalance = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-balance', sellerId],
    queryFn: async (): Promise<SellerBalance> => {
      if (!sellerId) return { available: 0, pending: 0, locked: 0, total: 0 };

      const { data, error } = await db
        .from<any>('sellers')
        .select('balance, pendingBalance, lockedBalance')
        .eq('id', sellerId)
        .single();

      if (error) throw error;

      return {
        available: data.balance || 0,
        pending: data.pendingBalance || 0,
        locked: data.lockedBalance || 0,
        total: (data.balance || 0) + (data.pendingBalance || 0) + (data.lockedBalance || 0),
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

      const { data, error } = await db
        .from<any>('seller_wallet_transactions')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(mapTransactionToLegacy) as SellerWalletTransaction[];
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
      const result = await rpc('create_seller_fast_withdrawal', {
        p_seller_id: sellerId,
        p_amount: amount,
        p_bank_name: bankInfo.bank_name,
        p_bank_account: bankInfo.account_number,
        p_bank_holder: bankInfo.account_name
      });

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
      const result = await rpc('create_seller_normal_withdrawal', {
        p_seller_id: sellerId,
        p_amount: amount,
        p_bank_name: bankInfo.bank_name,
        p_bank_account: bankInfo.account_number,
        p_bank_holder: bankInfo.account_name
      });

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

export const useSellerWithdrawals = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-withdrawals', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('seller_withdrawals')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map((w: any) => ({
        ...w,
        seller_id: w.sellerId,
        bank_name: w.bankName,
        bank_account: w.bankAccount,
        bank_holder: w.bankHolder,
        created_at: w.createdAt,
        completed_at: w.completedAt,
      }));
    },
    enabled: !!sellerId,
  });
};

// Cancel withdrawal (if pending)
export const useCancelWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const { data: withdrawal } = await db
        .from<any>('seller_withdrawals')
        .select('sellerId, amount, status')
        .eq('id', withdrawalId)
        .single();

      if (!withdrawal || withdrawal.status !== 'pending') {
        throw new Error('Không thể hủy yêu cầu này');
      }

      // Update withdrawal status
      const { error } = await db
        .from('seller_withdrawals')
        .update({ status: 'cancelled' })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Refund balance
      const { data: seller } = await db
        .from<any>('sellers')
        .select('balance')
        .eq('id', withdrawal.sellerId)
        .single();

      if (seller) {
        await db
          .from('sellers')
          .update({ balance: (seller.balance || 0) + withdrawal.amount })
          .eq('id', withdrawal.sellerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-balance'] });
      queryClient.invalidateQueries({ queryKey: ['seller-withdrawals'] });
      toast.success('Đã hủy yêu cầu rút tiền');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
