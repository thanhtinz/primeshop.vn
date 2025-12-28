// Hooks for Categories - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface DbCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  style: string;
  createdAt: string;
  updatedAt: string;
  // Legacy snake_case mappings
  name_en?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Helper to map response to legacy format
const mapToLegacy = (cat: any): DbCategory => ({
  ...cat,
  name_en: cat.nameEn,
  description_en: cat.descriptionEn,
  image_url: cat.imageUrl,
  is_active: cat.isActive,
  sort_order: cat.order,
  created_at: cat.createdAt,
  updated_at: cat.updatedAt,
});

export const useCategories = (activeOnly = true) => {
  return useQuery({
    queryKey: ['categories', activeOnly],
    queryFn: async () => {
      let query = db.from<DbCategory>('categories').select('*').order('order', { ascending: true });
      if (activeOnly) {
        query = query.eq('isActive', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<DbCategory>) => {
      const { data, error } = await db
        .from<DbCategory>('categories')
        .insert({
          name: category.name,
          nameEn: category.nameEn || category.name_en,
          slug: category.slug,
          description: category.description,
          descriptionEn: category.descriptionEn || category.description_en,
          imageUrl: category.imageUrl || category.image_url,
          icon: category.icon,
          isActive: category.isActive ?? category.is_active ?? true,
          order: category.order ?? category.sort_order ?? 0,
          style: category.style || 'default',
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbCategory> & { id: string }) => {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.nameEn !== undefined || updates.name_en !== undefined) {
        updateData.nameEn = updates.nameEn || updates.name_en;
      }
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.descriptionEn !== undefined || updates.description_en !== undefined) {
        updateData.descriptionEn = updates.descriptionEn || updates.description_en;
      }
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl || updates.image_url;
      }
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }
      if (updates.style !== undefined) updateData.style = updates.style;

      const { data, error } = await db
        .from<DbCategory>('categories')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
};
