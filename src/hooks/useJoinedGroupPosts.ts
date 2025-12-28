import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JoinedGroupPost {
  id: string;
  group_id: string;
  author_id: string;
  post_type: string;
  title: string | null;
  content: string;
  media_urls: string[] | null;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_anonymous: boolean;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  author_nickname: string | null;
  author_frame: {
    id: string;
    image_url: string;
    avatar_border_radius: string | null;
  } | null;
  author_is_verified: boolean | null;
  author_has_prime_boost: boolean | null;
  author_total_spent: number | null;
  author_vip_level: string | null;
  author_name_color: {
    is_gradient: boolean;
    color_value: string | null;
    gradient_value: string | null;
  } | null;
  group_name: string | null;
  group_avatar: string | null;
  group_cover: string | null;
  user_reaction: string | null;
}

export function useJoinedGroupPosts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['joined-group-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get groups user has joined
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (!memberships || memberships.length === 0) return [];
      
      const groupIds = memberships.map(m => m.group_id);

      // Get hidden posts
      const { data: hiddenPosts } = await supabase
        .from('hidden_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_type', 'group_post');
      
      const hiddenPostIds = new Set(hiddenPosts?.map(h => h.post_id) || []);
      
      // Get hidden users (not expired)
      const now = new Date().toISOString();
      const { data: hiddenUsers } = await supabase
        .from('hidden_users')
        .select('hidden_user_id')
        .eq('user_id', user.id)
        .or(`hidden_until.is.null,hidden_until.gt.${now}`);
      
      const hiddenUserIds = new Set(hiddenUsers?.map(h => h.hidden_user_id) || []);
      
      // Fetch posts
      const { data: posts, error } = await supabase
        .from('group_posts')
        .select(`
          id,
          group_id,
          author_id,
          post_type,
          title,
          content,
          media_urls,
          like_count,
          comment_count,
          is_pinned,
          is_anonymous,
          created_at
        `)
        .in('group_id', groupIds)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (!posts || posts.length === 0) return [];
      
      // Fetch author profiles with extended info
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username, nickname, avatar_frame_id, is_verified, has_prime_boost, total_spent, vip_level_id, active_name_color_id')
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
      
      const profileMap = new Map<string, any>();
      profiles?.forEach(p => {
        if (p.user_id) profileMap.set(p.user_id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          username: p.username,
          nickname: p.nickname,
          avatar_frame: p.avatar_frame_id ? frameMap.get(p.avatar_frame_id) : null,
          is_verified: p.is_verified,
          has_prime_boost: p.has_prime_boost,
          total_spent: p.total_spent,
          vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
          name_color: p.active_name_color_id ? nameColorMap.get(p.active_name_color_id) : null,
        });
      });
      
      // Fetch group info
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, avatar_url, cover_url')
        .in('id', groupIds);
      
      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);
      
      // Fetch user's reactions to these posts
      const postIds = posts.map(p => p.id);
      const { data: userLikes } = await supabase
        .from('group_post_likes')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      const userReactionMap = new Map(userLikes?.map(l => [l.post_id, l.reaction_type]) || []);
      
      return posts
        .filter(post => {
          // Filter out hidden posts
          if (hiddenPostIds.has(post.id)) return false;
          // Filter out posts from hidden users
          if (hiddenUserIds.has(post.author_id)) return false;
          return true;
        })
        .map(post => {
          const author = profileMap.get(post.author_id);
          const group = groupMap.get(post.group_id);
          return {
            ...post,
            author_name: author?.full_name || null,
            author_avatar: author?.avatar_url || null,
            author_username: author?.username || null,
            author_nickname: author?.nickname || null,
            author_frame: author?.avatar_frame || null,
            author_is_verified: author?.is_verified || null,
            author_has_prime_boost: author?.has_prime_boost || null,
            author_total_spent: author?.total_spent || null,
            author_vip_level: author?.vip_level_name || null,
            author_name_color: author?.name_color || null,
            group_name: group?.name || null,
            group_avatar: group?.avatar_url || null,
            group_cover: group?.cover_url || null,
            user_reaction: userReactionMap.get(post.id) || null,
          } as JoinedGroupPost;
        });
    },
    enabled: !!user,
  });
}
