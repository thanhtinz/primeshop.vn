// Hooks for Posts - MySQL version
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { db, realtime } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface UserPost {
  id: string;
  userId: string;
  content: string | null;
  images: string[];
  visibility: 'public' | 'friends' | 'private';
  backgroundColor: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPinned: boolean;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userProfile?: any;
  isLiked?: boolean;
  userReaction?: string | null;
  reactionCounts?: Record<string, number>;
  isGroupPost?: boolean;
  groupId?: string;
  group?: any;
  // Legacy mappings
  user_id?: string;
  background_color?: string | null;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  is_pinned?: boolean;
  pinned_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user_profile?: any;
  is_liked?: boolean;
  user_reaction?: string | null;
  reaction_counts?: Record<string, number>;
  is_group_post?: boolean;
  group_id?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  userProfile?: any;
  isLiked?: boolean;
  replies?: PostComment[];
  // Legacy mappings
  post_id?: string;
  user_id?: string;
  parent_id?: string | null;
  likes_count?: number;
  created_at?: string;
  updated_at?: string;
  user_profile?: any;
  is_liked?: boolean;
}

const POSTS_PER_PAGE = 10;

const mapPostToLegacy = (p: any): UserPost => ({
  ...p,
  user_id: p.userId,
  background_color: p.backgroundColor,
  likes_count: p.likesCount,
  comments_count: p.commentsCount,
  shares_count: p.sharesCount,
  is_pinned: p.isPinned,
  pinned_at: p.pinnedAt,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  user_profile: p.userProfile,
  is_liked: p.isLiked,
  user_reaction: p.userReaction,
  reaction_counts: p.reactionCounts,
  is_group_post: p.isGroupPost,
  group_id: p.groupId,
});

const mapCommentToLegacy = (c: any): PostComment => ({
  ...c,
  post_id: c.postId,
  user_id: c.userId,
  parent_id: c.parentId,
  likes_count: c.likesCount,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
  user_profile: c.userProfile,
  is_liked: c.isLiked,
});

// Get newsfeed posts
export const useNewsfeed = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['newsfeed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * POSTS_PER_PAGE;

      // Get friend IDs
      let friendIds: string[] = [];
      if (user?.id) {
        const { data: friendships } = await db
          .from<any>('friendships')
          .select('requesterId, addresseeId')
          .or(`requesterId.eq.${user.id},addresseeId.eq.${user.id}`)
          .eq('status', 'accepted');
        
        friendIds = friendships?.map((f: any) => 
          f.requesterId === user.id ? f.addresseeId : f.requesterId
        ) || [];
      }

      // Fetch posts - public + friends + own
      let query = db
        .from<any>('user_posts')
        .select('*')
        .order('createdAt', { ascending: false })
        .range(from, from + POSTS_PER_PAGE - 1);

      if (user?.id) {
        query = query.or(`visibility.eq.public,userId.eq.${user.id}`);
      } else {
        query = query.eq('visibility', 'public');
      }

      const { data: postsData, error } = await query;
      if (error) throw error;

      // Filter friends-only posts
      const posts = (postsData || []).filter((p: any) => {
        if (p.visibility === 'public') return true;
        if (p.userId === user?.id) return true;
        if (p.visibility === 'friends' && friendIds.includes(p.userId)) return true;
        return false;
      });

      // Get user profiles
      const userIds = [...new Set(posts.map((p: any) => p.userId))];
      const { data: profiles } = userIds.length > 0 ? await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username, nickname, avatarFrameId, isVerified, totalSpent, vipLevelId')
        .in('userId', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
        nickname: p.nickname,
        avatar_frame_id: p.avatarFrameId,
        is_verified: p.isVerified,
        total_spent: p.totalSpent,
      }]));

      // Check user reactions
      let userReactions: Record<string, string> = {};
      if (user?.id && posts.length > 0) {
        const postIds = posts.map((p: any) => p.id);
        const { data: likes } = await db
          .from<any>('post_likes')
          .select('postId, reactionType')
          .eq('userId', user.id)
          .in('postId', postIds);
        
        likes?.forEach((l: any) => {
          userReactions[l.postId] = l.reactionType;
        });
      }

      // Get reaction counts
      let reactionCounts: Record<string, Record<string, number>> = {};
      if (posts.length > 0) {
        const postIds = posts.map((p: any) => p.id);
        const { data: allLikes } = await db
          .from<any>('post_likes')
          .select('postId, reactionType')
          .in('postId', postIds);
        
        allLikes?.forEach((l: any) => {
          if (!reactionCounts[l.postId]) {
            reactionCounts[l.postId] = {};
          }
          reactionCounts[l.postId][l.reactionType] = (reactionCounts[l.postId][l.reactionType] || 0) + 1;
        });
      }

      return {
        posts: posts.map((p: any) => {
          const mapped = mapPostToLegacy(p);
          return {
            ...mapped,
            userProfile: profileMap.get(p.userId),
            user_profile: profileMap.get(p.userId),
            isLiked: !!userReactions[p.id],
            is_liked: !!userReactions[p.id],
            userReaction: userReactions[p.id] || null,
            user_reaction: userReactions[p.id] || null,
            reactionCounts: reactionCounts[p.id] || {},
            reaction_counts: reactionCounts[p.id] || {},
          };
        }),
        nextPage: posts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });
};

// Get user's posts
export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await db
        .from<any>('user_posts')
        .select('*')
        .eq('userId', targetUserId)
        .order('isPinned', { ascending: false })
        .order('pinnedAt', { ascending: false })
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Get user profile
      const { data: profile } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username, nickname, isVerified')
        .eq('userId', targetUserId)
        .single();

      const enrichedProfile = profile ? {
        user_id: profile.userId,
        full_name: profile.fullName,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        username: profile.username,
        nickname: profile.nickname,
        is_verified: profile.isVerified,
      } : null;

      // Check reactions
      let userReactions: Record<string, string> = {};
      if (user?.id && data?.length) {
        const postIds = data.map((p: any) => p.id);
        const { data: likes } = await db
          .from<any>('post_likes')
          .select('postId, reactionType')
          .eq('userId', user.id)
          .in('postId', postIds);
        
        likes?.forEach((l: any) => {
          userReactions[l.postId] = l.reactionType;
        });
      }

      // Get reaction counts
      let reactionCounts: Record<string, Record<string, number>> = {};
      if (data?.length) {
        const postIds = data.map((p: any) => p.id);
        const { data: allLikes } = await db
          .from<any>('post_likes')
          .select('postId, reactionType')
          .in('postId', postIds);
        
        allLikes?.forEach((l: any) => {
          if (!reactionCounts[l.postId]) {
            reactionCounts[l.postId] = {};
          }
          reactionCounts[l.postId][l.reactionType] = (reactionCounts[l.postId][l.reactionType] || 0) + 1;
        });
      }

      return data?.map((p: any) => {
        const mapped = mapPostToLegacy(p);
        return {
          ...mapped,
          userProfile: enrichedProfile,
          user_profile: enrichedProfile,
          isLiked: !!userReactions[p.id],
          is_liked: !!userReactions[p.id],
          userReaction: userReactions[p.id] || null,
          user_reaction: userReactions[p.id] || null,
          reactionCounts: reactionCounts[p.id] || {},
          reaction_counts: reactionCounts[p.id] || {},
        };
      }) || [];
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

      const { data, error } = await db
        .from<any>('user_posts')
        .insert({
          userId: user.id,
          content: content?.trim() || null,
          images,
          visibility,
          backgroundColor: backgroundColor || null,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          isPinned: false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapPostToLegacy(data);
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
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (content !== undefined) updateData.content = content.trim() || null;
      if (images !== undefined) updateData.images = images;
      if (visibility !== undefined) updateData.visibility = visibility;

      const { data, error } = await db
        .from<any>('user_posts')
        .update(updateData)
        .eq('id', postId)
        .select('*')
        .single();

      if (error) throw error;
      return mapPostToLegacy(data);
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
      const { error } = await db
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

// React to post
export const useReactPost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Delete existing
      await db
        .from('post_likes')
        .delete()
        .eq('postId', postId)
        .eq('userId', user.id);

      // Insert new
      const { error } = await db
        .from('post_likes')
        .insert({
          postId,
          userId: user.id,
          reactionType
        });

      if (error) throw error;

      // Update likes count
      const { data: likesData } = await db
        .from<any>('post_likes')
        .select('id')
        .eq('postId', postId);

      await db
        .from('user_posts')
        .update({ likesCount: likesData?.length || 0 })
        .eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-reactions'] });
    }
  });
};

// Like post
export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    }
  });
};

// Get post reactions
export const usePostReactions = (postId: string) => {
  return useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('post_likes')
        .select('id, userId, reactionType, createdAt')
        .eq('postId', postId);

      if (error) throw error;

      // Get profiles
      const userIds = [...new Set(data?.map((l: any) => l.userId) || [])];
      const { data: profiles } = userIds.length > 0 ? await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username')
        .in('userId', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
      }]));

      // Calculate counts
      const reactionCounts: Record<string, number> = {};
      data?.forEach((r: any) => {
        reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
      });

      return {
        reactions: data?.map((r: any) => ({
          ...r,
          user_id: r.userId,
          reaction_type: r.reactionType,
          created_at: r.createdAt,
          user_profile: profileMap.get(r.userId),
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

  // Real-time subscription
  useEffect(() => {
    if (!postId) return;

    const unsubscribe = realtime.subscribe(`post_comments:${postId}`, () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    });

    return () => {
      unsubscribe();
    };
  }, [postId, queryClient]);

  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('post_comments')
        .select('*')
        .eq('postId', postId)
        .order('createdAt', { ascending: true });

      if (error) throw error;

      // Get profiles
      const userIds = [...new Set(data?.map((c: any) => c.userId) || [])];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username, nickname, isVerified')
        .in('userId', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
        nickname: p.nickname,
        is_verified: p.isVerified,
      }]));

      // Check liked comments
      let likedCommentIds: string[] = [];
      if (user?.id && data?.length) {
        const commentIds = data.map((c: any) => c.id);
        const { data: likes } = await db
          .from<any>('comment_likes')
          .select('commentId')
          .eq('userId', user.id)
          .in('commentId', commentIds);
        likedCommentIds = likes?.map((l: any) => l.commentId) || [];
      }

      // Organize into threads
      const comments = data?.map((c: any) => {
        const mapped = mapCommentToLegacy(c);
        return {
          ...mapped,
          userProfile: profileMap.get(c.userId),
          user_profile: profileMap.get(c.userId),
          isLiked: likedCommentIds.includes(c.id),
          is_liked: likedCommentIds.includes(c.id),
        };
      }) || [];

      const rootComments = comments.filter((c: any) => !c.parentId);
      const replies = comments.filter((c: any) => c.parentId);

      return rootComments.map((comment: any) => ({
        ...comment,
        replies: replies.filter((r: any) => r.parentId === comment.id)
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

      const { data, error } = await db
        .from<any>('post_comments')
        .insert({
          postId,
          userId: user.id,
          content,
          parentId: parentId || null,
          likesCount: 0,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update comments count
      const { data: post } = await db
        .from<any>('user_posts')
        .select('commentsCount')
        .eq('id', postId)
        .single();

      if (post) {
        await db
          .from('user_posts')
          .update({ commentsCount: (post.commentsCount || 0) + 1 })
          .eq('id', postId);
      }

      return mapCommentToLegacy(data);
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
      const { error } = await db
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update count
      const { data: post } = await db
        .from<any>('user_posts')
        .select('commentsCount')
        .eq('id', postId)
        .single();

      if (post) {
        await db
          .from('user_posts')
          .update({ commentsCount: Math.max(0, (post.commentsCount || 1) - 1) })
          .eq('id', postId);
      }

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

      const { error } = await db
        .from('comment_likes')
        .insert({
          commentId,
          userId: user.id
        });

      if (error) throw error;

      // Update count
      const { data: likesData } = await db
        .from<any>('comment_likes')
        .select('id')
        .eq('commentId', commentId);

      await db
        .from('post_comments')
        .update({ likesCount: likesData?.length || 0 })
        .eq('id', commentId);

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

      const { error } = await db
        .from('comment_likes')
        .delete()
        .eq('commentId', commentId)
        .eq('userId', user.id);

      if (error) throw error;

      // Update count
      const { data: likesData } = await db
        .from<any>('comment_likes')
        .select('id')
        .eq('commentId', commentId);

      await db
        .from('post_comments')
        .update({ likesCount: likesData?.length || 0 })
        .eq('id', commentId);

      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    }
  });
};

// Get posts count
export const usePostsCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['posts-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { data, error } = await db
        .from<any>('user_posts')
        .select('id')
        .eq('userId', targetUserId);

      if (error) return 0;
      return data?.length || 0;
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

      // Unpin all other posts
      await db
        .from('user_posts')
        .update({ isPinned: false, pinnedAt: null })
        .eq('userId', user.id)
        .eq('isPinned', true);

      // Pin selected post
      const { error } = await db
        .from('user_posts')
        .update({ 
          isPinned: true, 
          pinnedAt: new Date().toISOString() 
        })
        .eq('id', postId)
        .eq('userId', user.id);

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

      const { error } = await db
        .from('user_posts')
        .update({ isPinned: false, pinnedAt: null })
        .eq('id', postId)
        .eq('userId', user.id);

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
