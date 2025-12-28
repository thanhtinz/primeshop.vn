import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface FlashSalePrice {
  productId: string;
  packageId: string | null;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  flashSaleId: string;
  flashSaleItemId: string;
  
  // Legacy snake_case fields
  product_id: string;
  package_id: string | null;
  sale_price: number;
  original_price: number;
  discount_percent: number;
  flash_sale_id: string;
  flash_sale_item_id: string;
}

export const useFlashSalePrices = () => {
  return useQuery({
    queryKey: ['flash-sale-prices'],
    queryFn: async () => {
      const response = await apiClient.get('/flash-sales/active-prices');
      const data = response.data || [];

      const priceMap = new Map<string, FlashSalePrice>();
      
      data.forEach((item: any) => {
        const productId = item.productId || item.product_id;
        const packageId = item.packageId || item.package_id;
        
        // Key by product_id and package_id combination
        const key = packageId 
          ? `${productId}-${packageId}`
          : productId;
        
        priceMap.set(key, {
          productId,
          packageId,
          salePrice: item.salePrice || item.sale_price,
          originalPrice: item.originalPrice || item.original_price,
          discountPercent: item.discountPercent || item.discount_percent,
          flashSaleId: item.flashSaleId || item.flash_sale_id,
          flashSaleItemId: item.flashSaleItemId || item.flash_sale_item_id || item.id,
          
          // Legacy fields
          product_id: productId,
          package_id: packageId,
          sale_price: item.salePrice || item.sale_price,
          original_price: item.originalPrice || item.original_price,
          discount_percent: item.discountPercent || item.discount_percent,
          flash_sale_id: item.flashSaleId || item.flash_sale_id,
          flash_sale_item_id: item.flashSaleItemId || item.flash_sale_item_id || item.id,
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
