// Hooks for Hero Banners - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

export interface HeroBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  image_url?: string;
  button_text?: string | null;
  button_link?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (banner: any): HeroBanner => ({
  ...banner,
  image_url: banner.imageUrl,
  button_text: banner.buttonText,
  button_link: banner.buttonLink,
  is_active: banner.isActive,
  sort_order: banner.order,
  created_at: banner.createdAt,
  updated_at: banner.updatedAt,
});

export const useHeroBanners = () => {
  return useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('hero_banners')
        .select('*')
        .eq('isActive', true)
        .order('order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
  });
};

export const useAllHeroBanners = () => {
  return useQuery({
    queryKey: ['hero-banners-admin'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('hero_banners')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
  });
};

export const useCreateHeroBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banner: Partial<HeroBanner>) => {
      const { data, error } = await db
        .from<any>('hero_banners')
        .insert({
          title: banner.title,
          subtitle: banner.subtitle,
          description: banner.description,
          imageUrl: banner.imageUrl || banner.image_url || '',
          buttonText: banner.buttonText || banner.button_text,
          buttonLink: banner.buttonLink || banner.button_link,
          isActive: banner.isActive ?? banner.is_active ?? true,
          order: banner.order ?? banner.sort_order ?? 0,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
      toast.success('Đã thêm banner');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateHeroBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HeroBanner> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl || updates.image_url;
      }
      if (updates.buttonText !== undefined || updates.button_text !== undefined) {
        updateData.buttonText = updates.buttonText || updates.button_text;
      }
      if (updates.buttonLink !== undefined || updates.button_link !== undefined) {
        updateData.buttonLink = updates.buttonLink || updates.button_link;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.order !== undefined || updates.sort_order !== undefined) {
        updateData.order = updates.order ?? updates.sort_order;
      }

      const { data, error } = await db
        .from<any>('hero_banners')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
      toast.success('Đã cập nhật banner');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteHeroBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('hero_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
      toast.success('Đã xóa banner');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useReorderHeroBanners = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update order for each banner
      for (let i = 0; i < orderedIds.length; i++) {
        await db
          .from('hero_banners')
          .update({ order: i })
          .eq('id', orderedIds[i]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
      toast.success('Đã cập nhật thứ tự');
    },
  });
};
