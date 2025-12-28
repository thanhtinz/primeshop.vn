import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'nudity' | 'false_info' | 'scam' | 'other';
export type PostType = 'user_post' | 'group_post' | 'shop_post';

// Hide a specific post
export function useHidePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, postType }: { postId: string; postType: PostType }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('hidden_posts')
        .insert({
          user_id: user.id,
          post_id: postId,
          post_type: postType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      toast.success('Đã ẩn bài viết');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.info('Bài viết đã được ẩn trước đó');
      } else {
        toast.error(error.message || 'Không thể ẩn bài viết');
      }
    },
  });
}

// Unhide a post
export function useUnhidePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, postType }: { postId: string; postType: PostType }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('hidden_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      toast.success('Đã bỏ ẩn bài viết');
    },
  });
}

// Hide posts from a specific user
export function useHideUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      hiddenUserId, 
      duration 
    }: { 
      hiddenUserId: string; 
      duration: '1day' | '1week' | '1month' | 'permanent';
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      let hiddenUntil: string | null = null;
      const now = new Date();
      
      switch (duration) {
        case '1day':
          hiddenUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case '1week':
          hiddenUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '1month':
          hiddenUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'permanent':
          hiddenUntil = null;
          break;
      }

      const { error } = await supabase
        .from('hidden_users')
        .upsert({
          user_id: user.id,
          hidden_user_id: hiddenUserId,
          hidden_until: hiddenUntil,
        }, { onConflict: 'user_id,hidden_user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      toast.success('Đã ẩn bài viết từ người dùng này');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ẩn người dùng');
    },
  });
}

// Report a post
export function useReportPost() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      postType, 
      reason, 
      description 
    }: { 
      postId: string; 
      postType: PostType; 
      reason: ReportReason; 
      description?: string;
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('post_reports')
        .insert({
          reporter_id: user.id,
          post_id: postId,
          post_type: postType,
          reason,
          description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.info('Bạn đã báo cáo bài viết này trước đó');
      } else {
        toast.error(error.message || 'Không thể gửi báo cáo');
      }
    },
  });
}

// Get user's hidden posts
export function useHiddenPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hidden-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hidden_posts')
        .select('post_id, post_type')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Get user's hidden users (not expired)
export function useHiddenUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hidden-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('hidden_users')
        .select('hidden_user_id, hidden_until')
        .eq('user_id', user.id)
        .or(`hidden_until.is.null,hidden_until.gt.${now}`);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}
