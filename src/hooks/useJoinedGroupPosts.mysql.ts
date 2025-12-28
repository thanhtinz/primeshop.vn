// Hooks for Joined Group Posts - MySQL version
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export interface JoinedGroupPost {
  id: string;
  groupId: string;
  authorId: string;
  postType: string;
  title: string | null;
  content: string;
  mediaUrls: string[] | null;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isAnonymous: boolean;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
  authorUsername: string | null;
  authorNickname: string | null;
  authorFrame: {
    id: string;
    imageUrl: string;
    avatarBorderRadius: string | null;
  } | null;
  authorIsVerified: boolean | null;
  authorHasPrimeBoost: boolean | null;
  authorTotalSpent: number | null;
  authorVipLevel: string | null;
  authorNameColor: {
    isGradient: boolean;
    colorValue: string | null;
    gradientValue: string | null;
  } | null;
  groupName: string | null;
  groupAvatar: string | null;
  groupCover: string | null;
  userReaction: string | null;
  // Legacy mappings
  group_id?: string;
  author_id?: string;
  post_type?: string;
  media_urls?: string[] | null;
  like_count?: number;
  comment_count?: number;
  is_pinned?: boolean;
  is_anonymous?: boolean;
  created_at?: string;
  author_name?: string | null;
  author_avatar?: string | null;
  author_username?: string | null;
  author_nickname?: string | null;
  author_frame?: any | null;
  author_is_verified?: boolean | null;
  author_has_prime_boost?: boolean | null;
  author_total_spent?: number | null;
  author_vip_level?: string | null;
  author_name_color?: any | null;
  group_name?: string | null;
  group_avatar?: string | null;
  group_cover?: string | null;
  user_reaction?: string | null;
}

export function useJoinedGroupPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['joined-group-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get groups user has joined
      const { data: memberships } = await db
        .from<any>('group_members')
        .select('groupId')
        .eq('userId', user.id)
        .eq('isActive', true);

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m: any) => m.groupId);

      // Get hidden posts
      const { data: hiddenPosts } = await db
        .from<any>('hidden_posts')
        .select('postId')
        .eq('userId', user.id)
        .eq('postType', 'group_post');

      const hiddenPostIds = new Set(hiddenPosts?.map((h: any) => h.postId) || []);

      // Get hidden users (not expired)
      const now = new Date().toISOString();
      const { data: hiddenUsers } = await db
        .from<any>('hidden_users')
        .select('hiddenUserId, hiddenUntil')
        .eq('userId', user.id);

      const hiddenUserIds = new Set(
        (hiddenUsers || [])
          .filter((h: any) => !h.hiddenUntil || h.hiddenUntil > now)
          .map((h: any) => h.hiddenUserId)
      );

      // Fetch posts
      const { data: posts, error } = await db
        .from<any>('group_posts')
        .select('*')
        .in('groupId', groupIds)
        .eq('isHidden', false)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Filter out hidden posts and users
      const filteredPosts = posts.filter(
        (p: any) => !hiddenPostIds.has(p.id) && !hiddenUserIds.has(p.authorId)
      );

      // Fetch author profiles
      const authorIds = [...new Set(filteredPosts.map((p: any) => p.authorId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl, username, nickname, avatarFrameId, isVerified, hasPrimeBoost, totalSpent, vipLevelId, activeNameColorId')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      // Fetch groups info
      const { data: groups } = await db
        .from<any>('groups')
        .select('id, name, avatarUrl, coverUrl')
        .in('id', groupIds);

      const groupMap = new Map(groups?.map((g: any) => [g.id, g]) || []);

      // Fetch VIP levels
      const vipLevelIds = [...new Set(profiles?.map((p: any) => p.vipLevelId).filter(Boolean) || [])];
      let vipLevelMap = new Map<string, string>();
      if (vipLevelIds.length > 0) {
        const { data: vipLevels } = await db
          .from<any>('vip_levels')
          .select('id, name')
          .in('id', vipLevelIds);
        vipLevelMap = new Map(vipLevels?.map((v: any) => [v.id, v.name]) || []);
      }

      // Fetch avatar frames
      const frameIds = [...new Set(profiles?.map((p: any) => p.avatarFrameId).filter(Boolean) || [])];
      let frameMap = new Map<string, any>();
      if (frameIds.length > 0) {
        const { data: frames } = await db
          .from<any>('avatar_frames')
          .select('id, imageUrl, avatarBorderRadius')
          .in('id', frameIds);
        frameMap = new Map(frames?.map((f: any) => [f.id, f]) || []);
      }

      // Fetch name colors
      const nameColorIds = [...new Set(profiles?.map((p: any) => p.activeNameColorId).filter(Boolean) || [])];
      let nameColorMap = new Map<string, any>();
      if (nameColorIds.length > 0) {
        const { data: nameColors } = await db
          .from<any>('name_colors')
          .select('id, isGradient, colorValue, gradientValue')
          .in('id', nameColorIds);
        nameColorMap = new Map(nameColors?.map((c: any) => [c.id, c]) || []);
      }

      // Fetch user reactions
      const { data: reactions } = await db
        .from<any>('group_post_reactions')
        .select('postId, reactionType')
        .eq('userId', user.id)
        .in('postId', filteredPosts.map((p: any) => p.id));

      const reactionMap = new Map(reactions?.map((r: any) => [r.postId, r.reactionType]) || []);

      return filteredPosts.map((post: any) => {
        const profile = profileMap.get(post.authorId);
        const group = groupMap.get(post.groupId);
        const frame = profile?.avatarFrameId ? frameMap.get(profile.avatarFrameId) : null;
        const nameColor = profile?.activeNameColorId ? nameColorMap.get(profile.activeNameColorId) : null;
        const vipLevel = profile?.vipLevelId ? vipLevelMap.get(profile.vipLevelId) : null;

        return {
          id: post.id,
          groupId: post.groupId,
          authorId: post.authorId,
          postType: post.postType,
          title: post.title,
          content: post.content,
          mediaUrls: post.mediaUrls,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          isPinned: post.isPinned,
          isAnonymous: post.isAnonymous,
          createdAt: post.createdAt,
          authorName: profile?.fullName || null,
          authorAvatar: profile?.avatarUrl || null,
          authorUsername: profile?.username || null,
          authorNickname: profile?.nickname || null,
          authorFrame: frame,
          authorIsVerified: profile?.isVerified || false,
          authorHasPrimeBoost: profile?.hasPrimeBoost || false,
          authorTotalSpent: profile?.totalSpent || 0,
          authorVipLevel: vipLevel,
          authorNameColor: nameColor,
          groupName: group?.name || null,
          groupAvatar: group?.avatarUrl || null,
          groupCover: group?.coverUrl || null,
          userReaction: reactionMap.get(post.id) || null,
          // Legacy mappings
          group_id: post.groupId,
          author_id: post.authorId,
          post_type: post.postType,
          media_urls: post.mediaUrls,
          like_count: post.likeCount || 0,
          comment_count: post.commentCount || 0,
          is_pinned: post.isPinned,
          is_anonymous: post.isAnonymous,
          created_at: post.createdAt,
          author_name: profile?.fullName || null,
          author_avatar: profile?.avatarUrl || null,
          author_username: profile?.username || null,
          author_nickname: profile?.nickname || null,
          author_frame: frame ? {
            id: frame.id,
            image_url: frame.imageUrl,
            avatar_border_radius: frame.avatarBorderRadius,
          } : null,
          author_is_verified: profile?.isVerified || false,
          author_has_prime_boost: profile?.hasPrimeBoost || false,
          author_total_spent: profile?.totalSpent || 0,
          author_vip_level: vipLevel,
          author_name_color: nameColor ? {
            is_gradient: nameColor.isGradient,
            color_value: nameColor.colorValue,
            gradient_value: nameColor.gradientValue,
          } : null,
          group_name: group?.name || null,
          group_avatar: group?.avatarUrl || null,
          group_cover: group?.coverUrl || null,
          user_reaction: reactionMap.get(post.id) || null,
        };
      }) as JoinedGroupPost[];
    },
    enabled: !!user,
  });
}
