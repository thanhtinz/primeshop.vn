import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface News {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string | null;
  content_en: string | null;
  image_url: string | null;
  author: string | null;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useNews = (limit?: number) => {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      let query = supabase
        .from('news')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as News[];
    },
  });
};

export const useFeaturedNews = () => {
  return useQuery({
    queryKey: ['featured-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data as News[];
    },
  });
};

export const useAllNews = () => {
  return useQuery({
    queryKey: ['all-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as News[];
    },
  });
};

export const useNewsDetail = (slug: string) => {
  return useQuery({
    queryKey: ['news', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as News;
    },
    enabled: !!slug,
  });
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (news: Omit<News, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'title_en' | 'excerpt_en' | 'content_en'> & { title_en?: string | null; excerpt_en?: string | null; content_en?: string | null }) => {
      const { data, error } = await supabase.from('news').insert([news]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};

export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<News> & { id: string }) => {
      const { data, error } = await supabase.from('news').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};

export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};
