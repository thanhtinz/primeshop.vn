import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
  updated_at: string;
  user_avatar_url?: string | null;
  user_avatar_frame_id?: string | null;
  user_nickname?: string | null;
  user_is_verified?: boolean | null;
  user_is_admin?: boolean;
  vip_level_name?: string | null;
  has_prime_boost?: boolean | null;
}

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      // Select only non-sensitive fields (exclude user_email) and include review_images
      const { data, error } = await supabase
        .from('reviews')
        .select('id, product_id, user_id, user_name, rating, comment, is_verified_purchase, is_approved, admin_reply, admin_reply_at, created_at, updated_at, review_images(id, image_url, sort_order)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch avatars, frames, and VIP levels for all reviewers
      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url, avatar_frame_id, nickname, is_verified, vip_level_id, has_prime_boost, active_name_color_id, name_colors(color_value, gradient_value, is_gradient)')
          .in('user_id', userIds);

        // Check if users are admins
        const { data: adminUsers } = await supabase
          .from('admin_users')
          .select('user_id')
          .in('user_id', userIds);
        const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);
        
        // Fetch VIP level names
        const vipLevelIds = profiles?.map(p => p.vip_level_id).filter(Boolean) || [];
        let vipLevelMap = new Map<string, string>();
        
        if (vipLevelIds.length > 0) {
          const { data: vipLevels } = await supabase
            .from('vip_levels')
            .select('id, name')
            .in('id', vipLevelIds);
          
          vipLevelMap = new Map(vipLevels?.map(v => [v.id, v.name]));
        }
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, { 
          avatar_url: p.avatar_url, 
          avatar_frame_id: p.avatar_frame_id,
          nickname: p.nickname,
          is_verified: p.is_verified,
          is_admin: adminUserIds.has(p.user_id),
          vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
          has_prime_boost: p.has_prime_boost,
          name_color: (p as any).name_colors
        }]));
        
        return data.map(review => ({
          ...review,
          user_email: '', // Hidden for security
          user_avatar_url: profileMap.get(review.user_id)?.avatar_url || null,
          user_avatar_frame_id: profileMap.get(review.user_id)?.avatar_frame_id || null,
          user_nickname: profileMap.get(review.user_id)?.nickname || null,
          user_is_verified: profileMap.get(review.user_id)?.is_verified || false,
          user_is_admin: profileMap.get(review.user_id)?.is_admin || false,
          vip_level_name: profileMap.get(review.user_id)?.vip_level_name || null,
          has_prime_boost: profileMap.get(review.user_id)?.has_prime_boost || false,
          name_color: profileMap.get(review.user_id)?.name_color || null,
        })) as (Review & { review_images?: any[] })[];
      }
      
      return data.map(r => ({ ...r, user_email: '' })) as (Review & { review_images?: any[] })[];
    },
    enabled: !!productId,
  });
};

export const useUserReview = (productId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-review', productId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!productId && !!userId,
  });
};

export const useCheckVerifiedPurchase = (productId: string, email: string | undefined) => {
  return useQuery({
    queryKey: ['verified-purchase', productId, email],
    queryFn: async () => {
      if (!email) return false;
      
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', email)
        .eq('status', 'DELIVERED')
        .limit(1);
      
      if (error) return false;
      
      // Check if any of the orders contain this product
      if (data && data.length > 0) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('product_snapshot')
          .eq('customer_email', email)
          .in('status', ['DELIVERED', 'COMPLETED']);
        
        if (orderData) {
          return orderData.some(order => {
            const snapshot = order.product_snapshot as any;
            return snapshot?.product?.id === productId;
          });
        }
      }
      
      return false;
    },
    enabled: !!productId && !!email,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'is_approved' | 'admin_reply' | 'admin_reply_at' | 'user_avatar_url'>) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.product_id] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Review> & { id: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-review'] });
    },
  });
};

export const useProductRatingStats = (productId: string) => {
  return useQuery({
    queryKey: ['rating-stats', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_approved', true);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      }
      
      const total = data.reduce((sum, r) => sum + r.rating, 0);
      const average = total / data.length;
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.forEach(r => {
        distribution[r.rating as keyof typeof distribution]++;
      });
      
      return { average, count: data.length, distribution };
    },
    enabled: !!productId,
  });
};

// Admin hooks
export const useAllReviews = () => {
  return useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products:product_id (name, slug)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminReplyReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, admin_reply }: { id: string; admin_reply: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ 
          admin_reply, 
          admin_reply_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useToggleReviewApproval = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({ is_approved })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
