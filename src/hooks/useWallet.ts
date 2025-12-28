import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'payment' | 'refund' | 'commission' | 'reward';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  recipient_id?: string;
  sender_id?: string;
  note?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  // Joined data
  recipient?: { full_name: string; email: string; avatar_url: string };
  sender?: { full_name: string; email: string; avatar_url: string };
}

export interface P2PTransfer {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number;
  message?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  completed_at?: string;
  created_at: string;
  sender?: { full_name: string; email: string; avatar_url: string; username: string };
  recipient?: { full_name: string; email: string; avatar_url: string; username: string };
}

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
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or(`user_id.eq.${user.id},recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WalletTransaction[];
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
      
      const { data, error } = await supabase
        .from('p2p_transfers')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as P2PTransfer[];
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
      
      // Use atomic RPC function for P2P transfer
      const { data: result, error } = await supabase.rpc('create_p2p_transfer', {
        p_sender_id: user.id,
        p_recipient_identifier: recipientUsername,
        p_amount: amount,
        p_message: message || null
      });

      if (error) throw error;

      const rpcResult = result as {
        success: boolean;
        error?: string;
        transfer_id?: string;
        recipient_id?: string;
        recipient_name?: string;
        amount?: number;
        new_balance?: number;
      };

      if (!rpcResult.success) {
        throw new Error(rpcResult.error || 'Chuyển tiền thất bại');
      }

      return {
        transfer_id: rpcResult.transfer_id,
        recipient_name: rpcResult.recipient_name,
        amount: rpcResult.amount,
        new_balance: rpcResult.new_balance
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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, email, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('user_id', user?.id || '')
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!query && query.length >= 2
  });
};
