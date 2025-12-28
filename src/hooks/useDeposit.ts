import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DepositTransaction {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_provider: string;
  payment_id: string | null;
  payment_url: string | null;
  payment_data: any;
  created_at: string;
  updated_at: string;
}

export const useUserDeposits = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DepositTransaction[];
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

      const { data, error } = await supabase
        .from('deposit_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data as DepositTransaction;
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
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('deposit_transactions')
        .update({
          status,
          payment_id,
          payment_data
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DepositTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['all-deposits'] });
    }
  });
};
