import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryGroup {
  id: string;
  seller_id: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  created_at: string;
  productCount?: number;
}

export interface ProductInventoryData {
  id: string;
  product_id: string;
  group_id: string | null;
  cost_price: number;
  source: string | null;
  internal_notes: string | null;
  is_outdated: boolean;
  outdated_reason: string | null;
  last_price_update: string | null;
  created_at: string;
  updated_at: string;
  group?: InventoryGroup;
}

export interface InventoryAlert {
  id: string;
  seller_id: string;
  product_id: string | null;
  alert_type: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  product?: {
    title: string;
    images: string[];
    price: number;
  };
}

// Get inventory groups
export const useInventoryGroups = (sellerId: string) => {
  return useQuery({
    queryKey: ['inventory-groups', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_groups')
        .select('*')
        .eq('seller_id', sellerId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Get product counts for each group
      const groupIds = data?.map(g => g.id) || [];
      if (groupIds.length > 0) {
        const { data: inventoryData } = await supabase
          .from('product_inventory_data')
          .select('group_id')
          .in('group_id', groupIds);

        const countMap = new Map<string, number>();
        inventoryData?.forEach(d => {
          if (d.group_id) {
            countMap.set(d.group_id, (countMap.get(d.group_id) || 0) + 1);
          }
        });

        return data?.map(g => ({
          ...g,
          productCount: countMap.get(g.id) || 0
        })) as InventoryGroup[];
      }

      return data as InventoryGroup[];
    },
    enabled: !!sellerId
  });
};

// Create inventory group
export const useCreateInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (group: Omit<InventoryGroup, 'id' | 'created_at' | 'productCount'>) => {
      const { data, error } = await supabase
        .from('inventory_groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Đã tạo nhóm mới');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Update inventory group
export const useUpdateInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Đã cập nhật nhóm');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Delete inventory group
export const useDeleteInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('inventory_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Đã xóa nhóm');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Get product inventory data
export const useProductInventoryData = (productId: string) => {
  return useQuery({
    queryKey: ['product-inventory-data', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_inventory_data')
        .select(`
          *,
          group:inventory_groups(*)
        `)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProductInventoryData | null;
    },
    enabled: !!productId
  });
};

// Update or create product inventory data
export const useUpsertProductInventoryData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductInventoryData, 'id' | 'created_at' | 'updated_at' | 'group'>) => {
      const { data: result, error } = await supabase
        .from('product_inventory_data')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'product_id' 
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-inventory-data', variables.product_id] });
      toast.success('Đã lưu thông tin kho');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Get inventory alerts
export const useInventoryAlerts = (sellerId: string) => {
  return useQuery({
    queryKey: ['inventory-alerts', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          product:seller_products(title, images, price)
        `)
        .eq('seller_id', sellerId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryAlert[];
    },
    enabled: !!sellerId
  });
};

// Mark alert as read
export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    }
  });
};

// Resolve alert
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ is_resolved: true, is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      toast.success('Đã giải quyết cảnh báo');
    }
  });
};

// Get products with inventory data for seller
export const useProductsWithInventory = (sellerId: string, groupId?: string) => {
  return useQuery({
    queryKey: ['products-with-inventory', sellerId, groupId],
    queryFn: async () => {
      let query = supabase
        .from('seller_products')
        .select(`
          id, title, price, images, status, created_at, sold_at,
          inventory_data:product_inventory_data(*)
        `)
        .eq('seller_id', sellerId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by group if specified
      let result = data || [];
      if (groupId) {
        result = result.filter(p => {
          const invData = (p.inventory_data as any)?.[0];
          return invData?.group_id === groupId;
        });
      }

      // Calculate profit for each
      return result.map(p => {
        const invData = (p.inventory_data as any)?.[0];
        const costPrice = invData?.cost_price || 0;
        const profit = p.price - costPrice;
        const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100) : 0;

        return {
          ...p,
          costPrice,
          profit,
          profitMargin,
          source: invData?.source || null,
          internalNotes: invData?.internal_notes || null,
          groupId: invData?.group_id || null,
          isOutdated: invData?.is_outdated || false
        };
      });
    },
    enabled: !!sellerId
  });
};

// Get long stock products (available for more than X days)
export const useLongStockProducts = (sellerId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['long-stock-products', sellerId, days],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('seller_products')
        .select('id, title, price, images, created_at')
        .eq('seller_id', sellerId)
        .eq('status', 'available')
        .lt('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(p => ({
        ...p,
        daysInStock: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })) || [];
    },
    enabled: !!sellerId
  });
};
