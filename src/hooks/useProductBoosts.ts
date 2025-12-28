import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductBoost {
  id: string;
  product_id: string;
  seller_id: string;
  boost_type: 'marketplace_top' | 'category_top' | 'recommended' | 'shop_featured';
  cost_per_day: number;
  total_cost: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  created_at: string;
  product?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    seller_id: string;
    status: string;
  };
}

export interface BoostPricing {
  id: string;
  boost_type: string;
  price_per_day: number;
  is_active: boolean;
}

export const useBoostPricing = () => {
  return useQuery({
    queryKey: ['boost-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boost_pricing')
        .select('*')
        .eq('is_active', true)
        .order('price_per_day', { ascending: true });

      if (error) throw error;
      return data as BoostPricing[];
    },
  });
};

export const useMyProductBoosts = () => {
  return useQuery({
    queryKey: ['my-product-boosts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('product_boosts')
        .select(`
          *,
          product:seller_products(id, title, images, price, seller_id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductBoost[];
    },
  });
};

export const useActiveBoosts = (boostType?: string) => {
  return useQuery({
    queryKey: ['active-boosts', boostType],
    queryFn: async () => {
      let query = supabase
        .from('product_boosts')
        .select(`
          *,
          product:seller_products(id, title, images, price, seller_id, status)
        `)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString());

      if (boostType) {
        query = query.eq('boost_type', boostType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductBoost[];
    },
  });
};

export const useCreateBoost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, boostType, days }: { productId: string; boostType: string; days: number }) => {
      const { data, error } = await supabase.rpc('create_product_boost', {
        p_product_id: productId,
        p_boost_type: boostType,
        p_days: days,
      });

      if (error) throw error;
      
      const result = data as unknown as { success: boolean; message: string; boost_id: string }[];
      if (!result[0]?.success) {
        throw new Error(result[0]?.message || 'Lỗi không xác định');
      }

      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-product-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['active-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      toast.success('Ghim sản phẩm thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCancelBoost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boostId: string) => {
      const { error } = await supabase
        .from('product_boosts')
        .update({ status: 'cancelled' })
        .eq('id', boostId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-product-boosts'] });
      queryClient.invalidateQueries({ queryKey: ['active-boosts'] });
      toast.success('Đã hủy ghim sản phẩm');
    },
    onError: () => {
      toast.error('Không thể hủy ghim');
    },
  });
};
