import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  package_id: string | null;
  discount_percent: number;
  original_price: number;
  sale_price: number;
  quantity_limit: number | null;
  quantity_sold: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    style: string;
  };
  package?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

// Public hooks
export const useActiveFlashSale = () => {
  return useQuery({
    queryKey: ['active-flash-sale'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as FlashSale | null;
    },
  });
};

export const useFlashSaleItems = (flashSaleId: string | undefined) => {
  return useQuery({
    queryKey: ['flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          product:products(id, name, slug, image_url, style),
          package:product_packages(id, name, image_url)
        `)
        .eq('flash_sale_id', flashSaleId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Fetch product primary images
      const productIds = data?.map(item => item.product_id) || [];
      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, image_url')
          .in('product_id', productIds)
          .eq('is_primary', true);
        
        const imageMap = new Map(images?.map(img => [img.product_id, img.image_url]));
        
        return data.map(item => ({
          ...item,
          product: {
            ...item.product,
            image_url: imageMap.get(item.product_id) || (item.product as any)?.image_url,
          }
        })) as FlashSaleItem[];
      }
      
      return data as FlashSaleItem[];
    },
    enabled: !!flashSaleId,
  });
};

// Admin hooks
export const useAllFlashSales = () => {
  return useQuery({
    queryKey: ['all-flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FlashSale[];
    },
  });
};

export const useFlashSaleById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['flash-sale', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as FlashSale;
    },
    enabled: !!id,
  });
};

export const useAdminFlashSaleItems = (flashSaleId: string | undefined) => {
  return useQuery({
    queryKey: ['admin-flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          product:products(id, name, slug, image_url, style),
          package:product_packages(id, name, image_url, price)
        `)
        .eq('flash_sale_id', flashSaleId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FlashSaleItem[];
    },
    enabled: !!flashSaleId,
  });
};

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sale: Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('flash_sales')
        .insert(sale)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
    },
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSale> & { id: string }) => {
      const { data, error } = await supabase
        .from('flash_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale'] });
      queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
    },
  });
};

export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
    },
  });
};

export const useAddFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<FlashSaleItem, 'id' | 'created_at' | 'updated_at' | 'product' | 'package'>) => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items', variables.flash_sale_id] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};

export const useUpdateFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSaleItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};

export const useDeleteFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flash_sale_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};