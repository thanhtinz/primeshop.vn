// MySQL version - useSellerFlashSale
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface SellerFlashSale {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  items?: SellerFlashSaleItem[];
}

export interface SellerFlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  discount_percent: number | null;
  quantity_limit: number | null;
  quantity_sold: number;
  product?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

// Legacy snake_case mapping
function mapSellerFlashSale(data: any): SellerFlashSale {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    name: data.name,
    description: data.description,
    discount_percent: data.discountPercent || data.discount_percent || 0,
    start_time: data.startTime || data.start_time,
    end_time: data.endTime || data.end_time,
    is_active: data.isActive ?? data.is_active ?? true,
    created_at: data.createdAt || data.created_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      flash_sale_id: item.flashSaleId || item.flash_sale_id,
      product_id: item.productId || item.product_id,
      discount_percent: item.discountPercent || item.discount_percent,
      quantity_limit: item.quantityLimit || item.quantity_limit,
      quantity_sold: item.quantitySold || item.quantity_sold || 0,
      product: item.product,
    })),
  };
}

export const useSellerFlashSales = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-flash-sales', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await apiClient.from('seller_flash_sales')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const flashSales = (data || []).map(mapSellerFlashSale);
      
      if (flashSales.length > 0) {
        const flashSaleIds = flashSales.map(f => f.id);
        const { data: items } = await apiClient.from('seller_flash_sale_items')
          .select('*')
          .in('flash_sale_id', flashSaleIds);

        const productIds = items?.map((i: any) => i.product_id || i.productId) || [];
        const { data: products } = await apiClient.from('seller_products')
          .select('id, title, price, images')
          .in('id', productIds);

        return flashSales.map(sale => ({
          ...sale,
          items: items?.filter((i: any) => (i.flash_sale_id || i.flashSaleId) === sale.id).map((item: any) => ({
            id: item.id,
            flash_sale_id: item.flashSaleId || item.flash_sale_id,
            product_id: item.productId || item.product_id,
            discount_percent: item.discountPercent || item.discount_percent,
            quantity_limit: item.quantityLimit || item.quantity_limit,
            quantity_sold: item.quantitySold || item.quantity_sold || 0,
            product: products?.find((p: any) => p.id === (item.productId || item.product_id)),
          })),
        }));
      }

      return flashSales;
    },
    enabled: !!sellerId,
  });
};

export const useActiveSellerFlashSales = (sellerId?: string) => {
  return useQuery({
    queryKey: ['active-seller-flash-sales', sellerId],
    queryFn: async () => {
      const now = new Date().toISOString();
      let query = apiClient.from('seller_flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now);

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query.order('end_time', { ascending: true });
      if (error) throw error;

      const flashSales = (data || []).map(mapSellerFlashSale);
      
      if (flashSales.length > 0) {
        const flashSaleIds = flashSales.map(f => f.id);
        const { data: items } = await apiClient.from('seller_flash_sale_items')
          .select('*')
          .in('flash_sale_id', flashSaleIds);

        const productIds = items?.map((i: any) => i.product_id || i.productId) || [];
        const { data: products } = await apiClient.from('seller_products')
          .select('id, title, price, images, status')
          .in('id', productIds);

        return flashSales.map(sale => ({
          ...sale,
          items: items?.filter((i: any) => (i.flash_sale_id || i.flashSaleId) === sale.id).map((item: any) => ({
            id: item.id,
            flash_sale_id: item.flashSaleId || item.flash_sale_id,
            product_id: item.productId || item.product_id,
            discount_percent: item.discountPercent || item.discount_percent,
            quantity_limit: item.quantityLimit || item.quantity_limit,
            quantity_sold: item.quantitySold || item.quantity_sold || 0,
            product: products?.find((p: any) => p.id === (item.productId || item.product_id)),
          })),
        }));
      }

      return flashSales;
    },
    enabled: sellerId === undefined || !!sellerId,
  });
};

// Hook to get ALL active flash sales across all sellers
export const useAllActiveSellerFlashSales = () => {
  return useQuery({
    queryKey: ['all-active-seller-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await apiClient.from('seller_flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('end_time', { ascending: true });

      if (error) throw error;

      const flashSales = (data || []).map(mapSellerFlashSale);
      
      // Create a map of product_id -> flash sale discount info
      const flashSaleMap = new Map<string, { discountPercent: number; originalPrice: number; salePrice: number }>();

      if (flashSales.length > 0) {
        const flashSaleIds = flashSales.map(f => f.id);
        const { data: items } = await apiClient.from('seller_flash_sale_items')
          .select('*')
          .in('flash_sale_id', flashSaleIds);

        const productIds = items?.map((i: any) => i.product_id || i.productId) || [];
        const { data: products } = await apiClient.from('seller_products')
          .select('id, price')
          .in('id', productIds);

        items?.forEach((item: any) => {
          const sale = flashSales.find(s => s.id === (item.flash_sale_id || item.flashSaleId));
          const product = products?.find((p: any) => p.id === (item.product_id || item.productId));
          if (sale && product) {
            const discount = item.discount_percent || item.discountPercent || sale.discount_percent;
            const originalPrice = product.price || 0;
            const salePrice = originalPrice * (1 - discount / 100);
            flashSaleMap.set(item.product_id || item.productId, {
              discountPercent: discount,
              originalPrice,
              salePrice
            });
          }
        });
      }
      
      return { sales: flashSales, flashSaleMap };
    },
  });
};

export const useCreateSellerFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      seller_id: string;
      name: string;
      description?: string;
      discount_percent: number;
      start_time: string;
      end_time: string;
      product_ids: string[];
    }) => {
      const { product_ids, ...flashSaleData } = data;

      const { data: flashSale, error } = await apiClient.from('seller_flash_sales')
        .insert(flashSaleData)
        .select()
        .single();

      if (error) throw error;

      // Add items
      if (product_ids.length > 0) {
        const items = product_ids.map(product_id => ({
          flash_sale_id: flashSale.id,
          product_id,
          discount_percent: data.discount_percent,
        }));

        await apiClient.from('seller_flash_sale_items').insert(items);
      }

      return mapSellerFlashSale(flashSale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] });
      toast.success('Đã tạo Flash Sale');
    },
    onError: () => {
      toast.error('Không thể tạo Flash Sale');
    },
  });
};

export const useUpdateSellerFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SellerFlashSale> }) => {
      const { error } = await apiClient.from('seller_flash_sales')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] });
      toast.success('Đã cập nhật Flash Sale');
    },
    onError: () => {
      toast.error('Không thể cập nhật Flash Sale');
    },
  });
};

export const useDeleteSellerFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('seller_flash_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] });
      toast.success('Đã xóa Flash Sale');
    },
    onError: () => {
      toast.error('Không thể xóa Flash Sale');
    },
  });
};

export const useToggleFlashSaleActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await apiClient.from('seller_flash_sales')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-seller-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-active-seller-flash-sales'] });
    },
  });
};
