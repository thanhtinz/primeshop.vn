// Hooks for Group Posts - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type GroupPostType = 'announcement' | 'discussion' | 'deal' | 'task' | 'profit_share' | 'report';

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  postType: GroupPostType;
  title: string | null;
  content: string;
  mediaUrls: string[] | null;
  typeData: Record<string, any>;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  author?: any;
  userReaction?: string | null;
  reactionCounts?: Record<string, number>;
  // Legacy mappings
  group_id?: string;
  author_id?: string;
  post_type?: GroupPostType;
  media_urls?: string[] | null;
  type_data?: Record<string, any>;
  like_count?: number;
  comment_count?: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  is_hidden?: boolean;
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
  user_reaction?: string | null;
  reaction_counts?: Record<string, number>;
}

export interface GroupPostComment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  mediaUrls: string[] | null;
  likeCount: number;
  isAnonymous?: boolean;
  isPostAuthor?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: any;
  replies?: GroupPostComment[];
  // Legacy mappings
  post_id?: string;
  author_id?: string;
  parent_id?: string | null;
  media_urls?: string[] | null;
  like_count?: number;
  is_anonymous?: boolean;
  is_post_author?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGroupPostData {
  group_id: string;
  post_type?: GroupPostType;
  title?: string;
  content: string;
  media_urls?: string[];
  type_data?: Record<string, any>;
  is_anonymous?: boolean;
}

const mapPostToLegacy = (p: any): GroupPost => ({
  ...p,
  group_id: p.groupId,
  author_id: p.authorId,
  post_type: p.postType,
  media_urls: p.mediaUrls,
  type_data: p.typeData,
  like_count: p.likeCount,
  comment_count: p.commentCount,
  is_pinned: p.isPinned,
  is_locked: p.isLocked,
  is_hidden: p.isHidden,
  is_anonymous: p.isAnonymous,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  user_reaction: p.userReaction,
  reaction_counts: p.reactionCounts,
});

const mapCommentToLegacy = (c: any): GroupPostComment => ({
  ...c,
  post_id: c.postId,
  author_id: c.authorId,
  parent_id: c.parentId,
  media_urls: c.mediaUrls,
  like_count: c.likeCount,
  is_anonymous: c.isAnonymous,
  is_post_author: c.isPostAuthor,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

// Fetch group posts
export function useGroupPosts(groupId: string, postType?: GroupPostType, sortBy?: 'relevant' | 'recent-activity' | 'newest') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-posts', groupId, postType, sortBy],
    queryFn: async () => {
      let query = db
        .from<any>('group_posts')
        .select('*')
        .eq('groupId', groupId)
        .eq('isHidden', false);
      
      if (postType) {
        query = query.eq('postType', postType);
      }
      
      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('createdAt', { ascending: false });
      } else if (sortBy === 'recent-activity') {
        query = query.order('updatedAt', { ascending: false });
      } else {
        query = query
          .order('isPinned', { ascending: false })
          .order('likeCount', { ascending: false })
          .order('createdAt', { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return [] as GroupPost[];
      
      // Fetch author profiles
      const authorIds = [...new Set(data.map((p: any) => p.authorId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, avatarUrl, avatarFrameId, isVerified, hasPrimeBoost, totalSpent, vipLevelId, username, activeNameColorId')
        .in('userId', authorIds);
      
      const profileMap = new Map<string, any>();
      profiles?.forEach((p: any) => {
        if (p.userId) profileMap.set(p.userId, {
          user_id: p.userId,
          full_name: p.fullName,
          avatar_url: p.avatarUrl,
          avatar_frame_id: p.avatarFrameId,
          is_verified: p.isVerified,
          has_prime_boost: p.hasPrimeBoost,
          total_spent: p.totalSpent,
          username: p.username,
        });
      });
      
      // Get user reactions if logged in
      let likesMap = new Map<string, string>();
      if (user) {
        const { data: likes } = await db
          .from<any>('group_post_likes')
          .select('postId, reactionType')
          .eq('userId', user.id)
          .in('postId', data.map((p: any) => p.id));
        
        likesMap = new Map(likes?.map((l: any) => [l.postId, l.reactionType]) || []);
      }
      
      // Fetch reaction counts
      const postIds = data.map((p: any) => p.id);
      const { data: allReactions } = await db
        .from<any>('group_post_likes')
        .select('postId, reactionType')
        .in('postId', postIds);
      
      const reactionCountsMap = new Map<string, Record<string, number>>();
      allReactions?.forEach((r: any) => {
        const existing = reactionCountsMap.get(r.postId) || {};
        existing[r.reactionType] = (existing[r.reactionType] || 0) + 1;
        reactionCountsMap.set(r.postId, existing);
      });
      
      return data.map((post: any) => {
        const mapped = mapPostToLegacy(post);
        return {
          ...mapped,
          author: post.isAnonymous ? null : profileMap.get(post.authorId),
          userReaction: likesMap.get(post.id) || null,
          user_reaction: likesMap.get(post.id) || null,
          reactionCounts: reactionCountsMap.get(post.id) || {},
          reaction_counts: reactionCountsMap.get(post.id) || {},
        };
      }) as GroupPost[];
    },
    enabled: !!groupId,
  });
}

// Fetch single post
export function useGroupPost(postId: string) {
  return useQuery({
    queryKey: ['group-post', postId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      const { data: profile } = await db
        .from<any>('profiles')
        .select('userId, fullName, avatarUrl')
        .eq('userId', data.authorId)
        .single();
      
      return {
        ...mapPostToLegacy(data),
        author: profile ? {
          user_id: profile.userId,
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
        } : null,
      } as GroupPost;
    },
    enabled: !!postId,
  });
}

// Fetch post comments
export function useGroupPostComments(postId: string, postAuthorId?: string) {
  return useQuery({
    queryKey: ['group-post-comments', postId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_post_comments')
        .select('*')
        .eq('postId', postId)
        .is('parentId', null)
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupPostComment[];
      
      // Get post info
      const { data: postData } = await db
        .from<any>('group_posts')
        .select('groupId, authorId')
        .eq('id', postId)
        .single();
      
      const actualPostAuthorId = postAuthorId || postData?.authorId;
      
      // Fetch author profiles
      const authorIds = [...new Set(data.map((c: any) => c.authorId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, avatarUrl, username, isVerified, nickname')
        .in('userId', authorIds);
      
      const profileMap = new Map<string, any>();
      profiles?.forEach((p: any) => {
        if (p.userId) profileMap.set(p.userId, {
          user_id: p.userId,
          full_name: p.fullName,
          avatar_url: p.avatarUrl,
          username: p.username,
          is_verified: p.isVerified,
          nickname: p.nickname,
        });
      });
      
      // Fetch replies
      const commentIds = data.map((c: any) => c.id);
      const { data: replies } = await db
        .from<any>('group_post_comments')
        .select('*')
        .in('parentId', commentIds)
        .order('createdAt', { ascending: true });
      
      const repliesMap = new Map<string, any[]>();
      replies?.forEach((r: any) => {
        const existing = repliesMap.get(r.parentId) || [];
        existing.push({
          ...mapCommentToLegacy(r),
          author: r.isAnonymous ? null : profileMap.get(r.authorId),
          isPostAuthor: r.authorId === actualPostAuthorId,
          is_post_author: r.authorId === actualPostAuthorId,
        });
        repliesMap.set(r.parentId, existing);
      });
      
      return data.map((comment: any) => {
        const mapped = mapCommentToLegacy(comment);
        return {
          ...mapped,
          author: comment.isAnonymous ? null : profileMap.get(comment.authorId),
          isPostAuthor: comment.authorId === actualPostAuthorId,
          is_post_author: comment.authorId === actualPostAuthorId,
          replies: repliesMap.get(comment.id) || [],
        };
      }) as GroupPostComment[];
    },
    enabled: !!postId,
  });
}

// Create group post
export function useCreateGroupPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postData: CreateGroupPostData) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await db
        .from<any>('group_posts')
        .insert({
          groupId: postData.group_id,
          authorId: user.id,
          postType: postData.post_type || 'discussion',
          title: postData.title,
          content: postData.content,
          mediaUrls: postData.media_urls || [],
          typeData: postData.type_data || {},
          isAnonymous: postData.is_anonymous || false,
          likeCount: 0,
          commentCount: 0,
          isPinned: false,
          isLocked: false,
          isHidden: false,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update group post count
      const { data: group } = await db
        .from<any>('groups')
        .select('postCount')
        .eq('id', postData.group_id)
        .single();
      
      if (group) {
        await db
          .from<any>('groups')
          .update({ postCount: (group.postCount || 0) + 1 })
          .eq('id', postData.group_id);
      }
      
      return mapPostToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.group_id] });
      toast.success('Đã đăng bài viết');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update group post
export function useUpdateGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, ...updates }: {
      postId: string;
      content?: string;
      title?: string;
      mediaUrls?: string[];
      isPinned?: boolean;
      isLocked?: boolean;
      isHidden?: boolean;
    }) => {
      const updateData: any = { updatedAt: new Date().toISOString() };
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.mediaUrls !== undefined) updateData.mediaUrls = updates.mediaUrls;
      if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;
      if (updates.isLocked !== undefined) updateData.isLocked = updates.isLocked;
      if (updates.isHidden !== undefined) updateData.isHidden = updates.isHidden;
      
      const { data, error } = await db
        .from<any>('group_posts')
        .update(updateData)
        .eq('id', postId)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapPostToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['group-post'] });
      toast.success('Đã cập nhật bài viết');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete group post
export function useDeleteGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId }: { postId: string; groupId: string }) => {
      // Delete comments first
      await db.from('group_post_comments').delete().eq('postId', postId);
      
      // Delete likes
      await db.from('group_post_likes').delete().eq('postId', postId);
      
      // Delete post
      const { error } = await db.from('group_posts').delete().eq('id', postId);
      if (error) throw error;
      
      // Update group post count
      const { data: group } = await db
        .from<any>('groups')
        .select('postCount')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await db
          .from<any>('groups')
          .update({ postCount: Math.max(0, (group.postCount || 1) - 1) })
          .eq('id', groupId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('Đã xóa bài viết');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// React to group post
export function useReactGroupPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      // Remove existing reaction
      await db
        .from('group_post_likes')
        .delete()
        .eq('postId', postId)
        .eq('userId', user.id);
      
      // Add new reaction
      const { error } = await db
        .from('group_post_likes')
        .insert({
          postId,
          userId: user.id,
          reactionType,
        });
      
      if (error) throw error;
      
      // Update like count
      const { data: likesData } = await db
        .from<any>('group_post_likes')
        .select('id')
        .eq('postId', postId);
      
      await db
        .from('group_posts')
        .update({ likeCount: likesData?.length || 0 })
        .eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['group-post'] });
    },
  });
}

// Unlike group post
export function useUnreactGroupPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { error } = await db
        .from('group_post_likes')
        .delete()
        .eq('postId', postId)
        .eq('userId', user.id);
      
      if (error) throw error;
      
      // Update like count
      const { data: likesData } = await db
        .from<any>('group_post_likes')
        .select('id')
        .eq('postId', postId);
      
      await db
        .from('group_posts')
        .update({ likeCount: likesData?.length || 0 })
        .eq('id', postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['group-post'] });
    },
  });
}

// Create comment
export function useCreateGroupPostComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content, parentId, isAnonymous }: {
      postId: string;
      content: string;
      parentId?: string;
      isAnonymous?: boolean;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await db
        .from<any>('group_post_comments')
        .insert({
          postId,
          authorId: user.id,
          content,
          parentId: parentId || null,
          isAnonymous: isAnonymous || false,
          likeCount: 0,
          mediaUrls: [],
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update comment count
      const { data: post } = await db
        .from<any>('group_posts')
        .select('commentCount')
        .eq('id', postId)
        .single();
      
      if (post) {
        await db
          .from('group_posts')
          .update({ 
            commentCount: (post.commentCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', postId);
      }
      
      return mapCommentToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete comment
export function useDeleteGroupPostComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      // Delete replies first
      await db.from('group_post_comments').delete().eq('parentId', commentId);
      
      // Delete comment
      const { error } = await db.from('group_post_comments').delete().eq('id', commentId);
      if (error) throw error;
      
      // Update comment count
      const { data: post } = await db
        .from<any>('group_posts')
        .select('commentCount')
        .eq('id', postId)
        .single();
      
      if (post) {
        await db
          .from('group_posts')
          .update({ commentCount: Math.max(0, (post.commentCount || 1) - 1) })
          .eq('id', postId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('Đã xóa bình luận');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
