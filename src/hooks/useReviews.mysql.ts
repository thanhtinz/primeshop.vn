// Hooks for Reviews - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  adminReply: string | null;
  adminReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
  userAvatarUrl?: string | null;
  userAvatarFrameId?: string | null;
  userNickname?: string | null;
  userIsVerified?: boolean | null;
  userIsAdmin?: boolean;
  vipLevelName?: string | null;
  hasPrimeBoost?: boolean | null;
  reviewImages?: { id: string; imageUrl: string; order: number }[];
  // Legacy mappings
  product_id?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string | null;
  is_verified_purchase?: boolean;
  is_approved?: boolean;
  admin_reply?: string | null;
  admin_reply_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user_avatar_url?: string | null;
  user_avatar_frame_id?: string | null;
  user_nickname?: string | null;
  user_is_verified?: boolean | null;
  user_is_admin?: boolean;
  vip_level_name?: string | null;
  has_prime_boost?: boolean | null;
  review_images?: { id: string; image_url: string; sort_order: number }[];
}

const mapToLegacy = (review: any): Review => ({
  ...review,
  product_id: review.productId,
  user_id: review.userId,
  user_email: review.userEmail || '',
  user_name: review.userName,
  is_verified_purchase: review.isVerifiedPurchase,
  is_approved: review.isApproved,
  admin_reply: review.adminReply,
  admin_reply_at: review.adminReplyAt,
  created_at: review.createdAt,
  updated_at: review.updatedAt,
  user_avatar_url: review.userAvatarUrl,
  user_avatar_frame_id: review.userAvatarFrameId,
  user_nickname: review.userNickname,
  user_is_verified: review.userIsVerified,
  user_is_admin: review.userIsAdmin,
  vip_level_name: review.vipLevelName,
  has_prime_boost: review.hasPrimeBoost,
  review_images: review.reviewImages?.map((img: any) => ({
    ...img,
    image_url: img.imageUrl,
    sort_order: img.order,
  })),
});

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('reviews')
        .select('*, reviewImages:review_images(id, imageUrl, order), user:users(displayName, avatarUrl)')
        .eq('productId', productId)
        .eq('isApproved', true)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...mapToLegacy(r),
        userAvatarUrl: r.user?.avatarUrl,
        user_avatar_url: r.user?.avatarUrl,
        userName: r.user?.displayName || r.userName,
        user_name: r.user?.displayName || r.userName,
      }));
    },
    enabled: !!productId,
  });
};

export const useUserReview = (productId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-review', productId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await db
        .from<any>('reviews')
        .select('*')
        .eq('productId', productId)
        .eq('userId', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapToLegacy(data) : null;
    },
    enabled: !!productId && !!userId,
  });
};

export const useAllReviews = () => {
  return useQuery({
    queryKey: ['all-reviews'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('reviews')
        .select('*, product:products(id, name, slug)')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      rating,
      comment,
      images = [],
    }: {
      productId: string;
      rating: number;
      comment?: string;
      images?: string[];
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('reviews')
        .insert({
          productId,
          userId: user.id,
          userEmail: user.email,
          userName: profile?.displayName || profile?.full_name || user.email?.split('@')[0],
          rating,
          comment,
          isVerifiedPurchase: false,
          isApproved: false, // Auto-approve or require admin review
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add review images if any
      if (images.length > 0 && data?.id) {
        await db.from('review_images').insert(
          images.map((url, index) => ({
            reviewId: data.id,
            imageUrl: url,
            order: index,
          }))
        );
      }

      return mapToLegacy(data);
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', productId] });
      toast.success('Đánh giá của bạn đã được gửi');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi đánh giá');
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Review> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.comment !== undefined) updateData.comment = updates.comment;
      if (updates.isApproved !== undefined || updates.is_approved !== undefined) {
        updateData.isApproved = updates.isApproved ?? updates.is_approved;
      }
      if (updates.adminReply !== undefined || updates.admin_reply !== undefined) {
        updateData.adminReply = updates.adminReply || updates.admin_reply;
        updateData.adminReplyAt = new Date().toISOString();
      }

      const { data, error } = await db
        .from<any>('reviews')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      toast.success('Đã xóa đánh giá');
    },
  });
};

// Get review statistics for a product
export const useReviewStats = (productId: string) => {
  return useQuery({
    queryKey: ['review-stats', productId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('reviews')
        .select('rating')
        .eq('productId', productId)
        .eq('isApproved', true);

      if (error) throw error;

      const reviews = data || [];
      const total = reviews.length;
      const avgRating = total > 0 
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total 
        : 0;
      
      const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
      reviews.forEach((r: any) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++;
        }
      });

      return {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution,
      };
    },
    enabled: !!productId,
  });
};
