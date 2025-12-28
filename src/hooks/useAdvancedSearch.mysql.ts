// Hooks for Advanced Search - MySQL version
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface SearchResult {
  id: string;
  type: 'product' | 'category' | 'seller' | 'news';
  title: string;
  description?: string;
  image?: string;
  price?: number;
  url: string;
  score?: number;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters?: SearchFilters;
  resultsCount?: number;
  createdAt: string;
  // Legacy mappings
  results_count?: number;
  created_at?: string;
}

const mapHistoryToLegacy = (h: any): SearchHistoryItem => ({
  ...h,
  results_count: h.resultsCount,
  created_at: h.createdAt,
});

export const useSearchHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await db
        .from<any>('search_history')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(mapHistoryToLegacy) as SearchHistoryItem[];
    },
    enabled: !!user,
  });
};

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('popular_searches')
        .select('*')
        .order('searchCount', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        search_count: p.searchCount,
        created_at: p.createdAt,
      }));
    },
  });
};

export const useSaveSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      query,
      filters,
      resultsCount,
    }: {
      query: string;
      filters?: SearchFilters;
      resultsCount?: number;
    }) => {
      // Save to user history if logged in
      if (user) {
        await db.from('search_history').insert({
          userId: user.id,
          query,
          filters: filters as any,
          resultsCount,
        });
      }

      // Update popular searches
      const { data: existing } = await db
        .from<any>('popular_searches')
        .select('id, searchCount')
        .eq('query', query.toLowerCase().trim())
        .single();

      if (existing) {
        await db
          .from('popular_searches')
          .update({ searchCount: (existing.searchCount || 0) + 1 })
          .eq('id', existing.id);
      } else {
        await db.from('popular_searches').insert({
          query: query.toLowerCase().trim(),
          searchCount: 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
      queryClient.invalidateQueries({ queryKey: ['popular-searches'] });
    },
  });
};

export const useClearSearchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await db.from('search_history').delete().eq('userId', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });
};

export const useDeleteSearchHistoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('search_history').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });
};

// Advanced search hook with state management
export const useAdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);

  const searchProducts = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}): Promise<SearchResult[]> => {
      setIsSearching(true);
      try {
        let query = db
          .from<any>('products')
          .select('id, name, slug, imageUrl, price, categoryId')
          .eq('isActive', true)
          .ilike('name', `%${searchQuery}%`);

        if (searchFilters.category) {
          query = query.eq('categoryId', searchFilters.category);
        }
        if (searchFilters.minPrice) {
          query = query.gte('price', searchFilters.minPrice);
        }
        if (searchFilters.maxPrice) {
          query = query.lte('price', searchFilters.maxPrice);
        }
        if (searchFilters.inStock) {
          query = query.gt('stock', 0);
        }

        // Apply sorting
        switch (searchFilters.sortBy) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'newest':
            query = query.order('createdAt', { ascending: false });
            break;
          case 'popular':
            query = query.order('soldCount', { ascending: false });
            break;
          default:
            query = query.order('createdAt', { ascending: false });
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;

        return (data || []).map((p: any) => ({
          id: p.id,
          type: 'product' as const,
          title: p.name,
          image: p.imageUrl,
          price: p.price,
          url: `/products/${p.slug}`,
        }));
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  return {
    query,
    setQuery,
    filters,
    setFilters,
    isSearching,
    searchProducts,
  };
};
