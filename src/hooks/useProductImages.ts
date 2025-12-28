import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export const useProductImages = (productId: string | null) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });
};

export const useUploadProductImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      // Get current max sort_order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      const maxSortOrder = existingImages?.[0]?.sort_order ?? -1;
      const isPrimary = maxSortOrder === -1; // First image is primary
      
      // Save to database
      const { data, error } = await supabase
        .from('product_images')
        .insert([{
          product_id: productId,
          image_url: urlData.publicUrl,
          sort_order: maxSortOrder + 1,
          is_primary: isPrimary,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId, imageUrl }: { id: string; productId: string; imageUrl: string }) => {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      // Try to delete from storage (extract path from URL)
      try {
        const urlParts = imageUrl.split('/product-images/');
        if (urlParts[1]) {
          await supabase.storage
            .from('product-images')
            .remove([urlParts[1]]);
        }
      } catch (e) {
        console.warn('Failed to delete from storage:', e);
      }
      
      return { id, productId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', result.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useSetPrimaryImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      // First, set all images to non-primary
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      // Then set the selected one as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', id);
      
      if (error) throw error;
      return { id, productId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', result.productId] });
    },
  });
};

export const useReorderProductImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, imageIds }: { productId: string; imageIds: string[] }) => {
      const updates = imageIds.map((id, index) => 
        supabase
          .from('product_images')
          .update({ sort_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    },
  });
};
