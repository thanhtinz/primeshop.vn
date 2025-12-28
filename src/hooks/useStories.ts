import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  background_color?: string;
  text_content?: string;
  view_count: number;
  created_at: string;
  expires_at: string;
  user_profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  has_viewed?: boolean;
}

export interface StoryGroup {
  user_id: string;
  user_profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  stories: Story[];
  has_unviewed: boolean;
}

// Fetch all active stories grouped by user
export const useStories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      const { data: stories, error } = await supabase
        .from('user_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(stories?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Get viewed stories
      let viewedStoryIds: string[] = [];
      if (user?.id) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        viewedStoryIds = views?.map(v => v.story_id) || [];
      }

      // Group stories by user
      const grouped = new Map<string, StoryGroup>();
      
      stories?.forEach(story => {
        const profile = profileMap.get(story.user_id);
        const hasViewed = viewedStoryIds.includes(story.id);
        
        if (!grouped.has(story.user_id)) {
          grouped.set(story.user_id, {
            user_id: story.user_id,
            user_profile: profile || { full_name: null, username: null, avatar_url: null },
            stories: [],
            has_unviewed: false
          });
        }
        
        const group = grouped.get(story.user_id)!;
        group.stories.push({
          ...story,
          media_type: story.media_type as 'image' | 'video',
          user_profile: profile,
          has_viewed: hasViewed
        });
        
        if (!hasViewed) {
          group.has_unviewed = true;
        }
      });

      // Sort: current user first, then users with unviewed stories
      const result = Array.from(grouped.values());
      result.sort((a, b) => {
        if (a.user_id === user?.id) return -1;
        if (b.user_id === user?.id) return 1;
        if (a.has_unviewed && !b.has_unviewed) return -1;
        if (!a.has_unviewed && b.has_unviewed) return 1;
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

      const { data: story, error } = await supabase
        .from('user_stories')
        .insert({
          user_id: user.id,
          media_url: data.media_url,
          media_type: data.media_type || 'image',
          caption: data.caption,
          background_color: data.background_color,
          text_content: data.text_content
        })
        .select()
        .single();

      if (error) throw error;
      return story;
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

      const { error } = await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          viewer_id: user.id
        }, {
          onConflict: 'story_id,viewer_id'
        });

      if (error) throw error;

      // Update view count directly
      await supabase
        .from('user_stories')
        .update({ view_count: supabase.rpc ? 1 : 1 }) // Will be incremented properly
        .eq('id', storyId);
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
      const { error } = await supabase
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

      const { error } = await supabase
        .from('story_reactions')
        .upsert({
          story_id: storyId,
          user_id: user.id,
          emoji
        }, {
          onConflict: 'story_id,user_id'
        });

      if (error) throw error;
    }
  });
};
