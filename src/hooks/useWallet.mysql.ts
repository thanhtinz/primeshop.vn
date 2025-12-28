// Hooks for Wallet - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'payment' | 'refund' | 'commission' | 'reward';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  recipientId?: string;
  senderId?: string;
  note?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  // Legacy mappings
  user_id?: string;
  balance_before?: number;
  balance_after?: number;
  reference_type?: string;
  reference_id?: string;
  recipient_id?: string;
  sender_id?: string;
  created_at?: string;
  recipient?: { full_name: string; email: string; avatar_url: string };
  sender?: { full_name: string; email: string; avatar_url: string };
}

export interface P2PTransfer {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  completedAt?: string;
  createdAt: string;
  // Legacy mappings
  sender_id?: string;
  recipient_id?: string;
  completed_at?: string;
  created_at?: string;
  sender?: { full_name: string; email: string; avatar_url: string; username: string };
  recipient?: { full_name: string; email: string; avatar_url: string; username: string };
}

const mapTransactionToLegacy = (tx: any): WalletTransaction => ({
  ...tx,
  user_id: tx.userId,
  balance_before: tx.balanceBefore,
  balance_after: tx.balanceAfter,
  reference_type: tx.referenceType,
  reference_id: tx.referenceId,
  recipient_id: tx.recipientId,
  sender_id: tx.senderId,
  created_at: tx.createdAt,
});

const mapP2PToLegacy = (transfer: any): P2PTransfer => ({
  ...transfer,
  sender_id: transfer.senderId,
  recipient_id: transfer.recipientId,
  completed_at: transfer.completedAt,
  created_at: transfer.createdAt,
});

export const useWalletBalance = () => {
  const { user, profile } = useAuth();
  
  return {
    balance: profile?.balance ?? 0,
    isLoading: !profile && !!user
  };
};

export const useWalletTransactions = (limit = 50) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<any>('wallet_transactions')
        .select('*')
        .or(`userId.eq.${user.id},recipientId.eq.${user.id},senderId.eq.${user.id}`)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(mapTransactionToLegacy);
    },
    enabled: !!user
  });
};

export const useP2PTransfers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['p2p-transfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<any>('p2p_transfers')
        .select('*')
        .or(`senderId.eq.${user.id},recipientId.eq.${user.id}`)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapP2PToLegacy);
    },
    enabled: !!user
  });
};

export const useCreateP2PTransfer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      recipientUsername, 
      amount, 
      message 
    }: { 
      recipientUsername: string; 
      amount: number; 
      message?: string;
    }) => {
      if (!user) throw new Error('Chưa đăng nhập');
      
      // Use RPC function for P2P transfer
      const { data: result, error } = await rpc.invoke<{
        success: boolean;
        error?: string;
        transfer_id?: string;
        recipient_id?: string;
        recipient_name?: string;
        amount?: number;
        new_balance?: number;
      }>('create_p2p_transfer', {
        sender_id: user.id,
        recipient_identifier: recipientUsername,
        amount: amount,
        message: message || null
      });

      if (error) throw error;

      if (!result?.success) {
        throw new Error(result?.error || 'Chuyển tiền thất bại');
      }

      return {
        transfer_id: result.transfer_id,
        recipient_name: result.recipient_name,
        amount: result.amount,
        new_balance: result.new_balance
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['p2p-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success(`Đã chuyển ${data.amount?.toLocaleString()}đ cho ${data.recipient_name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useSearchUsers = (query: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await db
        .from<any>('profiles')
        .select('userId, username, fullName, email, avatarUrl')
        .or(`username.ilike.%${query}%,fullName.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('userId', user?.id || '')
        .limit(10);

      if (error) throw error;
      
      // Map to legacy format
      return (data || []).map((u: any) => ({
        user_id: u.userId,
        username: u.username,
        full_name: u.fullName,
        email: u.email,
        avatar_url: u.avatarUrl,
      }));
    },
    enabled: !!query && query.length >= 2
  });
};

// Additional wallet hooks
export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      amount,
      bankName,
      bankAccount,
      bankHolder,
    }: { 
      amount: number; 
      bankName: string;
      bankAccount: string;
      bankHolder: string;
    }) => {
      if (!user) throw new Error('Chưa đăng nhập');
      
      const { data, error } = await db
        .from('withdrawal_requests')
        .insert({
          userId: user.id,
          amount,
          bankName,
          bankAccount,
          bankHolder,
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      toast.success('Đã gửi yêu cầu rút tiền');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useWithdrawalRequests = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['withdrawal-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<any>('withdrawal_requests')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...r,
        user_id: r.userId,
        bank_name: r.bankName,
        bank_account: r.bankAccount,
        bank_holder: r.bankHolder,
        processed_at: r.processedAt,
        processed_by: r.processedBy,
        admin_notes: r.adminNotes,
        created_at: r.createdAt,
      }));
    },
    enabled: !!user
  });
};
