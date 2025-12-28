// Hooks for Flash Sales - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  banner_url?: string | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FlashSaleItem {
  id: string;
  flashSaleId: string;
  productId: string;
  packageId: string | null;
  discountPercent: number;
  originalPrice: number;
  salePrice: number;
  quantityLimit: number | null;
  quantitySold: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    style: string;
  };
  package?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  // Legacy mappings
  flash_sale_id?: string;
  product_id?: string;
  package_id?: string | null;
  discount_percent?: number;
  original_price?: number;
  sale_price?: number;
  quantity_limit?: number | null;
  quantity_sold?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

const mapFlashSaleToLegacy = (fs: any): FlashSale => ({
  ...fs,
  banner_url: fs.bannerUrl,
  start_date: fs.startDate,
  end_date: fs.endDate,
  is_active: fs.isActive,
  created_at: fs.createdAt,
  updated_at: fs.updatedAt,
});

const mapFlashSaleItemToLegacy = (item: any): FlashSaleItem => ({
  ...item,
  flash_sale_id: item.flashSaleId,
  product_id: item.productId,
  package_id: item.packageId,
  discount_percent: item.discountPercent,
  original_price: item.originalPrice,
  sale_price: item.salePrice,
  quantity_limit: item.quantityLimit,
  quantity_sold: item.quantitySold,
  sort_order: item.order,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  product: item.product ? {
    ...item.product,
    image_url: item.product.imageUrl,
  } : undefined,
  package: item.package ? {
    ...item.package,
    image_url: item.package.imageUrl,
  } : undefined,
});

// Public hooks
export const useActiveFlashSale = () => {
  return useQuery({
    queryKey: ['active-flash-sale'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from<any>('flash_sales')
        .select('*')
        .eq('isActive', true)
        .lte('startDate', now)
        .gte('endDate', now)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapFlashSaleToLegacy(data) : null;
    },
  });
};

export const useFlashSaleItems = (flashSaleId: string | undefined) => {
  return useQuery({
    queryKey: ['flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      
      const { data, error } = await db
        .from<any>('flash_sale_items')
        .select('*, product:products(id, name, slug, imageUrl, style), package:product_packages(id, name, imageUrl)')
        .eq('flashSaleId', flashSaleId)
        .order('order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapFlashSaleItemToLegacy);
    },
    enabled: !!flashSaleId,
  });
};

// Admin hooks
export const useAllFlashSales = () => {
  return useQuery({
    queryKey: ['all-flash-sales'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('flash_sales')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapFlashSaleToLegacy);
    },
  });
};

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (flashSale: Partial<FlashSale>) => {
      const { data, error } = await db
        .from<any>('flash_sales')
        .insert({
          name: flashSale.name,
          description: flashSale.description,
          bannerUrl: flashSale.bannerUrl || flashSale.banner_url,
          startDate: flashSale.startDate || flashSale.start_date,
          endDate: flashSale.endDate || flashSale.end_date,
          isActive: flashSale.isActive ?? flashSale.is_active ?? true,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapFlashSaleToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
    },
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSale> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.bannerUrl !== undefined || updates.banner_url !== undefined) {
        updateData.bannerUrl = updates.bannerUrl || updates.banner_url;
      }
      if (updates.startDate !== undefined || updates.start_date !== undefined) {
        updateData.startDate = updates.startDate || updates.start_date;
      }
      if (updates.endDate !== undefined || updates.end_date !== undefined) {
        updateData.endDate = updates.endDate || updates.end_date;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }

      const { data, error } = await db
        .from<any>('flash_sales')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapFlashSaleToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
    },
  });
};

export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('flash_sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-flash-sale'] });
    },
  });
};

// Flash sale items CRUD
export const useCreateFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<FlashSaleItem>) => {
      const { data, error } = await db
        .from<any>('flash_sale_items')
        .insert({
          flashSaleId: item.flashSaleId || item.flash_sale_id,
          productId: item.productId || item.product_id,
          packageId: item.packageId || item.package_id,
          discountPercent: item.discountPercent ?? item.discount_percent ?? 0,
          originalPrice: item.originalPrice ?? item.original_price ?? 0,
          salePrice: item.salePrice ?? item.sale_price ?? 0,
          quantityLimit: item.quantityLimit ?? item.quantity_limit,
          quantitySold: 0,
          order: item.order ?? item.sort_order ?? 0,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapFlashSaleItemToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};

export const useUpdateFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSaleItem> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.discountPercent !== undefined || updates.discount_percent !== undefined) {
        updateData.discountPercent = updates.discountPercent ?? updates.discount_percent;
      }
      if (updates.originalPrice !== undefined || updates.original_price !== undefined) {
        updateData.originalPrice = updates.originalPrice ?? updates.original_price;
      }
      if (updates.salePrice !== undefined || updates.sale_price !== undefined) {
        updateData.salePrice = updates.salePrice ?? updates.sale_price;
      }
      if (updates.quantityLimit !== undefined || updates.quantity_limit !== undefined) {
        updateData.quantityLimit = updates.quantityLimit ?? updates.quantity_limit;
      }
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }

      const { data, error } = await db
        .from<any>('flash_sale_items')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapFlashSaleItemToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};

export const useDeleteFlashSaleItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('flash_sale_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items'] });
    },
  });
};
