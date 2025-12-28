import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  results_count?: number;
  created_at: string;
}

export const useSearchHistory = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['search-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SearchHistoryItem[];
    },
    enabled: !!user
  });
};

export const usePopularSearches = () => {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popular_searches')
        .select('*')
        .order('search_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });
};

export const useSaveSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      query, 
      filters, 
      resultsCount 
    }: { 
      query: string; 
      filters?: SearchFilters; 
      resultsCount?: number 
    }) => {
      // Save to user history if logged in
      if (user) {
        await supabase
          .from('search_history')
          .insert({
            user_id: user.id,
            query,
            filters: filters as any,
            results_count: resultsCount
          });
      }

      // Update popular searches
      const { data: existing } = await supabase
        .from('popular_searches')
        .select('id, search_count')
        .eq('query', query.toLowerCase())
        .single();

      if (existing) {
        await supabase
          .from('popular_searches')
          .update({ 
            search_count: existing.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('popular_searches')
          .insert({ query: query.toLowerCase() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
      queryClient.invalidateQueries({ queryKey: ['popular-searches'] });
    }
  });
};

export const useAdvancedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const saveSearch = useSaveSearch();

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      setResults([]);
      return [];
    }

    setIsSearching(true);
    const allResults: SearchResult[] = [];

    try {
      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, short_description, is_active, category_id')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,short_description.ilike.%${query}%`)
        .limit(20);
      
      if (products) {
        for (const p of products) {
          if (filters?.category && p.category_id !== filters.category) continue;
          allResults.push({
            id: p.id,
            type: 'product',
            title: p.name,
            description: p.short_description || undefined,
            url: `/product/${p.id}`
          });
        }
      }

      // Search categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, description, image_url, slug')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(5);

      if (categories) {
        categories.forEach(c => {
          allResults.push({
            id: c.id,
            type: 'category',
            title: c.name,
            description: c.description || undefined,
            image: c.image_url || undefined,
            url: `/category/${c.slug}`
          });
        });
      }

      // Search sellers
      const { data: sellers } = await supabase
        .from('sellers')
        .select('id, shop_name, shop_slug, shop_logo')
        .eq('status', 'approved')
        .ilike('shop_name', `%${query}%`)
        .limit(5);

      if (sellers) {
        sellers.forEach((s: any) => {
          allResults.push({
            id: s.id,
            type: 'seller',
            title: s.shop_name,
            image: s.shop_logo || undefined,
            url: `/shops/${s.shop_slug}`
          });
        });
      }

      // Search news
      const { data: news } = await supabase
        .from('news')
        .select('id, title, excerpt, image_url, slug')
        .eq('is_active', true)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (news) {
        news.forEach(n => {
          allResults.push({
            id: n.id,
            type: 'news',
            title: n.title,
            description: n.excerpt || undefined,
            image: n.image_url || undefined,
            url: `/news/${n.slug}`
          });
        });
      }

      // Sort by relevance (simple scoring)
      allResults.forEach(r => {
        const titleMatch = r.title.toLowerCase().includes(query.toLowerCase());
        r.score = titleMatch ? 10 : 5;
      });
      allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

      setResults(allResults);
      
      // Save search
      saveSearch.mutate({ query, filters, resultsCount: allResults.length });

      return allResults;
    } finally {
      setIsSearching(false);
    }
  }, [saveSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    search,
    results,
    isSearching,
    clearResults
  };
};

// AI-powered search suggestions
export const useAISearchSuggestions = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search-suggest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ query })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggestions, getSuggestions, isLoading };
};
