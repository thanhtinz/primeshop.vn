// Hooks for News - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface News {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  excerpt: string | null;
  excerptEn: string | null;
  content: string | null;
  contentEn: string | null;
  imageUrl: string | null;
  author: string | null;
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  view_count?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (n: any): News => ({
  ...n,
  title_en: n.titleEn,
  excerpt_en: n.excerptEn,
  content_en: n.contentEn,
  image_url: n.imageUrl,
  is_featured: n.isFeatured,
  is_active: n.isActive,
  view_count: n.viewCount,
  sort_order: n.sortOrder,
  created_at: n.createdAt,
  updated_at: n.updatedAt,
});

export const useNews = (limit?: number) => {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      let query = db
        .from<any>('news')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true })
        .order('createdAt', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapToLegacy) as News[];
    },
  });
};

export const useFeaturedNews = () => {
  return useQuery({
    queryKey: ['featured-news'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('news')
        .select('*')
        .eq('isActive', true)
        .eq('isFeatured', true)
        .order('sortOrder', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map(mapToLegacy) as News[];
    },
  });
};

export const useAllNews = () => {
  return useQuery({
    queryKey: ['all-news'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('news')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapToLegacy) as News[];
    },
  });
};

export const useNewsDetail = (slug: string) => {
  return useQuery({
    queryKey: ['news', slug],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('news')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return mapToLegacy(data);
    },
    enabled: !!slug,
  });
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (news: {
      title: string;
      slug: string;
      excerpt?: string;
      content?: string;
      imageUrl?: string;
      author?: string;
      isFeatured?: boolean;
      isActive?: boolean;
      sortOrder?: number;
      titleEn?: string;
      excerptEn?: string;
      contentEn?: string;
    }) => {
      const { data, error } = await db
        .from<any>('news')
        .insert({
          title: news.title,
          titleEn: news.titleEn || null,
          slug: news.slug,
          excerpt: news.excerpt || null,
          excerptEn: news.excerptEn || null,
          content: news.content || null,
          contentEn: news.contentEn || null,
          imageUrl: news.imageUrl || null,
          author: news.author || null,
          isFeatured: news.isFeatured || false,
          isActive: news.isActive ?? true,
          sortOrder: news.sortOrder || 0,
          viewCount: 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};

export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<News> & { id: string }) => {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.titleEn !== undefined || updates.title_en !== undefined) {
        updateData.titleEn = updates.titleEn ?? updates.title_en;
      }
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
      if (updates.excerptEn !== undefined || updates.excerpt_en !== undefined) {
        updateData.excerptEn = updates.excerptEn ?? updates.excerpt_en;
      }
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.contentEn !== undefined || updates.content_en !== undefined) {
        updateData.contentEn = updates.contentEn ?? updates.content_en;
      }
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl ?? updates.image_url;
      }
      if (updates.author !== undefined) updateData.author = updates.author;
      if (updates.isFeatured !== undefined || updates.is_featured !== undefined) {
        updateData.isFeatured = updates.isFeatured ?? updates.is_featured;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.sortOrder !== undefined || updates.sort_order !== undefined) {
        updateData.sortOrder = updates.sortOrder ?? updates.sort_order;
      }

      const { data, error } = await db
        .from<any>('news')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};

export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('news').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });
};
