// MySQL version - useSellerInsights
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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

// Legacy snake_case mapping
function mapSellerAnalytics(data: any): SellerAnalytics {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    stat_date: data.statDate || data.stat_date,
    total_views: data.totalViews || data.total_views,
    unique_viewers: data.uniqueViewers || data.unique_viewers,
    total_clicks: data.totalClicks || data.total_clicks,
    wishlist_adds: data.wishlistAdds || data.wishlist_adds,
    wishlist_removes: data.wishlistRemoves || data.wishlist_removes,
    chat_initiations: data.chatInitiations || data.chat_initiations,
    view_to_buy_rate: data.viewToBuyRate || data.view_to_buy_rate,
    avg_view_duration: data.avgViewDuration || data.avg_view_duration,
    top_viewed_products: data.topViewedProducts || data.top_viewed_products || [],
    top_clicked_price_ranges: data.topClickedPriceRanges || data.top_clicked_price_ranges || [],
  };
}

function mapSellerSuggestion(data: any): SellerSuggestion {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    product_id: data.productId || data.product_id,
    suggestion_type: data.suggestionType || data.suggestion_type,
    original_value: data.originalValue || data.original_value,
    suggested_value: data.suggestedValue || data.suggested_value,
    reason: data.reason,
    confidence_score: data.confidenceScore || data.confidence_score,
    is_applied: data.isApplied || data.is_applied,
    applied_at: data.appliedAt || data.applied_at,
    created_at: data.createdAt || data.created_at,
    product: data.product,
  };
}

// Track product view
export const useTrackProductView = () => {
  const { user } = useAuth();

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
      const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);

      const { error } = await apiClient.from('product_views')
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      clickType 
    }: { 
      productId: string; 
      clickType: string;
    }) => {
      const { error } = await apiClient.from('product_clicks')
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

      const { data, error } = await apiClient.from('seller_analytics')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSellerAnalytics);
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
      const { data: products, error: productsError } = await apiClient.from('seller_products')
        .select('id, title, price, images')
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      const productIds = products?.map((p: any) => p.id) || [];
      if (productIds.length === 0) return { products: [], totalViews: 0, viewsByProduct: [] };

      // Get views for these products in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: views, error: viewsError } = await apiClient.from('product_views')
        .select('product_id, user_id')
        .in('product_id', productIds)
        .gte('viewed_at', thirtyDaysAgo.toISOString());

      if (viewsError) throw viewsError;

      // Aggregate by product
      const viewsByProduct = products?.map((product: any) => {
        const productViews = views?.filter((v: any) => (v.product_id || v.productId) === product.id) || [];
        const uniqueViewers = new Set(productViews.filter((v: any) => v.user_id || v.userId).map((v: any) => v.user_id || v.userId)).size;
        return {
          ...product,
          totalViews: productViews.length,
          uniqueViewers
        };
      }).sort((a: any, b: any) => b.totalViews - a.totalViews) || [];

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
      // Get available products
      const { data: products, error } = await apiClient.from('seller_products')
        .select('id, title, price, images, status, created_at')
        .eq('seller_id', sellerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!products || products.length === 0) return [];

      // Get view counts for these products
      const productIds = products.map((p: any) => p.id);
      const { data: views } = await apiClient.from('product_views')
        .select('product_id')
        .in('product_id', productIds);

      // Count views per product
      const viewCounts: Record<string, number> = {};
      views?.forEach((v: any) => {
        const pid = v.product_id || v.productId;
        viewCounts[pid] = (viewCounts[pid] || 0) + 1;
      });

      // Filter products with views but still available
      const viewedProducts = products
        .map((p: any) => ({
          ...p,
          viewCount: viewCounts[p.id] || 0
        }))
        .filter((p: any) => p.viewCount > 5)
        .sort((a: any, b: any) => b.viewCount - a.viewCount);

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
      const { data, error } = await apiClient.from('seller_suggestions')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_applied', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get product info separately
      const suggestions = (data || []).map(mapSellerSuggestion);
      const productIds = suggestions.filter(s => s.product_id).map(s => s.product_id);
      
      if (productIds.length > 0) {
        const { data: products } = await apiClient.from('seller_products')
          .select('id, title, images')
          .in('id', productIds);

        return suggestions.map(s => ({
          ...s,
          product: products?.find((p: any) => p.id === s.product_id)
        }));
      }

      return suggestions;
    },
    enabled: !!sellerId
  });
};

// Apply suggestion
export const useApplySuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await apiClient.from('seller_suggestions')
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
      const { data: products, error: productsError } = await apiClient.from('seller_products')
        .select('id, title, price, images')
        .eq('seller_id', sellerId)
        .eq('status', 'available');

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Get wishlist counts from wishlist_items
      const productIds = products.map((p: any) => p.id);
      const { data: wishlists } = await apiClient.from('wishlist_items')
        .select('product_id')
        .in('product_id', productIds);

      // Count by product
      const wishlistCounts: Record<string, number> = {};
      wishlists?.forEach((w: any) => {
        const pid = w.product_id || w.productId;
        wishlistCounts[pid] = (wishlistCounts[pid] || 0) + 1;
      });

      return products.map((p: any) => ({
        ...p,
        wishlistCount: wishlistCounts[p.id] || 0
      })).sort((a: any, b: any) => b.wishlistCount - a.wishlistCount);
    },
    enabled: !!sellerId
  });
};
