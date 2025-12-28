import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductView {
  id: string;
  product_id: string;
  user_id: string | null;
  session_id: string | null;
  viewed_at: string;
  duration_seconds: number | null;
  source: string | null;
  device_type: string | null;
}

export interface ProductClick {
  id: string;
  product_id: string;
  user_id: string | null;
  click_type: string;
  clicked_at: string;
}

export interface SellerAnalytics {
  id: string;
  seller_id: string;
  stat_date: string;
  total_views: number;
  unique_viewers: number;
  total_clicks: number;
  wishlist_adds: number;
  wishlist_removes: number;
  chat_initiations: number;
  view_to_buy_rate: number;
  avg_view_duration: number;
  top_viewed_products: string[];
  top_clicked_price_ranges: any[];
}

export interface SellerSuggestion {
  id: string;
  seller_id: string;
  product_id: string | null;
  suggestion_type: string;
  original_value: string | null;
  suggested_value: string | null;
  reason: string | null;
  confidence_score: number | null;
  is_applied: boolean;
  applied_at: string | null;
  created_at: string;
  product?: {
    title: string;
    images: string[];
  };
}

// Track product view
export const useTrackProductView = () => {
  return useMutation({
    mutationFn: async ({ 
      productId, 
      source, 
      deviceType 
    }: { 
      productId: string; 
      source?: string; 
      deviceType?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);

      const { error } = await supabase
        .from('product_views')
        .insert({
          product_id: productId,
          user_id: user?.id || null,
          session_id: sessionId,
          source: source || 'direct',
          device_type: deviceType || (window.innerWidth < 768 ? 'mobile' : 'desktop')
        });

      if (error) throw error;
    }
  });
};

// Track product click
export const useTrackProductClick = () => {
  return useMutation({
    mutationFn: async ({ 
      productId, 
      clickType 
    }: { 
      productId: string; 
      clickType: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('product_clicks')
        .insert({
          product_id: productId,
          user_id: user?.id || null,
          click_type: clickType
        });

      if (error) throw error;
    }
  });
};

// Get seller analytics
export const useSellerAnalytics = (sellerId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['seller-analytics', sellerId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('seller_analytics')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: false });

      if (error) throw error;
      return data as SellerAnalytics[];
    },
    enabled: !!sellerId
  });
};

// Get product views stats
export const useProductViewsStats = (sellerId: string) => {
  return useQuery({
    queryKey: ['product-views-stats', sellerId],
    queryFn: async () => {
      // Get products for this seller first
      const { data: products, error: productsError } = await supabase
        .from('seller_products')
        .select('id, title, price, images')
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      const productIds = products?.map(p => p.id) || [];
      if (productIds.length === 0) return { products: [], totalViews: 0, viewsByProduct: [] };

      // Get views for these products in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: views, error: viewsError } = await supabase
        .from('product_views')
        .select('product_id, user_id')
        .in('product_id', productIds)
        .gte('viewed_at', thirtyDaysAgo.toISOString());

      if (viewsError) throw viewsError;

      // Aggregate by product
      const viewsByProduct = products?.map(product => {
        const productViews = views?.filter(v => v.product_id === product.id) || [];
        const uniqueViewers = new Set(productViews.filter(v => v.user_id).map(v => v.user_id)).size;
        return {
          ...product,
          totalViews: productViews.length,
          uniqueViewers
        };
      }).sort((a, b) => b.totalViews - a.totalViews) || [];

      return {
        products: viewsByProduct,
        totalViews: views?.length || 0,
        viewsByProduct
      };
    },
    enabled: !!sellerId
  });
};

// Get products viewed but not bought
export const useViewedNotBought = (sellerId: string) => {
  return useQuery({
    queryKey: ['viewed-not-bought', sellerId],
    queryFn: async () => {
      // Get available products with high views but no recent sales
      const { data: products, error } = await supabase
        .from('seller_products')
        .select(`
          id, title, price, images, status, created_at,
          product_views:product_views(count)
        `)
        .eq('seller_id', sellerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter products with views but still available
      const viewedProducts = products?.filter(p => {
        const viewCount = (p.product_views as any)?.[0]?.count || 0;
        return viewCount > 5; // At least 5 views
      }).map(p => ({
        ...p,
        viewCount: (p.product_views as any)?.[0]?.count || 0
      })).sort((a, b) => b.viewCount - a.viewCount) || [];

      return viewedProducts;
    },
    enabled: !!sellerId
  });
};

// Get seller suggestions
export const useSellerSuggestions = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-suggestions', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_suggestions')
        .select(`
          *,
          product:seller_products(title, images)
        `)
        .eq('seller_id', sellerId)
        .eq('is_applied', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SellerSuggestion[];
    },
    enabled: !!sellerId
  });
};

// Apply suggestion
export const useApplySuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('seller_suggestions')
        .update({ 
          is_applied: true, 
          applied_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-suggestions'] });
    }
  });
};

// Get wishlist stats
export const useWishlistStats = (sellerId: string) => {
  return useQuery({
    queryKey: ['wishlist-stats', sellerId],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from('seller_products')
        .select('id, title, price, images')
        .eq('seller_id', sellerId)
        .eq('status', 'available');

      if (productsError) throw productsError;

      const productIds = products?.map(p => p.id) || [];
      if (productIds.length === 0) return [];

      // Get wishlist counts - we need to count from wishlist table
      // For now return products with mock wishlist data
      return products?.map(p => ({
        ...p,
        wishlistCount: Math.floor(Math.random() * 10) // TODO: Implement actual wishlist tracking
      })).sort((a, b) => b.wishlistCount - a.wishlistCount) || [];
    },
    enabled: !!sellerId
  });
};
