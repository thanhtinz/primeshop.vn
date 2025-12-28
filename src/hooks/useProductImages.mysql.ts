import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  
  // Legacy snake_case fields
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

const mapProductImage = (data: any): ProductImage => ({
  id: data.id,
  productId: data.productId || data.product_id,
  imageUrl: data.imageUrl || data.image_url,
  sortOrder: data.sortOrder ?? data.sort_order ?? 0,
  isPrimary: data.isPrimary ?? data.is_primary ?? false,
  createdAt: data.createdAt || data.created_at,
  
  // Legacy fields
  product_id: data.productId || data.product_id,
  image_url: data.imageUrl || data.image_url,
  sort_order: data.sortOrder ?? data.sort_order ?? 0,
  is_primary: data.isPrimary ?? data.is_primary ?? false,
  created_at: data.createdAt || data.created_at,
});

export const useProductImages = (productId: string | null) => {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const response = await apiClient.get(`/products/${productId}/images`);
      return (response.data || []).map(mapProductImage);
    },
    enabled: !!productId,
  });
};

export const useUploadProductImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId);
      
      const response = await apiClient.upload(`/products/${productId}/images`, formData);
      return mapProductImage(response.data);
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
    mutationFn: async ({ 
      id, 
      productId 
    }: { 
      id: string; 
      productId: string; 
      imageUrl?: string;
    }) => {
      await apiClient.delete(`/products/${productId}/images/${id}`);
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
      await apiClient.put(`/products/${productId}/images/${id}/set-primary`, {});
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
      await apiClient.put(`/products/${productId}/images/reorder`, { imageIds });
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
    },
  });
};

// Bulk upload multiple images
export const useBulkUploadProductImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, files }: { productId: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('productId', productId);
      files.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
      
      const response = await apiClient.upload(`/products/${productId}/images/bulk`, formData);
      return (response.data || []).map(mapProductImage);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
