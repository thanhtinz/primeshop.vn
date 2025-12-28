import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type GroupPostType = 'announcement' | 'discussion' | 'deal' | 'task' | 'profit_share' | 'report';

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  post_type: GroupPostType;
  title: string | null;
  content: string;
  media_urls: string[] | null;
  type_data: Record<string, any>;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    user_id?: string;
    full_name: string | null;
    avatar_url: string | null;
    username?: string | null;
    avatar_frame_id?: string | null;
    is_verified?: boolean | null;
    has_prime_boost?: boolean | null;
    total_spent?: number | null;
    vip_level_id?: string | null;
    vip_level_name?: string | null;
    avatar_frame?: {
      id: string;
      image_url: string;
      avatar_border_radius: string | null;
    } | null;
    name_color?: {
      is_gradient: boolean;
      color_value: string | null;
      gradient_value: string | null;
    } | null;
  } | null;
  user_reaction?: string | null;
}

export interface GroupPostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  media_urls: string[] | null;
  like_count: number;
  is_anonymous?: boolean;
  is_post_author?: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    user_id?: string;
    full_name: string | null;
    avatar_url: string | null;
    username?: string | null;
    avatar_frame_id?: string | null;
    is_verified?: boolean;
    has_prime_boost?: boolean;
    vip_level_id?: string | null;
    vip_level_name?: string | null;
    nickname?: string | null;
    active_name_color_id?: string | null;
    name_color?: {
      is_gradient: boolean;
      color_value: string | null;
      gradient_value: string | null;
    } | null;
    avatar_frame?: {
      id: string;
      image_url: string;
      avatar_border_radius: string | null;
    } | null;
    group_badges?: any[];
  } | null;
  replies?: GroupPostComment[];
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

// Fetch group posts with filtering
export function useGroupPosts(groupId: string, postType?: GroupPostType, sortBy?: 'relevant' | 'recent-activity' | 'newest') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-posts', groupId, postType, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_hidden', false);
      
      if (postType) {
        query = query.eq('post_type', postType);
      }
      
      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'recent-activity') {
        // Sort by updated_at (comments/reactions update this)
        query = query.order('updated_at', { ascending: false });
      } else {
        // 'relevant' - pinned first, then by engagement (likes + comments), then recency
        query = query
          .order('is_pinned', { ascending: false })
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) return [] as GroupPost[];
      
      // Fetch author profiles with extended info
      const authorIds = [...new Set(data.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, avatar_frame_id, is_verified, has_prime_boost, total_spent, vip_level_id, username, active_name_color_id')
        .in('user_id', authorIds);
      
      // Get VIP level names
      const vipLevelIds = [...new Set(profiles?.map(p => p.vip_level_id).filter(Boolean) || [])];
      let vipLevelMap = new Map<string, string>();
      if (vipLevelIds.length > 0) {
        const { data: vipLevels } = await supabase
          .from('vip_levels')
          .select('id, name')
          .in('id', vipLevelIds);
        vipLevelMap = new Map(vipLevels?.map(v => [v.id, v.name]) || []);
      }
      
      // Get avatar frames
      const frameIds = [...new Set(profiles?.map(p => p.avatar_frame_id).filter(Boolean) || [])];
      let frameMap = new Map<string, any>();
      if (frameIds.length > 0) {
        const { data: frames } = await supabase
          .from('avatar_frames')
          .select('id, image_url, avatar_border_radius')
          .in('id', frameIds);
        frameMap = new Map(frames?.map(f => [f.id, f]) || []);
      }
      
      // Get name colors
      const nameColorIds = [...new Set(profiles?.map(p => p.active_name_color_id).filter(Boolean) || [])];
      let nameColorMap = new Map<string, any>();
      if (nameColorIds.length > 0) {
        const { data: nameColors } = await supabase
          .from('name_colors')
          .select('id, is_gradient, color_value, gradient_value')
          .in('id', nameColorIds);
        nameColorMap = new Map(nameColors?.map(c => [c.id, c]) || []);
      }
      
      const profileMap = new Map<string, any>();
      profiles?.forEach(p => {
        if (p.user_id) profileMap.set(p.user_id, { 
          ...p,
          vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
          avatar_frame: p.avatar_frame_id ? frameMap.get(p.avatar_frame_id) : null,
          name_color: p.active_name_color_id ? nameColorMap.get(p.active_name_color_id) : null,
        });
      });
      
      // Get user reactions if logged in
      let likesMap = new Map<string, string>();
      if (user) {
        const { data: likes } = await supabase
          .from('group_post_likes')
          .select('post_id, reaction_type')
          .eq('user_id', user.id)
          .in('post_id', data.map(p => p.id));
        
        likesMap = new Map(likes?.map(l => [l.post_id, l.reaction_type]) || []);
      }
      
      // Fetch reaction counts for each post
      const postIds = data.map(p => p.id);
      const { data: allReactions } = await supabase
        .from('group_post_likes')
        .select('post_id, reaction_type')
        .in('post_id', postIds);
      
      // Build reaction counts map
      const reactionCountsMap = new Map<string, Record<string, number>>();
      allReactions?.forEach(r => {
        const existing = reactionCountsMap.get(r.post_id) || {};
        existing[r.reaction_type] = (existing[r.reaction_type] || 0) + 1;
        reactionCountsMap.set(r.post_id, existing);
      });
      
      return data.map(post => ({
        ...post,
        author: profileMap.get(post.author_id) || null,
        user_reaction: likesMap.get(post.id) || null,
        reaction_counts: reactionCountsMap.get(post.id) || {},
      })) as GroupPost[];
    },
    enabled: !!groupId,
  });
}

// Fetch single post
export function useGroupPost(postId: string) {
  return useQuery({
    queryKey: ['group-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', data.author_id)
        .single();
      
      return { ...data, author: profile } as GroupPost;
    },
    enabled: !!postId,
  });
}

// Fetch post comments with extended author info
export function useGroupPostComments(postId: string, postAuthorId?: string) {
  return useQuery({
    queryKey: ['group-post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupPostComment[];
      
      // Get the group_id from the post
      const { data: postData } = await supabase
        .from('group_posts')
        .select('group_id, author_id')
        .eq('id', postId)
        .maybeSingle();
      
      const groupId = postData?.group_id;
      const actualPostAuthorId = postAuthorId || postData?.author_id;
      
      // Fetch all author profiles with extended info
      const authorIds = [...new Set(data.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username, avatar_frame_id, is_verified, has_prime_boost, vip_level_id, nickname, active_name_color_id')
        .in('user_id', authorIds);
      
      // Fetch VIP level names
      const vipLevelIds = [...new Set(profiles?.map(p => p.vip_level_id).filter(Boolean) || [])];
      let vipLevelMap = new Map<string, string>();
      if (vipLevelIds.length > 0) {
        const { data: vipLevels } = await supabase
          .from('vip_levels')
          .select('id, name')
          .in('id', vipLevelIds);
        vipLevelMap = new Map(vipLevels?.map(v => [v.id, v.name]) || []);
      }
      
      // Fetch name colors
      const nameColorIds = [...new Set(profiles?.map(p => p.active_name_color_id).filter(Boolean) || [])];
      let nameColorMap = new Map<string, any>();
      if (nameColorIds.length > 0) {
        const { data: nameColors } = await supabase
          .from('name_colors')
          .select('id, is_gradient, color_value, gradient_value')
          .in('id', nameColorIds);
        nameColorMap = new Map(nameColors?.map(c => [c.id, c]) || []);
      }
      
      // Fetch avatar frames
      const frameIds = [...new Set(profiles?.map(p => p.avatar_frame_id).filter(Boolean) || [])];
      let frameMap = new Map<string, any>();
      if (frameIds.length > 0) {
        const { data: frames } = await supabase
          .from('avatar_frames')
          .select('id, image_url, avatar_border_radius')
          .in('id', frameIds);
        frameMap = new Map(frames?.map(f => [f.id, f]) || []);
      }
      
      // Fetch group member badges if we have a group_id
      let memberBadgesMap = new Map<string, any[]>();
      if (groupId) {
        // First get the member IDs for these users in this group
        const { data: members } = await supabase
          .from('group_members')
          .select('id, user_id')
          .eq('group_id', groupId)
          .in('user_id', authorIds);
        
        if (members && members.length > 0) {
          const memberIdToUserId = new Map(members.map(m => [m.id, m.user_id]));
          const memberIds = members.map(m => m.id);
          
          const { data: memberBadges } = await supabase
            .from('group_member_badges')
            .select(`*, badge:group_badges(*)`)
            .in('member_id', memberIds);
          
          memberBadges?.forEach(mb => {
            const userId = memberIdToUserId.get(mb.member_id);
            if (userId) {
              const existing = memberBadgesMap.get(userId) || [];
              existing.push(mb);
              memberBadgesMap.set(userId, existing);
            }
          });
        }
      }
      
      const profileMap = new Map<string, any>();
      profiles?.forEach(p => {
        if (p.user_id) {
          profileMap.set(p.user_id, { 
            ...p,
            vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
            name_color: p.active_name_color_id ? nameColorMap.get(p.active_name_color_id) : null,
            avatar_frame: p.avatar_frame_id ? frameMap.get(p.avatar_frame_id) : null,
            group_badges: memberBadgesMap.get(p.user_id) || [],
          });
        }
      });
      
      // Fetch replies
      const { data: replies } = await supabase
        .from('group_post_comments')
        .select('*')
        .in('parent_id', data.map(c => c.id))
        .order('created_at', { ascending: true });
      
      // Get reply authors with extended info
      if (replies && replies.length > 0) {
        const replyAuthorIds = [...new Set(replies.map(r => r.author_id))];
        const newAuthorIds = replyAuthorIds.filter(id => !profileMap.has(id));
        
        if (newAuthorIds.length > 0) {
          const { data: replyProfiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, username, avatar_frame_id, is_verified, has_prime_boost, vip_level_id, nickname, active_name_color_id')
            .in('user_id', newAuthorIds);
          
          // Fetch additional VIP levels, name colors, frames for reply authors
          const newVipIds = [...new Set(replyProfiles?.map(p => p.vip_level_id).filter(id => id && !vipLevelMap.has(id)) || [])];
          const newColorIds = [...new Set(replyProfiles?.map(p => p.active_name_color_id).filter(id => id && !nameColorMap.has(id)) || [])];
          const newFrameIds = [...new Set(replyProfiles?.map(p => p.avatar_frame_id).filter(id => id && !frameMap.has(id)) || [])];
          
          if (newVipIds.length > 0) {
            const { data: vipLevels } = await supabase.from('vip_levels').select('id, name').in('id', newVipIds);
            vipLevels?.forEach(v => vipLevelMap.set(v.id, v.name));
          }
          if (newColorIds.length > 0) {
            const { data: colors } = await supabase.from('name_colors').select('id, is_gradient, color_value, gradient_value').in('id', newColorIds);
            colors?.forEach(c => nameColorMap.set(c.id, c));
          }
          if (newFrameIds.length > 0) {
            const { data: frames } = await supabase.from('avatar_frames').select('id, image_url, avatar_border_radius').in('id', newFrameIds);
            frames?.forEach(f => frameMap.set(f.id, f));
          }
          
          // Fetch group badges for new reply authors
          if (groupId && newAuthorIds.length > 0) {
            const { data: members } = await supabase
              .from('group_members')
              .select('id, user_id')
              .eq('group_id', groupId)
              .in('user_id', newAuthorIds);
            
            if (members && members.length > 0) {
              const memberIdToUserId = new Map(members.map(m => [m.id, m.user_id]));
              const { data: memberBadges } = await supabase
                .from('group_member_badges')
                .select(`*, badge:group_badges(*)`)
                .in('member_id', members.map(m => m.id));
              
              memberBadges?.forEach(mb => {
                const userId = memberIdToUserId.get(mb.member_id);
                if (userId) {
                  const existing = memberBadgesMap.get(userId) || [];
                  existing.push(mb);
                  memberBadgesMap.set(userId, existing);
                }
              });
            }
          }
          
          replyProfiles?.forEach(p => {
            if (p.user_id) {
              profileMap.set(p.user_id, { 
                ...p,
                vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
                name_color: p.active_name_color_id ? nameColorMap.get(p.active_name_color_id) : null,
                avatar_frame: p.avatar_frame_id ? frameMap.get(p.avatar_frame_id) : null,
                group_badges: memberBadgesMap.get(p.user_id) || [],
              });
            }
          });
        }
      }
      
      const repliesMap = new Map<string, GroupPostComment[]>();
      replies?.forEach(reply => {
        const existing = repliesMap.get(reply.parent_id!) || [];
        existing.push({ 
          ...reply, 
          author: profileMap.get(reply.author_id) || null,
          is_post_author: reply.author_id === actualPostAuthorId,
        } as GroupPostComment);
        repliesMap.set(reply.parent_id!, existing);
      });
      
      return data.map(comment => ({
        ...comment,
        author: profileMap.get(comment.author_id) || null,
        replies: repliesMap.get(comment.id) || [],
        is_post_author: comment.author_id === actualPostAuthorId,
      })) as GroupPostComment[];
    },
    enabled: !!postId,
  });
}

// Create post
export function useCreateGroupPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateGroupPostData) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data: post, error } = await supabase
        .from('group_posts')
        .insert({
          ...data,
          author_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return post as GroupPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', post.group_id] });
      toast.success('Đã đăng bài viết!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể đăng bài');
    },
  });
}

// Update post
export function useUpdateGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      data 
    }: { 
      postId: string; 
      data: Partial<GroupPost>;
    }) => {
      const { data: post, error } = await supabase
        .from('group_posts')
        .update(data)
        .eq('id', postId)
        .select()
        .single();
      
      if (error) throw error;
      return post as GroupPost;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', post.group_id] });
      queryClient.invalidateQueries({ queryKey: ['group-post', post.id] });
      toast.success('Đã cập nhật bài viết!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật bài');
    },
  });
}

// Delete post
export function useDeleteGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId }: { postId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('Đã xóa bài viết!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa bài');
    },
  });
}

// Like/React to post
export function useReactToGroupPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      groupId,
      reactionType 
    }: { 
      postId: string; 
      groupId: string;
      reactionType: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Check existing reaction
      const { data: existing } = await supabase
        .from('group_post_likes')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from('group_post_likes')
            .delete()
            .eq('id', existing.id);
          
          // Decrease count
          const { data: post } = await supabase
            .from('group_posts')
            .select('like_count')
            .eq('id', postId)
            .single();
          
          await supabase
            .from('group_posts')
            .update({ like_count: Math.max(0, (post?.like_count || 1) - 1) })
            .eq('id', postId);
        } else {
          // Update reaction
          await supabase
            .from('group_post_likes')
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from('group_post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });
        
        // Increase count
        const { data: post } = await supabase
          .from('group_posts')
          .select('like_count')
          .eq('id', postId)
          .single();
        
        await supabase
          .from('group_posts')
          .update({ like_count: (post?.like_count || 0) + 1 })
          .eq('id', postId);
      }
      
      return { groupId, postId };
    },
    onSuccess: ({ groupId, postId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-post-reactions', postId] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể react');
    },
  });
}

// Add comment
export function useAddGroupPostComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      postId, 
      content, 
      parentId,
      mediaUrls,
      isAnonymous,
    }: { 
      postId: string; 
      content: string;
      parentId?: string;
      mediaUrls?: string[];
      isAnonymous?: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data: comment, error } = await supabase
        .from('group_post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content,
          parent_id: parentId || null,
          media_urls: mediaUrls || null,
          is_anonymous: isAnonymous || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Increase comment count
      const { data: post } = await supabase
        .from('group_posts')
        .select('comment_count')
        .eq('id', postId)
        .single();
      
      await supabase
        .from('group_posts')
        .update({ comment_count: (post?.comment_count || 0) + 1 })
        .eq('id', postId);
      
      return comment as GroupPostComment;
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', comment.post_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể bình luận');
    },
  });
}

// Get group post reactions (for ReactionsModal)
export function useGroupPostReactions(postId: string) {
  console.log('[useGroupPostReactions] Called with postId:', postId);
  
  return useQuery({
    queryKey: ['group-post-reactions', postId],
    queryFn: async () => {
      console.log('[useGroupPostReactions] Fetching reactions for post:', postId);
      
      const { data, error } = await supabase
        .from('group_post_likes')
        .select('id, user_id, reaction_type, created_at')
        .eq('post_id', postId);

      console.log('[useGroupPostReactions] Query result:', { data, error });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(data?.map(l => l.user_id) || [])];
      const { data: profiles } = userIds.length > 0 ? await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username')
        .in('user_id', userIds) : { data: [] };

      console.log('[useGroupPostReactions] Profiles:', profiles);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p] as [string, typeof p]) || []);

      // Calculate reaction counts
      const reactionCounts: Record<string, number> = {};
      data?.forEach(r => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
      });

      const result = {
        reactions: data?.map(r => ({
          ...r,
          user_profile: profileMap.get(r.user_id)
        })) || [],
        reactionCounts,
        totalCount: data?.length || 0
      };
      
      console.log('[useGroupPostReactions] Final result:', result);
      return result;
    },
    enabled: !!postId
  });
}
