// Hooks for Inventory Management - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

export interface InventoryGroup {
  id: string;
  sellerId: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  createdAt: string;
  productCount?: number;
  // Legacy mappings
  seller_id?: string;
  created_at?: string;
}

export interface ProductInventoryData {
  id: string;
  productId: string;
  groupId: string | null;
  costPrice: number;
  source: string | null;
  internalNotes: string | null;
  isOutdated: boolean;
  outdatedReason: string | null;
  lastPriceUpdate: string | null;
  createdAt: string;
  updatedAt: string;
  group?: InventoryGroup;
  // Legacy mappings
  product_id?: string;
  group_id?: string | null;
  cost_price?: number;
  internal_notes?: string | null;
  is_outdated?: boolean;
  outdated_reason?: string | null;
  last_price_update?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryAlert {
  id: string;
  sellerId: string;
  productId: string | null;
  alertType: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  product?: {
    title: string;
    images: string[];
    price: number;
  };
  // Legacy mappings
  seller_id?: string;
  product_id?: string | null;
  alert_type?: string;
  is_read?: boolean;
  is_resolved?: boolean;
  created_at?: string;
}

const mapGroupToLegacy = (g: any): InventoryGroup => ({
  ...g,
  seller_id: g.sellerId,
  created_at: g.createdAt,
});

const mapInventoryDataToLegacy = (d: any): ProductInventoryData => ({
  ...d,
  product_id: d.productId,
  group_id: d.groupId,
  cost_price: d.costPrice,
  internal_notes: d.internalNotes,
  is_outdated: d.isOutdated,
  outdated_reason: d.outdatedReason,
  last_price_update: d.lastPriceUpdate,
  created_at: d.createdAt,
  updated_at: d.updatedAt,
  group: d.group ? mapGroupToLegacy(d.group) : undefined,
});

const mapAlertToLegacy = (a: any): InventoryAlert => ({
  ...a,
  seller_id: a.sellerId,
  product_id: a.productId,
  alert_type: a.alertType,
  is_read: a.isRead,
  is_resolved: a.isResolved,
  created_at: a.createdAt,
});

// Get inventory groups
export const useInventoryGroups = (sellerId: string) => {
  return useQuery({
    queryKey: ['inventory-groups', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('inventory_groups')
        .select('*')
        .eq('sellerId', sellerId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Get product counts for each group
      const groupIds = data?.map((g: any) => g.id) || [];
      if (groupIds.length > 0) {
        const { data: inventoryData } = await db
          .from<any>('product_inventory_data')
          .select('groupId')
          .in('groupId', groupIds);

        const countMap = new Map<string, number>();
        inventoryData?.forEach((d: any) => {
          if (d.groupId) {
            countMap.set(d.groupId, (countMap.get(d.groupId) || 0) + 1);
          }
        });

        return data?.map((g: any) => ({
          ...mapGroupToLegacy(g),
          productCount: countMap.get(g.id) || 0,
        })) as InventoryGroup[];
      }

      return (data || []).map(mapGroupToLegacy) as InventoryGroup[];
    },
    enabled: !!sellerId,
  });
};

// Create inventory group
export const useCreateInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (group: any) => {
      const { data, error } = await db
        .from('inventory_groups')
        .insert({
          sellerId: group.seller_id,
          name: group.name,
          color: group.color,
          icon: group.icon,
          description: group.description,
        })
        .select()
        .single();

      if (error) throw error;
      return mapGroupToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Tạo nhóm thành công');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Update inventory group
export const useUpdateInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const mappedUpdates: any = {};
      if (updates.name) mappedUpdates.name = updates.name;
      if (updates.color) mappedUpdates.color = updates.color;
      if (updates.icon) mappedUpdates.icon = updates.icon;
      if (updates.description !== undefined) mappedUpdates.description = updates.description;

      const { data, error } = await db
        .from('inventory_groups')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapGroupToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Cập nhật nhóm thành công');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Delete inventory group
export const useDeleteInventoryGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('inventory_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-groups'] });
      toast.success('Xóa nhóm thành công');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Get product inventory data
export const useProductInventoryData = (sellerId: string) => {
  return useQuery({
    queryKey: ['product-inventory-data', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('product_inventory_data')
        .select('*, group:inventory_groups(*), product:seller_products(id, title, images, price, status)')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapInventoryDataToLegacy) as ProductInventoryData[];
    },
    enabled: !!sellerId,
  });
};

// Update product inventory data
export const useUpdateProductInventoryData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, ...updates }: any) => {
      const mappedUpdates: any = {};
      if (updates.group_id !== undefined) mappedUpdates.groupId = updates.group_id;
      if (updates.cost_price !== undefined) mappedUpdates.costPrice = updates.cost_price;
      if (updates.source !== undefined) mappedUpdates.source = updates.source;
      if (updates.internal_notes !== undefined) mappedUpdates.internalNotes = updates.internal_notes;
      if (updates.is_outdated !== undefined) mappedUpdates.isOutdated = updates.is_outdated;
      if (updates.outdated_reason !== undefined) mappedUpdates.outdatedReason = updates.outdated_reason;

      const { data, error } = await db
        .from('product_inventory_data')
        .update(mappedUpdates)
        .eq('productId', productId)
        .select()
        .single();

      if (error) throw error;
      return mapInventoryDataToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-inventory-data'] });
    },
  });
};

// Get inventory alerts
export const useInventoryAlerts = (sellerId: string) => {
  return useQuery({
    queryKey: ['inventory-alerts', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('inventory_alerts')
        .select('*, product:seller_products(title, images, price)')
        .eq('sellerId', sellerId)
        .eq('isResolved', false)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAlertToLegacy) as InventoryAlert[];
    },
    enabled: !!sellerId,
  });
};

// Mark alert as read
export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await db.from('inventory_alerts').update({ isRead: true }).eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
  });
};

// Resolve alert
export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await db.from('inventory_alerts').update({ isResolved: true }).eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      toast.success('Đã xử lý cảnh báo');
    },
  });
};
