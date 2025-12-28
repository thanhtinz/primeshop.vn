// Hooks for Game Account Inventory - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';

export interface GameAccountInventory {
  id: string;
  productId: string;
  accountData: string;
  status: 'available' | 'sold' | 'hidden';
  soldAt: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  product_id?: string;
  account_data?: string;
  sold_at?: string | null;
  order_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (item: any): GameAccountInventory => ({
  ...item,
  product_id: item.productId,
  account_data: item.accountData,
  sold_at: item.soldAt,
  order_id: item.orderId,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
});

export const useGameAccountInventory = (productId?: string) => {
  return useQuery({
    queryKey: ['game-account-inventory', productId],
    queryFn: async () => {
      let query = db.from<any>('game_account_inventory').select('*');

      if (productId) {
        query = query.eq('productId', productId);
      }

      query = query.order('createdAt', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapToLegacy) as GameAccountInventory[];
    },
    enabled: !!productId || productId === undefined,
  });
};

export const useAvailableAccountCount = (productId: string) => {
  return useQuery({
    queryKey: ['available-account-count', productId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('game_account_inventory')
        .select('id')
        .eq('productId', productId)
        .eq('status', 'available');

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!productId,
  });
};

export const useAddGameAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, accountData }: { productId: string; accountData: string }) => {
      const { data, error } = await db
        .from('game_account_inventory')
        .insert({ productId, accountData })
        .select()
        .single();

      if (error) throw error;
      return mapToLegacy(data);
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
      const records = accounts.map(accountData => ({
        productId,
        accountData: accountData.trim(),
      }));

      const { data, error } = await db
        .from('game_account_inventory')
        .insert(records)
        .select();

      if (error) throw error;
      return (data || []).map(mapToLegacy);
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
      // Map legacy fields to camelCase
      const mappedUpdates: any = {};
      if (updates.productId || updates.product_id) mappedUpdates.productId = updates.productId || updates.product_id;
      if (updates.accountData || updates.account_data) mappedUpdates.accountData = updates.accountData || updates.account_data;
      if (updates.status) mappedUpdates.status = updates.status;

      const { data, error } = await db
        .from('game_account_inventory')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapToLegacy(data);
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
      const { error } = await db
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
    const result = await rpc('claim_random_account', {
      p_product_id: productId,
      p_order_id: orderId,
    });

    if (!result || !result.account_id) {
      return null;
    }

    return {
      accountId: result.account_id,
      accountData: result.account_data,
    };
  } catch (error) {
    console.error('Error claiming account:', error);
    return null;
  }
};
