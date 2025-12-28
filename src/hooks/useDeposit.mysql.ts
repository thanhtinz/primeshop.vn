// Hooks for Deposit - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface DepositTransaction {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentProvider: string;
  paymentId: string | null;
  paymentUrl: string | null;
  paymentData: any;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  user_id?: string;
  payment_provider?: string;
  payment_id?: string | null;
  payment_url?: string | null;
  payment_data?: any;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (deposit: any): DepositTransaction => ({
  ...deposit,
  user_id: deposit.userId,
  payment_provider: deposit.paymentProvider,
  payment_id: deposit.paymentId,
  payment_url: deposit.paymentUrl,
  payment_data: deposit.paymentData,
  created_at: deposit.createdAt,
  updated_at: deposit.updatedAt,
});

export const useUserDeposits = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<DepositTransaction>('deposits')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
    enabled: !!user
  });
};

export const useCreateDeposit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await db
        .from<DepositTransaction>('deposits')
        .insert({
          userId: user.id,
          amount: amount,
          status: 'pending',
          paymentProvider: 'payos',
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    }
  });
};

export const useAllDeposits = () => {
  return useQuery({
    queryKey: ['all-deposits'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('deposits')
        .select('*, user:users(email, displayName)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...mapToLegacy(d),
        profiles: d.user ? {
          email: d.user.email,
          full_name: d.user.displayName,
        } : null,
      }));
    }
  });
};

export const useUpdateDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      payment_id,
      payment_data 
    }: { 
      id: string; 
      status: string;
      payment_id?: string;
      payment_data?: any;
    }) => {
      const { data, error } = await db
        .from<DepositTransaction>('deposits')
        .update({
          status,
          paymentId: payment_id,
          paymentData: payment_data,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['all-deposits'] });
    }
  });
};

// Create PayOS deposit payment
export const useCreatePayOSDeposit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('User not authenticated');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_URL}/payments/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deposit');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    }
  });
};
