import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShopPost {
  id: string;
  user_id: string;
  seller_id: string;
  content: string | null;
  images: string[];
  visibility: 'public' | 'friends' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url: string | null;
    is_verified: boolean;
  };
  is_liked?: boolean;
}

const POSTS_PER_PAGE = 10;

// Get shop posts by seller ID
export const useShopPosts = (sellerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shop-posts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get seller info
      const { data: seller } = await supabase
        .from('sellers')
        .select('id, shop_name, shop_slug, shop_avatar_url, is_verified, is_partner')
        .eq('id', sellerId)
        .single();

      // Check if current user liked posts
      let likedPostIds: string[] = [];
      if (user?.id && data?.length) {
        const postIds = data.map(p => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        likedPostIds = likes?.map(l => l.post_id) || [];
      }

      return data?.map(p => ({
        ...p,
        seller,
        is_liked: likedPostIds.includes(p.id)
      })) as ShopPost[];
    },
    enabled: !!sellerId
  });
};

// Get my seller's posts (for seller dashboard)
export const useMyShopPosts = (sellerId?: string) => {
  return useQuery({
    queryKey: ['my-shop-posts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopPost[];
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

      const { data, error } = await supabase
        .from('user_posts')
        .insert({
          user_id: user.id,
          seller_id: sellerId,
          content: content?.trim() || null,
          images,
          visibility: 'public'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const updateData: any = { updated_at: new Date().toISOString() };
      if (content !== undefined) updateData.content = content.trim() || null;
      if (images !== undefined) updateData.images = images;

      const { data, error } = await supabase
        .from('user_posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return { data, sellerId };
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
      const { error } = await supabase
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

// Get shop posts comments (for seller to manage)
export const useShopPostsComments = (sellerId?: string) => {
  return useQuery({
    queryKey: ['shop-posts-comments', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      // Get all posts by seller
      const { data: posts } = await supabase
        .from('user_posts')
        .select('id, content')
        .eq('seller_id', sellerId);

      if (!posts?.length) return [];

      const postIds = posts.map(p => p.id);

      // Get all comments on these posts
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const postMap = new Map(posts.map(p => [p.id, p]));

      return comments?.map(c => ({
        ...c,
        user_profile: profileMap.get(c.user_id),
        post: postMap.get(c.post_id)
      })) || [];
    },
    enabled: !!sellerId
  });
};

// Reply to comment as shop
export const useShopReplyComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentId, sellerId }: {
      postId: string;
      content: string;
      parentId: string;
      sellerId: string;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: `[SHOP] ${content}`,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) throw error;
      return { data, sellerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts-comments', result.sellerId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
      toast.success('Đã trả lời bình luận');
    }
  });
};

// Delete comment on shop post
export const useDeleteShopComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, sellerId }: { commentId: string; sellerId: string }) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return sellerId;
    },
    onSuccess: (sellerId) => {
      queryClient.invalidateQueries({ queryKey: ['shop-posts-comments', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
      toast.success('Đã xoá bình luận');
    }
  });
};
