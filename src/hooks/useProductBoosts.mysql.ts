// Hooks for Product Boosts - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc, auth } from '@/lib/api-client';
import { toast } from 'sonner';

export interface ProductBoost {
  id: string;
  productId: string;
  sellerId: string;
  boostType: 'marketplace_top' | 'category_top' | 'recommended' | 'shop_featured';
  costPerDay: number;
  totalCost: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  createdAt: string;
  product?: {
    id: string;
    title: string;
    images: string[];
    price: number;
    sellerId: string;
    status: string;
  };
  // Legacy mappings
  product_id?: string;
  seller_id?: string;
  boost_type?: string;
  cost_per_day?: number;
  total_cost?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface BoostPricing {
  id: string;
  boostType: string;
  pricePerDay: number;
  isActive: boolean;
  // Legacy mappings
  boost_type?: string;
  price_per_day?: number;
  is_active?: boolean;
}

const mapBoostToLegacy = (b: any): ProductBoost => ({
  ...b,
  product_id: b.productId,
  seller_id: b.sellerId,
  boost_type: b.boostType,
  cost_per_day: b.costPerDay,
  total_cost: b.totalCost,
  start_date: b.startDate,
  end_date: b.endDate,
  created_at: b.createdAt,
  product: b.product ? {
    ...b.product,
    seller_id: b.product.sellerId,
  } : undefined,
});

const mapPricingToLegacy = (p: any): BoostPricing => ({
  ...p,
  boost_type: p.boostType,
  price_per_day: p.pricePerDay,
  is_active: p.isActive,
});

export const useBoostPricing = () => {
  return useQuery({
    queryKey: ['boost-pricing'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('boost_pricing')
        .select('*')
        .eq('isActive', true)
        .order('pricePerDay', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapPricingToLegacy) as BoostPricing[];
    },
  });
};

export const useMyProductBoosts = () => {
  return useQuery({
    queryKey: ['my-product-boosts'],
    queryFn: async () => {
      const { data: sessionData } = await auth.getSession();
      if (!sessionData?.user) return [];

      const { data, error } = await db
        .from<any>('product_boosts')
        .select('*, product:seller_products(id, title, images, price, sellerId, status)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapBoostToLegacy) as ProductBoost[];
    },
  });
};

export const useActiveBoosts = (boostType?: string) => {
  return useQuery({
    queryKey: ['active-boosts', boostType],
    queryFn: async () => {
      let query = db
        .from<any>('product_boosts')
        .select('*, product:seller_products(id, title, images, price, sellerId, status)')
        .eq('status', 'active')
        .gte('endDate', new Date().toISOString());

      if (boostType) {
        query = query.eq('boostType', boostType);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapBoostToLegacy) as ProductBoost[];
    },
  });
};

export const useCreateBoost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, boostType, days }: { productId: string; boostType: string; days: number }) => {
      const result = await rpc('create_product_boost', {
        p_product_id: productId,
        p_boost_type: boostType,
        p_days: days,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Lỗi không xác định');
      }

      return result;
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
      const { error } = await db
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
