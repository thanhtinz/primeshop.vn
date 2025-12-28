import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HeroBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useHeroBanners = () => {
  return useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as HeroBanner[];
    },
  });
};

export const useAllHeroBanners = () => {
  return useQuery({
    queryKey: ['hero-banners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as HeroBanner[];
    },
  });
};

export const useCreateHeroBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banner: Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hero_banners')
        .insert([banner])
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('hero_banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', id);
      
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
