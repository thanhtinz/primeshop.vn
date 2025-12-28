import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FlashSalePrice {
  productId: string;
  packageId: string | null;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  flashSaleId: string;
  flashSaleItemId: string;
}

export const useFlashSalePrices = () => {
  return useQuery({
    queryKey: ['flash-sale-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          id,
          product_id,
          package_id,
          sale_price,
          original_price,
          discount_percent,
          flash_sale_id,
          flash_sales!inner(id, is_active, start_date, end_date)
        `)
        .eq('flash_sales.is_active', true)
        .lte('flash_sales.start_date', new Date().toISOString())
        .gte('flash_sales.end_date', new Date().toISOString());

      if (error) throw error;

      const priceMap = new Map<string, FlashSalePrice>();
      
      data?.forEach(item => {
        // Key by product_id and package_id combination
        const key = item.package_id 
          ? `${item.product_id}-${item.package_id}`
          : item.product_id;
        
        priceMap.set(key, {
          productId: item.product_id,
          packageId: item.package_id,
          salePrice: item.sale_price,
          originalPrice: item.original_price,
          discountPercent: item.discount_percent,
          flashSaleId: item.flash_sale_id,
          flashSaleItemId: item.id,
        });
      });

      return priceMap;
    },
    staleTime: 30000, // 30 seconds
  });
};

export const getFlashSalePrice = (
  priceMap: Map<string, FlashSalePrice> | undefined,
  productId: string,
  packageId: string | null
): FlashSalePrice | undefined => {
  if (!priceMap) return undefined;
  
  // First try exact match with package
  if (packageId) {
    const exactMatch = priceMap.get(`${productId}-${packageId}`);
    if (exactMatch) return exactMatch;
  }
  
  // Then try product-only match
  return priceMap.get(productId);
};
