// Hooks for Group Wallet - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupWallet {
  id: string;
  groupId: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  group_id?: string;
  total_income?: number;
  total_expense?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupWalletTransaction {
  id: string;
  groupId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string | null;
  userId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  balanceAfter: number | null;
  createdAt: string;
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  // Legacy mappings
  group_id?: string;
  user_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  balance_after?: number | null;
  created_at?: string;
}

const mapWalletToLegacy = (w: any): GroupWallet => ({
  ...w,
  group_id: w.groupId,
  total_income: w.totalIncome,
  total_expense: w.totalExpense,
  created_at: w.createdAt,
  updated_at: w.updatedAt,
});

const mapTransactionToLegacy = (t: any): GroupWalletTransaction => ({
  ...t,
  group_id: t.groupId,
  user_id: t.userId,
  reference_type: t.referenceType,
  reference_id: t.referenceId,
  balance_after: t.balanceAfter,
  created_at: t.createdAt,
  user: t.user ? {
    full_name: t.user.fullName,
    avatar_url: t.user.avatarUrl,
  } : null,
});

// Fetch group wallet
export function useGroupWallet(groupId: string) {
  return useQuery({
    queryKey: ['group-wallet', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_wallets')
        .select('*')
        .eq('groupId', groupId)
        .single();

      if (error) throw error;
      return mapWalletToLegacy(data) as GroupWallet;
    },
    enabled: !!groupId,
  });
}

// Fetch wallet transactions
export function useGroupWalletTransactions(groupId: string, limit = 50) {
  return useQuery({
    queryKey: ['group-wallet-transactions', groupId, limit],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_wallet_transactions')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupWalletTransaction[];

      // Fetch user profiles
      const userIds = data.filter((t: any) => t.userId).map((t: any) => t.userId!);
      let profileMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', userIds);

        profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      }

      return data.map((tx: any) => ({
        ...mapTransactionToLegacy(tx),
        user: tx.userId ? profileMap.get(tx.userId) || null : null,
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

      const { error } = await db.from('group_wallet_transactions').insert({
        groupId,
        amount,
        type: 'income',
        category,
        description,
        userId: userId || null,
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

      const { error } = await db.from('group_wallet_transactions').insert({
        groupId,
        amount,
        type: 'expense',
        category,
        description,
        userId: userId || null,
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
        await db.from('group_wallet_transactions').insert({
          groupId,
          amount,
          type: 'expense',
          category: 'reward',
          description: reason,
          userId,
        });
      }

      // Add contribution points if specified
      if (points && points > 0) {
        await db.from('group_contribution_history').insert({
          groupId,
          userId,
          pointsChange: points,
          reason,
          referenceType: 'reward',
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
      const { data, error } = await db
        .from<any>('group_wallet_transactions')
        .select('type, category, amount')
        .eq('groupId', groupId);

      if (error) throw error;

      const incomeByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};

      data?.forEach((t: any) => {
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
