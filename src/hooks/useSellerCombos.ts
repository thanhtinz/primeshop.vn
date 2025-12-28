import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerCombo {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
  items?: SellerComboItem[];
}

export interface SellerComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
  };
}

export const useSellerCombos = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-combos', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('seller_product_combos')
        .select(`
          *,
          items:seller_combo_items(
            *,
            product:seller_products(id, title, price, images, status)
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellerCombo[];
    },
    enabled: !!sellerId,
  });
};

export const useActiveCombos = (sellerId?: string) => {
  return useQuery({
    queryKey: ['active-seller-combos', sellerId],
    queryFn: async () => {
      let query = supabase
        .from('seller_product_combos')
        .select(`
          *,
          items:seller_combo_items(
            *,
            product:seller_products(id, title, price, images, status)
          )
        `)
        .eq('is_active', true);

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellerCombo[];
    },
  });
};

// Hook to get product IDs that are part of active combos with their discount
export const useComboProductIds = (sellerId?: string) => {
  const { data: combos = [] } = useActiveCombos(sellerId);
  
  const comboProductMap = new Map<string, number>();
  
  combos.forEach(combo => {
    if (combo.is_active && combo.items && combo.items.length > 1) {
      combo.items.forEach(item => {
        if (item.product?.status === 'available') {
          // Store the highest discount if product is in multiple combos
          const existingDiscount = comboProductMap.get(item.product_id) || 0;
          if (combo.discount_percent > existingDiscount) {
            comboProductMap.set(item.product_id, combo.discount_percent);
          }
        }
      });
    }
  });
  
  return comboProductMap;
};

export const useCreateCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      seller_id: string;
      name: string;
      description?: string;
      discount_percent: number;
      product_ids: string[];
    }) => {
      const { product_ids, ...comboData } = data;

      const { data: combo, error } = await supabase
        .from('seller_product_combos')
        .insert(comboData)
        .select()
        .single();

      if (error) throw error;

      // Add items
      if (product_ids.length > 0) {
        const items = product_ids.map(product_id => ({
          combo_id: combo.id,
          product_id,
        }));

        await supabase.from('seller_combo_items').insert(items);
      }

      return combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-combos'] });
      toast.success('Đã tạo Combo');
    },
    onError: () => {
      toast.error('Không thể tạo Combo');
    },
  });
};

export const useUpdateCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, productIds }: { id: string; data: Partial<SellerCombo>; productIds?: string[] }) => {
      const { error } = await supabase
        .from('seller_product_combos')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Update items if provided
      if (productIds) {
        await supabase.from('seller_combo_items').delete().eq('combo_id', id);
        
        if (productIds.length > 0) {
          const items = productIds.map(product_id => ({
            combo_id: id,
            product_id,
          }));
          await supabase.from('seller_combo_items').insert(items);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-combos'] });
      toast.success('Đã cập nhật Combo');
    },
    onError: () => {
      toast.error('Không thể cập nhật Combo');
    },
  });
};

export const useDeleteCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seller_product_combos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-combos'] });
      toast.success('Đã xóa Combo');
    },
    onError: () => {
      toast.error('Không thể xóa Combo');
    },
  });
};
