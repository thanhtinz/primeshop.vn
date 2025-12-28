// Hooks for Shop Posts - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShopPost {
  id: string;
  userId: string;
  sellerId: string;
  content: string | null;
  images: string[];
  visibility: 'public' | 'friends' | 'private';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  seller?: any;
  isLiked?: boolean;
  // Legacy mappings
  user_id?: string;
  seller_id?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  created_at?: string;
  updated_at?: string;
  is_liked?: boolean;
}

const mapPostToLegacy = (p: any): ShopPost => ({
  ...p,
  user_id: p.userId,
  seller_id: p.sellerId,
  likes_count: p.likesCount,
  comments_count: p.commentsCount,
  shares_count: p.sharesCount,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  is_liked: p.isLiked,
});

// Get shop posts by seller ID
export const useShopPosts = (sellerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shop-posts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('user_posts')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Get seller info
      const { data: seller } = await db
        .from<any>('sellers')
        .select('id, shopName, shopSlug, shopAvatarUrl, isVerified, isPartner')
        .eq('id', sellerId)
        .single();

      const sellerData = seller ? {
        id: seller.id,
        shop_name: seller.shopName,
        shop_slug: seller.shopSlug,
        shop_avatar_url: seller.shopAvatarUrl,
        is_verified: seller.isVerified,
        is_partner: seller.isPartner,
      } : null;

      // Check liked posts
      let likedPostIds: string[] = [];
      if (user?.id && data?.length) {
        const postIds = data.map((p: any) => p.id);
        const { data: likes } = await db
          .from<any>('post_likes')
          .select('postId')
          .eq('userId', user.id)
          .in('postId', postIds);
        likedPostIds = likes?.map((l: any) => l.postId) || [];
      }

      return data?.map((p: any) => ({
        ...mapPostToLegacy(p),
        seller: sellerData,
        isLiked: likedPostIds.includes(p.id),
        is_liked: likedPostIds.includes(p.id),
      })) as ShopPost[];
    },
    enabled: !!sellerId
  });
};

// Get my seller's posts
export const useMyShopPosts = (sellerId?: string) => {
  return useQuery({
    queryKey: ['my-shop-posts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('user_posts')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapPostToLegacy) as ShopPost[];
    },
    enabled: !!sellerId
  });
};

// Create shop post
export const useCreateShopPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sellerId, content, images = [] }: {
      sellerId: string;
      content?: string;
      images?: string[];
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (!content?.trim() && images.length === 0) throw new Error('Vui lòng nhập nội dung hoặc thêm ảnh');

      const { data, error } = await db
        .from<any>('user_posts')
        .insert({
          userId: user.id,
          sellerId: sellerId,
          content: content?.trim() || null,
          images,
          visibility: 'public',
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapPostToLegacy(data);
    },
    onSuccess: (_, { sellerId }) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['my-shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      toast.success('Đã đăng bài viết cho shop');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể đăng bài viết');
    }
  });
};

// Update shop post
export const useUpdateShopPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, sellerId, content, images }: {
      postId: string;
      sellerId: string;
      content?: string;
      images?: string[];
    }) => {
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (content !== undefined) updateData.content = content.trim() || null;
      if (images !== undefined) updateData.images = images;

      const { data, error } = await db
        .from<any>('user_posts')
        .update(updateData)
        .eq('id', postId)
        .select('*')
        .single();

      if (error) throw error;
      return { ...mapPostToLegacy(data), sellerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts', result.sellerId] });
      queryClient.invalidateQueries({ queryKey: ['my-shop-posts', result.sellerId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      toast.success('Đã cập nhật bài viết');
    }
  });
};

// Delete shop post
export const useDeleteShopPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, sellerId }: { postId: string; sellerId: string }) => {
      const { error } = await db
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return sellerId;
    },
    onSuccess: (sellerId) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['my-shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      toast.success('Đã xoá bài viết');
    }
  });
};

// Like shop post
export const useLikeShopPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, sellerId }: { postId: string; sellerId: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await db
        .from('post_likes')
        .insert({
          postId,
          userId: user.id,
          reactionType: 'like'
        });

      if (error) throw error;

      // Update count
      const { data: likesData } = await db
        .from<any>('post_likes')
        .select('id')
        .eq('postId', postId);

      await db
        .from('user_posts')
        .update({ likesCount: likesData?.length || 0 })
        .eq('id', postId);

      return sellerId;
    },
    onSuccess: (sellerId) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
    }
  });
};

// Unlike shop post
export const useUnlikeShopPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, sellerId }: { postId: string; sellerId: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await db
        .from('post_likes')
        .delete()
        .eq('postId', postId)
        .eq('userId', user.id);

      if (error) throw error;

      // Update count
      const { data: likesData } = await db
        .from<any>('post_likes')
        .select('id')
        .eq('postId', postId);

      await db
        .from('user_posts')
        .update({ likesCount: likesData?.length || 0 })
        .eq('id', postId);

      return sellerId;
    },
    onSuccess: (sellerId) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
    }
  });
};
