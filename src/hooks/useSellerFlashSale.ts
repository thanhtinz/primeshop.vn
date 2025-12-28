import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

export const useSellerFlashSales = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-flash-sales', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('seller_flash_sales')
        .select(`
          *,
          items:seller_flash_sale_items(
            *,
            product:seller_products(id, title, price, images)
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellerFlashSale[];
    },
    enabled: !!sellerId,
  });
};

export const useActiveSellerFlashSales = (sellerId?: string) => {
  return useQuery({
    queryKey: ['active-seller-flash-sales', sellerId],
    queryFn: async () => {
      let query = supabase
        .from('seller_flash_sales')
        .select(`
          *,
          items:seller_flash_sale_items(
            *,
            product:seller_products(id, title, price, images, status)
          )
        `)
        .eq('is_active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString());

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query.order('end_time', { ascending: true });

      if (error) throw error;
      return data as SellerFlashSale[];
    },
    enabled: sellerId === undefined || !!sellerId, // Always enabled unless explicitly disabled
  });
};

// Hook to get ALL active flash sales across all sellers - useful for global product listing
export const useAllActiveSellerFlashSales = () => {
  return useQuery({
    queryKey: ['all-active-seller-flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_flash_sales')
        .select(`
          *,
          items:seller_flash_sale_items(
            *,
            product:seller_products(id, title, price, images, status)
          )
        `)
        .eq('is_active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .order('end_time', { ascending: true });

      if (error) throw error;
      
      // Create a map of product_id -> flash sale discount info
      const flashSaleMap = new Map<string, { discountPercent: number; originalPrice: number; salePrice: number }>();
      
      (data as SellerFlashSale[]).forEach(sale => {
        sale.items?.forEach(item => {
          const discount = item.discount_percent || sale.discount_percent;
          const originalPrice = item.product?.price || 0;
          const salePrice = originalPrice * (1 - discount / 100);
          flashSaleMap.set(item.product_id, {
            discountPercent: discount,
            originalPrice,
            salePrice
          });
        });
      });
      
      return { sales: data as SellerFlashSale[], flashSaleMap };
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

      const { data: flashSale, error } = await supabase
        .from('seller_flash_sales')
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

        await supabase.from('seller_flash_sale_items').insert(items);
      }

      return flashSale;
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
      const { error } = await supabase
        .from('seller_flash_sales')
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
      const { error } = await supabase
        .from('seller_flash_sales')
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
