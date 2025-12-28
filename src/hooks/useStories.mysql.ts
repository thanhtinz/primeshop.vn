// Hooks for Stories - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  backgroundColor?: string;
  textContent?: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  userProfile?: any;
  hasViewed?: boolean;
  // Legacy mappings
  user_id?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  background_color?: string;
  text_content?: string;
  view_count?: number;
  created_at?: string;
  expires_at?: string;
  user_profile?: any;
  has_viewed?: boolean;
}

export interface StoryGroup {
  userId: string;
  userProfile: any;
  stories: Story[];
  hasUnviewed: boolean;
  // Legacy mappings
  user_id?: string;
  user_profile?: any;
  has_unviewed?: boolean;
}

const mapStoryToLegacy = (s: any): Story => ({
  ...s,
  user_id: s.userId,
  media_url: s.mediaUrl,
  media_type: s.mediaType,
  background_color: s.backgroundColor,
  text_content: s.textContent,
  view_count: s.viewCount,
  created_at: s.createdAt,
  expires_at: s.expiresAt,
  user_profile: s.userProfile,
  has_viewed: s.hasViewed,
});

// Fetch all active stories grouped by user
export const useStories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      const { data: stories, error } = await db
        .from<any>('user_stories')
        .select('*')
        .gt('expiresAt', new Date().toISOString())
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(stories?.map((s: any) => s.userId) || [])];
      const { data: profiles } = userIds.length > 0 ? await db
        .from<any>('profiles')
        .select('userId, fullName, username, avatarUrl')
        .in('userId', userIds) : { data: [] };

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        username: p.username,
        avatar_url: p.avatarUrl,
      }]));

      // Get viewed stories
      let viewedStoryIds: string[] = [];
      if (user?.id) {
        const { data: views } = await db
          .from<any>('story_views')
          .select('storyId')
          .eq('viewerId', user.id);
        viewedStoryIds = views?.map((v: any) => v.storyId) || [];
      }

      // Group stories by user
      const grouped = new Map<string, StoryGroup>();
      
      stories?.forEach((story: any) => {
        const profile = profileMap.get(story.userId);
        const hasViewed = viewedStoryIds.includes(story.id);
        
        if (!grouped.has(story.userId)) {
          grouped.set(story.userId, {
            userId: story.userId,
            user_id: story.userId,
            userProfile: profile || { full_name: null, username: null, avatar_url: null },
            user_profile: profile || { full_name: null, username: null, avatar_url: null },
            stories: [],
            hasUnviewed: false,
            has_unviewed: false
          });
        }
        
        const group = grouped.get(story.userId)!;
        group.stories.push({
          ...mapStoryToLegacy(story),
          userProfile: profile,
          user_profile: profile,
          hasViewed: hasViewed,
          has_viewed: hasViewed
        });
        
        if (!hasViewed) {
          group.hasUnviewed = true;
          group.has_unviewed = true;
        }
      });

      // Sort: current user first, then users with unviewed stories
      const result = Array.from(grouped.values());
      result.sort((a, b) => {
        if (a.userId === user?.id) return -1;
        if (b.userId === user?.id) return 1;
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      return result;
    },
    refetchInterval: 60000 // Refresh every minute
  });
};

// Create a story
export const useCreateStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      media_url: string;
      media_type?: 'image' | 'video';
      caption?: string;
      background_color?: string;
      text_content?: string;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

      const { data: story, error } = await db
        .from<any>('user_stories')
        .insert({
          userId: user.id,
          mediaUrl: data.media_url,
          mediaType: data.media_type || 'image',
          caption: data.caption,
          backgroundColor: data.background_color,
          textContent: data.text_content,
          viewCount: 0,
          expiresAt: expiresAt.toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapStoryToLegacy(story);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Đã đăng story');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// Mark story as viewed
export const useViewStory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user?.id) return;

      // Check if already viewed
      const { data: existing } = await db
        .from<any>('story_views')
        .select('id')
        .eq('storyId', storyId)
        .eq('viewerId', user.id)
        .single();

      if (!existing) {
        await db
          .from('story_views')
          .insert({
            storyId,
            viewerId: user.id,
          });

        // Increment view count
        const { data: story } = await db
          .from<any>('user_stories')
          .select('viewCount')
          .eq('id', storyId)
          .single();

        if (story) {
          await db
            .from('user_stories')
            .update({ viewCount: (story.viewCount || 0) + 1 })
            .eq('id', storyId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    }
  });
};

// Delete a story
export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await db
        .from('user_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Đã xóa story');
    }
  });
};

// React to story
export const useReactToStory = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, emoji }: { storyId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Delete existing reaction first
      await db
        .from('story_reactions')
        .delete()
        .eq('storyId', storyId)
        .eq('userId', user.id);

      // Insert new reaction
      const { error } = await db
        .from('story_reactions')
        .insert({
          storyId,
          userId: user.id,
          emoji
        });

      if (error) throw error;
    }
  });
};
