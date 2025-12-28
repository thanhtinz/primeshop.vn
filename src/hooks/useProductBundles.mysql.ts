// Hooks for Product Bundles - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

export interface ProductBundle {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  discountPercent: number;
  discountAmount: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  createdAt: string;
  items?: BundleItem[];
  // Legacy mappings
  name_en?: string;
  description_en?: string;
  image_url?: string;
  discount_percent?: number;
  discount_amount?: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  sort_order?: number;
  created_at?: string;
}

export interface BundleItem {
  id: string;
  bundleId: string;
  productId: string;
  packageId?: string;
  quantity: number;
  sortOrder: number;
  product?: any;
  package?: any;
  // Legacy mappings
  bundle_id?: string;
  product_id?: string;
  package_id?: string;
  sort_order?: number;
}

const mapBundleToLegacy = (b: any): ProductBundle => ({
  ...b,
  name_en: b.nameEn,
  description_en: b.descriptionEn,
  image_url: b.imageUrl,
  discount_percent: b.discountPercent,
  discount_amount: b.discountAmount,
  is_active: b.isActive,
  start_date: b.startDate,
  end_date: b.endDate,
  sort_order: b.sortOrder,
  created_at: b.createdAt,
  items: b.items?.map((i: any) => ({
    ...i,
    bundle_id: i.bundleId,
    product_id: i.productId,
    package_id: i.packageId,
    sort_order: i.sortOrder,
  })),
});

export const useProductBundles = (activeOnly = true) => {
  return useQuery({
    queryKey: ['product-bundles', activeOnly],
    queryFn: async () => {
      let query = db
        .from<any>('product_bundles')
        .select('*, items:product_bundle_items(*, product:products(*), package:product_packages(*))')
        .order('sortOrder', { ascending: true });

      if (activeOnly) {
        query = query.eq('isActive', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapBundleToLegacy) as ProductBundle[];
    },
  });
};

export const useCreateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundle: any) => {
      const { data, error } = await db
        .from('product_bundles')
        .insert({
          name: bundle.name,
          nameEn: bundle.name_en,
          description: bundle.description,
          descriptionEn: bundle.description_en,
          imageUrl: bundle.image_url,
          discountPercent: bundle.discount_percent || 0,
          discountAmount: bundle.discount_amount || 0,
          isActive: bundle.is_active ?? true,
          startDate: bundle.start_date,
          endDate: bundle.end_date,
          sortOrder: bundle.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return mapBundleToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Tạo combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi tạo combo');
    },
  });
};

export const useUpdateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...bundle }: any) => {
      const updates: any = {};
      if (bundle.name) updates.name = bundle.name;
      if (bundle.name_en !== undefined) updates.nameEn = bundle.name_en;
      if (bundle.description !== undefined) updates.description = bundle.description;
      if (bundle.description_en !== undefined) updates.descriptionEn = bundle.description_en;
      if (bundle.image_url !== undefined) updates.imageUrl = bundle.image_url;
      if (bundle.discount_percent !== undefined) updates.discountPercent = bundle.discount_percent;
      if (bundle.discount_amount !== undefined) updates.discountAmount = bundle.discount_amount;
      if (bundle.is_active !== undefined) updates.isActive = bundle.is_active;
      if (bundle.start_date !== undefined) updates.startDate = bundle.start_date;
      if (bundle.end_date !== undefined) updates.endDate = bundle.end_date;
      if (bundle.sort_order !== undefined) updates.sortOrder = bundle.sort_order;

      const { data, error } = await db
        .from('product_bundles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapBundleToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Cập nhật combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật combo');
    },
  });
};

export const useDeleteBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('product_bundles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Xóa combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi xóa combo');
    },
  });
};

export const useAddBundleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { bundle_id: string; product_id: string; package_id?: string; quantity?: number; sort_order?: number }) => {
      const { data, error } = await db
        .from('product_bundle_items')
        .insert({
          bundleId: item.bundle_id,
          productId: item.product_id,
          packageId: item.package_id || null,
          quantity: item.quantity || 1,
          sortOrder: item.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        bundle_id: data.bundleId,
        product_id: data.productId,
        package_id: data.packageId,
        sort_order: data.sortOrder,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Thêm sản phẩm vào combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi thêm sản phẩm');
    },
  });
};

export const useRemoveBundleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await db.from('product_bundle_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Xóa sản phẩm khỏi combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi xóa sản phẩm');
    },
  });
};
