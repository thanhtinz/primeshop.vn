import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GameAccountInventory {
  id: string;
  product_id: string;
  account_data: string;
  status: 'available' | 'sold' | 'hidden';
  sold_at: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useGameAccountInventory = (productId?: string) => {
  return useQuery({
    queryKey: ['game-account-inventory', productId],
    queryFn: async () => {
      let query = supabase
        .from('game_account_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as GameAccountInventory[];
    },
    enabled: !!productId || productId === undefined,
  });
};

export const useAvailableAccountCount = (productId: string) => {
  return useQuery({
    queryKey: ['available-account-count', productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('game_account_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('status', 'available');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!productId,
  });
};

export const useAddGameAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, accountData }: { productId: string; accountData: string }) => {
      const { data, error } = await supabase
        .from('game_account_inventory')
        .insert({ product_id: productId, account_data: accountData })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game-account-inventory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['available-account-count', variables.productId] });
    },
  });
};

export const useAddMultipleGameAccounts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, accounts }: { productId: string; accounts: string[] }) => {
      const records = accounts.map(account_data => ({
        product_id: productId,
        account_data: account_data.trim(),
      }));
      
      const { data, error } = await supabase
        .from('game_account_inventory')
        .insert(records)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game-account-inventory', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['available-account-count', variables.productId] });
    },
  });
};

export const useUpdateGameAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GameAccountInventory> & { id: string }) => {
      const { data, error } = await supabase
        .from('game_account_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-account-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['available-account-count'] });
    },
  });
};

export const useDeleteGameAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('game_account_inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-account-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['available-account-count'] });
    },
  });
};

// Function to claim a random account for an order
export const claimRandomAccount = async (productId: string, orderId: string): Promise<{ accountId: string; accountData: string } | null> => {
  try {
    const { data, error } = await supabase.rpc('claim_random_account', {
      p_product_id: productId,
      p_order_id: orderId,
    });
    
    if (error) {
      console.error('Error claiming account:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      return {
        accountId: data[0].account_id,
        accountData: data[0].account_data,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error claiming account:', error);
    return null;
  }
};
