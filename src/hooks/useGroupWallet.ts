import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupWallet {
  id: string;
  group_id: string;
  balance: number;
  total_income: number;
  total_expense: number;
  created_at: string;
  updated_at: string;
}

export interface GroupWalletTransaction {
  id: string;
  group_id: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string | null;
  user_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  balance_after: number | null;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch group wallet
export function useGroupWallet(groupId: string) {
  return useQuery({
    queryKey: ['group-wallet', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_wallets')
        .select('*')
        .eq('group_id', groupId)
        .single();
      
      if (error) throw error;
      return data as GroupWallet;
    },
    enabled: !!groupId,
  });
}

// Fetch wallet transactions
export function useGroupWalletTransactions(groupId: string, limit = 50) {
  return useQuery({
    queryKey: ['group-wallet-transactions', groupId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_wallet_transactions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupWalletTransaction[];
      
      // Fetch user profiles
      const userIds = data.filter(t => t.user_id).map(t => t.user_id!);
      let profileMap = new Map<string, any>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }
      
      return data.map(tx => ({
        ...tx,
        user: tx.user_id ? profileMap.get(tx.user_id) || null : null,
      })) as GroupWalletTransaction[];
    },
    enabled: !!groupId,
  });
}

// Add income
export function useAddWalletIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      groupId, 
      amount, 
      category, 
      description,
      userId,
    }: { 
      groupId: string; 
      amount: number;
      category: string;
      description?: string;
      userId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_wallet_transactions')
        .insert({
          group_id: groupId,
          amount,
          type: 'income',
          category,
          description,
          user_id: userId || null,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-wallet', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-wallet-transactions', groupId] });
      toast.success('Đã thêm thu nhập!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thêm thu nhập');
    },
  });
}

// Add expense
export function useAddWalletExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      groupId, 
      amount, 
      category, 
      description,
      userId,
    }: { 
      groupId: string; 
      amount: number;
      category: string;
      description?: string;
      userId?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_wallet_transactions')
        .insert({
          group_id: groupId,
          amount,
          type: 'expense',
          category,
          description,
          user_id: userId || null,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-wallet', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-wallet-transactions', groupId] });
      toast.success('Đã thêm chi tiêu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thêm chi tiêu');
    },
  });
}

// Reward member
export function useRewardMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      groupId, 
      userId,
      amount, 
      reason,
      points,
    }: { 
      groupId: string; 
      userId: string;
      amount?: number;
      reason: string;
      points?: number;
    }) => {
      // Add wallet expense if amount
      if (amount && amount > 0) {
        await supabase.from('group_wallet_transactions').insert({
          group_id: groupId,
          amount,
          type: 'expense',
          category: 'reward',
          description: reason,
          user_id: userId,
        });
      }
      
      // Add contribution points if specified
      if (points && points > 0) {
        await supabase.from('group_contribution_history').insert({
          group_id: groupId,
          user_id: userId,
          points_change: points,
          reason,
          reference_type: 'reward',
        });
      }
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-wallet', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-wallet-transactions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã thưởng thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể thưởng');
    },
  });
}

// Wallet stats by category
export function useWalletStatsByCategory(groupId: string) {
  return useQuery({
    queryKey: ['group-wallet-stats', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_wallet_transactions')
        .select('type, category, amount')
        .eq('group_id', groupId);
      
      if (error) throw error;
      
      const incomeByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};
      
      data?.forEach(t => {
        if (t.type === 'income') {
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + Number(t.amount);
        } else {
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Number(t.amount);
        }
      });
      
      return { incomeByCategory, expenseByCategory };
    },
    enabled: !!groupId,
  });
}
