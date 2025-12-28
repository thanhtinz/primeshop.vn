import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { notifyPostLiked, notifyPostCommented } from '@/services/notificationService';

export interface UserPost {
  id: string;
  user_id: string;
  content: string | null;
  images: string[];
  visibility: 'public' | 'friends' | 'private';
  background_color: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    user_id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    username?: string | null;
    nickname?: string | null;
    avatar_frame_id?: string | null;
    is_verified?: boolean | null;
    total_spent?: number;
    vip_level_name?: string | null;
    is_admin?: boolean;
  };
  is_liked?: boolean;
  user_reaction?: string | null;
  reaction_counts?: Record<string, number>;
  // Group post fields
  is_group_post?: boolean;
  group_id?: string;
  group?: {
    id: string;
    name: string;
    avatar_url: string | null;
    cover_url: string | null;
  } | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: any;
  is_liked?: boolean;
  replies?: PostComment[];
}

const POSTS_PER_PAGE = 10;

// Get newsfeed posts (from friends, public posts, shop posts, and joined group posts)
export const useNewsfeed = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['newsfeed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Get hidden posts and users for current user
      let hiddenPostIds = new Set<string>();
      let hiddenUserIds = new Set<string>();
      let friendIds = new Set<string>();
      
      if (user?.id) {
        const now = new Date().toISOString();
        
        const [hiddenPostsRes, hiddenUsersRes, friendshipsRes] = await Promise.all([
          supabase
            .from('hidden_posts')
            .select('post_id, post_type')
            .eq('user_id', user.id),
          supabase
            .from('hidden_users')
            .select('hidden_user_id')
            .eq('user_id', user.id)
            .or(`hidden_until.is.null,hidden_until.gt.${now}`),
          supabase
            .from('friendships')
            .select('requester_id, addressee_id')
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
            .eq('status', 'accepted')
        ]);
        
        hiddenPostIds = new Set(hiddenPostsRes.data?.map(h => `${h.post_type}:${h.post_id}`) || []);
        hiddenUserIds = new Set(hiddenUsersRes.data?.map(h => h.hidden_user_id) || []);
        
        // Build friend IDs set
        friendshipsRes.data?.forEach(f => {
          if (f.requester_id === user.id) {
            friendIds.add(f.addressee_id);
          } else {
            friendIds.add(f.requester_id);
          }
        });
      }

      // Fetch user_posts - filter by visibility
      let query = supabase
        .from('user_posts')
        .select('*, seller_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply visibility filter
      if (user?.id) {
        // Get posts where:
        // - visibility is public, OR
        // - user owns the post, OR
        // - visibility is friends and user is friend of post owner
        query = query.or(`visibility.eq.public,user_id.eq.${user.id}`);
      } else {
        // Non-logged in users can only see public posts
        query = query.eq('visibility', 'public');
      }

      const { data: userPostsData, error } = await query;

      if (error) throw error;

      // Further filter friends-only posts
      const filteredUserPosts = (userPostsData || []).filter(p => {
        if (p.visibility === 'public') return true;
        if (p.user_id === user?.id) return true;
        if (p.visibility === 'friends' && friendIds.has(p.user_id)) return true;
        if (p.visibility === 'private' && p.user_id === user?.id) return true;
        return false;
      });

      // Fetch group posts from joined groups
      let groupPostsData: any[] = [];
      if (user?.id) {
        // Get groups user has joined
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (memberships && memberships.length > 0) {
          const groupIds = memberships.map(m => m.group_id);
          
          const { data: gPosts } = await supabase
            .from('group_posts')
            .select('*')
            .in('group_id', groupIds)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .range(from, to);
          
          if (gPosts) {
            // Get group info
            const { data: groups } = await supabase
              .from('groups')
              .select('id, name, avatar_url, cover_url')
              .in('id', groupIds);
            const groupMap = new Map(groups?.map(g => [g.id, g]) || []);
            
            groupPostsData = gPosts.map(p => ({
              ...p,
              is_group_post: true,
              is_anonymous: p.is_anonymous,
              group: groupMap.get(p.group_id),
              group_id: p.group_id,
              user_id: p.author_id,
              images: p.media_urls || [],
              visibility: 'public',
              background_color: null,
              likes_count: p.like_count || 0,
              comments_count: p.comment_count || 0,
              shares_count: 0,
              is_pinned: p.is_pinned,
              pinned_at: null,
              user_profile: p.is_anonymous ? null : undefined, // Will be filled later if not anonymous
            }));
          }
        }
      }

      // Merge, filter hidden, and sort by created_at
      const allPosts = [...filteredUserPosts, ...groupPostsData]
        .filter(p => {
          // Filter out hidden posts
          const postType = p.is_group_post ? 'group_post' : (p.seller_id ? 'shop_post' : 'user_post');
          if (hiddenPostIds.has(`${postType}:${p.id}`)) return false;
          // Filter out posts from hidden users
          if (hiddenUserIds.has(p.user_id)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, POSTS_PER_PAGE);

      // Get user profiles for all posts (including non-anonymous group posts)
      const userIds = [...new Set(
        allPosts
          .filter(p => !p.seller_id && !(p.is_group_post && p.is_anonymous))
          .map(p => p.user_id) || []
      )];
      const { data: profiles } = userIds.length > 0 ? await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username, nickname, avatar_frame_id, is_verified, total_spent, has_prime_boost, active_name_color_id, active_effect_id, vip_level_id, vip_levels(name), name_colors(color_value, gradient_value, is_gradient), prime_effects(effect_type, effect_config)')
        .in('user_id', userIds) : { data: [] };

      // Get avatar frames for profiles that have avatar_frame_id
      const frameIds = [...new Set(profiles?.map(p => p.avatar_frame_id).filter(Boolean) || [])];
      const { data: avatarFrames } = frameIds.length > 0 ? await supabase
        .from('avatar_frames')
        .select('id, image_url, avatar_border_radius')
        .in('id', frameIds) : { data: [] };
      const frameMap = new Map<string, any>(avatarFrames?.map(f => [f.id, f] as [string, any]) || []);

      // Check if users are admins
      const { data: adminUsers } = userIds.length > 0 ? await supabase
        .from('admin_users')
        .select('user_id')
        .in('user_id', userIds) : { data: [] };
      const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);
      
      // Get seller info for shop posts
      const sellerIds = [...new Set(allPosts.filter(p => p.seller_id).map(p => p.seller_id) || [])];
      const { data: sellers } = sellerIds.length > 0 ? await supabase
        .from('sellers')
        .select('id, shop_name, shop_slug, shop_avatar_url, is_verified, is_partner')
        .in('id', sellerIds) : { data: [] };

      // Check if current user liked/reacted to posts (only for user_posts, not group_posts)
      let userReactions: Record<string, string> = {};
      const userPostIds = allPosts.filter(p => !p.is_group_post).map(p => p.id);
      if (user?.id && userPostIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .eq('user_id', user.id)
          .in('post_id', userPostIds);
        likes?.forEach(l => {
          userReactions[l.post_id] = l.reaction_type;
        });
      }

      // Get reaction counts for each post
      let reactionCounts: Record<string, Record<string, number>> = {};
      if (userPostIds.length > 0) {
        const { data: allLikes } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .in('post_id', userPostIds);
        
        allLikes?.forEach(l => {
          if (!reactionCounts[l.post_id]) {
            reactionCounts[l.post_id] = {};
          }
          reactionCounts[l.post_id][l.reaction_type] = (reactionCounts[l.post_id][l.reaction_type] || 0) + 1;
        });
      }

      const profileMap = new Map<string, any>(profiles?.map(p => [p.user_id, {
        ...p,
        vip_level_name: (p.vip_levels as any)?.name || null,
        is_admin: adminUserIds.has(p.user_id),
        has_prime_boost: p.has_prime_boost,
        name_color: p.name_colors,
        prime_effect: p.prime_effects,
        avatar_frame: p.avatar_frame_id ? frameMap.get(p.avatar_frame_id) : null,
      }] as [string, any]) || []);
      const sellerMap = new Map<string, any>(sellers?.map(s => [s.id, s] as [string, any]) || []);

      return {
        posts: allPosts.map(p => ({
          ...p,
          user_profile: p.is_anonymous ? null : (p.seller_id ? undefined : profileMap.get(p.user_id)),
          seller: p.seller_id ? sellerMap.get(p.seller_id) : undefined,
          is_liked: !!userReactions[p.id],
          user_reaction: userReactions[p.id] || null,
          reaction_counts: reactionCounts[p.id] || {}
        })) as UserPost[],
        nextPage: allPosts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });
};

// Get user's posts (with pinned posts first)
export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      // Only get personal posts (no seller_id) for user profile
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', targetUserId)
        .is('seller_id', null)
        .order('is_pinned', { ascending: false })
        .order('pinned_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profile with VIP level and name color
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username, nickname, avatar_frame_id, is_verified, total_spent, has_prime_boost, active_name_color_id, active_effect_id, vip_levels(name), name_colors(color_value, gradient_value, is_gradient), prime_effects(effect_type, effect_config)')
        .eq('user_id', targetUserId)
        .single();

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      const enrichedProfile = profile ? {
        ...profile,
        vip_level_name: (profile.vip_levels as any)?.name || null,
        is_admin: !!adminUser,
        has_prime_boost: profile.has_prime_boost,
        name_color: profile.name_colors,
        prime_effect: profile.prime_effects
      } : null;

      // Check if current user liked/reacted to posts
      let userReactions: Record<string, string> = {};
      if (user?.id && data?.length) {
        const postIds = data.map(p => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        likes?.forEach(l => {
          userReactions[l.post_id] = l.reaction_type;
        });
      }

      // Get reaction counts for each post
      let reactionCounts: Record<string, Record<string, number>> = {};
      if (data?.length) {
        const postIds = data.map(p => p.id);
        const { data: allLikes } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .in('post_id', postIds);
        
        allLikes?.forEach(l => {
          if (!reactionCounts[l.post_id]) {
            reactionCounts[l.post_id] = {};
          }
          reactionCounts[l.post_id][l.reaction_type] = (reactionCounts[l.post_id][l.reaction_type] || 0) + 1;
        });
      }

      return data?.map(p => ({
        ...p,
        user_profile: enrichedProfile,
        is_liked: !!userReactions[p.id],
        user_reaction: userReactions[p.id] || null,
        reaction_counts: reactionCounts[p.id] || {}
      })) as UserPost[];
    },
    enabled: !!targetUserId
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, images = [], visibility = 'public', backgroundColor }: {
      content?: string;
      images?: string[];
      visibility?: 'public' | 'friends' | 'private';
      backgroundColor?: string | null;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (!content?.trim() && images.length === 0) throw new Error('Vui lòng nhập nội dung hoặc thêm ảnh');

      const { data, error } = await supabase
        .from('user_posts')
        .insert({
          user_id: user.id,
          content: content?.trim() || null,
          images,
          visibility,
          background_color: backgroundColor || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã đăng bài viết');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể đăng bài viết');
    }
  });
};

// Update post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, images, visibility }: {
      postId: string;
      content?: string;
      images?: string[];
      visibility?: 'public' | 'friends' | 'private';
    }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (content !== undefined) updateData.content = content.trim() || null;
      if (images !== undefined) updateData.images = images;
      if (visibility !== undefined) updateData.visibility = visibility;

      const { data, error } = await supabase
        .from('user_posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã cập nhật bài viết');
    }
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã xoá bài viết');
    }
  });
};

// React to post (with specific reaction type)
export const useReactPost = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // First delete existing reaction
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      // Insert new reaction
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) throw error;
      
      // Get post owner to send notification
      const { data: post } = await supabase
        .from('user_posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      
      if (post && post.user_id !== user.id) {
        const likerName = profile?.full_name || profile?.email || 'Người dùng';
        notifyPostLiked(post.user_id, likerName, postId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-reactions'] });
      queryClient.invalidateQueries({ queryKey: ['group-post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post-like', variables.postId] });
    }
  });
};

// Like post (default reaction)
export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: 'like'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-reactions'] });
    }
  });
};

// Unlike post
export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-reactions'] });
    }
  });
};

// Get post reactions
export const usePostReactions = (postId: string) => {
  return useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id, user_id, reaction_type, created_at')
        .eq('post_id', postId);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(data?.map(l => l.user_id) || [])];
      const { data: profiles } = userIds.length > 0 ? await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username')
        .in('user_id', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map(p => [p.user_id, p] as [string, typeof p]) || []);

      // Calculate reaction counts
      const reactionCounts: Record<string, number> = {};
      data?.forEach(r => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
      });

      return {
        reactions: data?.map(r => ({
          ...r,
          user_profile: profileMap.get(r.user_id)
        })) || [],
        reactionCounts,
        totalCount: data?.length || 0
      };
    },
    enabled: !!postId
  });
};

// Get post comments
export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user profiles with VIP level, avatar frame and name color
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username, nickname, avatar_frame_id, is_verified, total_spent, has_prime_boost, active_name_color_id, vip_levels(name), name_colors(color_value, gradient_value, is_gradient)')
        .in('user_id', userIds);

      // Check if users are admins
      const { data: adminUsers } = userIds.length > 0 ? await supabase
        .from('admin_users')
        .select('user_id')
        .in('user_id', userIds) : { data: [] };
      const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);

      // Check if user liked comments
      let likedCommentIds: string[] = [];
      if (user?.id && data?.length) {
        const commentIds = data.map(c => c.id);
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);
        likedCommentIds = likes?.map(l => l.comment_id) || [];
      }

      const profileMap = new Map(profiles?.map(p => [p.user_id, {
        ...p,
        vip_level_name: (p.vip_levels as any)?.name || null,
        is_admin: adminUserIds.has(p.user_id),
        has_prime_boost: p.has_prime_boost,
        name_color: p.name_colors
      }]));

      // Organize comments into threads
      const comments = data?.map(c => ({
        ...c,
        user_profile: profileMap.get(c.user_id),
        is_liked: likedCommentIds.includes(c.id)
      })) || [];

      // Separate root comments and replies
      const rootComments = comments.filter(c => !c.parent_id);
      const replies = comments.filter(c => c.parent_id);

      // Attach replies to parent comments
      return rootComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_id === comment.id)
      })) as PostComment[];
    },
    enabled: !!postId
  });
};

// Create comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: {
      postId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    }
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã xoá bình luận');
    }
  });
};

// Like comment
export const useLikeComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    }
  });
};

// Unlike comment
export const useUnlikeComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    }
  });
};

// Get user's posts count
export const usePostsCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['posts-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { count, error } = await supabase
        .from('user_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!targetUserId
  });
};

// Pin post
export const usePinPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // First unpin all other posts
      await supabase
        .from('user_posts')
        .update({ is_pinned: false, pinned_at: null })
        .eq('user_id', user.id)
        .eq('is_pinned', true);

      // Pin the selected post
      const { error } = await supabase
        .from('user_posts')
        .update({ 
          is_pinned: true, 
          pinned_at: new Date().toISOString() 
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã ghim bài viết');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ghim bài viết');
    }
  });
};

// Unpin post
export const useUnpinPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('user_posts')
        .update({ is_pinned: false, pinned_at: null })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Đã bỏ ghim bài viết');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể bỏ ghim bài viết');
    }
  });
};
