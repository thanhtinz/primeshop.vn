import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductBundle {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  image_url?: string;
  discount_percent: number;
  discount_amount: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  sort_order: number;
  created_at: string;
  items?: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  package_id?: string;
  quantity: number;
  sort_order: number;
  product?: any;
  package?: any;
}

export const useProductBundles = (activeOnly = true) => {
  return useQuery({
    queryKey: ['product-bundles', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('product_bundles')
        .select(`
          *,
          items:product_bundle_items(
            *,
            product:products(*),
            package:product_packages(*)
          )
        `)
        .order('sort_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductBundle[];
    }
  });
};

export const useCreateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundle: Omit<Partial<ProductBundle>, 'id' | 'created_at' | 'items'> & { name: string }) => {
      const { data, error } = await supabase
        .from('product_bundles')
        .insert({
          name: bundle.name,
          name_en: bundle.name_en,
          description: bundle.description,
          description_en: bundle.description_en,
          image_url: bundle.image_url,
          discount_percent: bundle.discount_percent || 0,
          discount_amount: bundle.discount_amount || 0,
          is_active: bundle.is_active ?? true,
          start_date: bundle.start_date,
          end_date: bundle.end_date,
          sort_order: bundle.sort_order || 0
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Tạo combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi tạo combo');
    }
  });
};

export const useUpdateBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...bundle }: Partial<ProductBundle> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_bundles')
        .update(bundle)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Cập nhật combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật combo');
    }
  });
};

export const useDeleteBundle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Xóa combo thành công');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi xóa combo');
    }
  });
};

export const useAddBundleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: { bundle_id: string; product_id: string; package_id?: string; quantity?: number; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('product_bundle_items')
        .insert({
          bundle_id: item.bundle_id,
          product_id: item.product_id,
          package_id: item.package_id || null,
          quantity: item.quantity || 1,
          sort_order: item.sort_order || 0
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
    }
  });
};

export const useRemoveBundleItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_bundle_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
    }
  });
};
