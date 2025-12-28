// MySQL version - usePostModeration
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ReportReason = 
  | 'spam' 
  | 'inappropriate' 
  | 'harassment' 
  | 'misinformation' 
  | 'copyright' 
  | 'violence' 
  | 'hate_speech'
  | 'other';

type PostType = 'user_post' | 'group_post' | 'shop_post';

interface HiddenPost {
  post_id: string;
  post_type: PostType;
}

interface HiddenUser {
  hidden_user_id: string;
  hidden_until: string | null;
}

// Legacy mappings
function mapHiddenPost(data: any): HiddenPost {
  if (!data) return data;
  return {
    post_id: data.postId || data.post_id,
    post_type: data.postType || data.post_type,
  };
}

function mapHiddenUser(data: any): HiddenUser {
  if (!data) return data;
  return {
    hidden_user_id: data.hiddenUserId || data.hidden_user_id,
    hidden_until: data.hiddenUntil || data.hidden_until,
  };
}

// Hide a post
export function useHidePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, postType }: { postId: string; postType: PostType }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await apiClient.from('hidden_posts')
        .upsert({
          user_id: user.id,
          post_id: postId,
          post_type: postType,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['hidden-posts'] });
      toast.success('Đã ẩn bài viết');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ẩn bài viết');
    },
  });
}

// Unhide a post
export function useUnhidePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await apiClient.from('hidden_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['hidden-posts'] });
      toast.success('Đã bỏ ẩn bài viết');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể bỏ ẩn bài viết');
    },
  });
}

// Hide a user (with duration option)
export function useHideUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      hiddenUserId, 
      duration 
    }: { 
      hiddenUserId: string; 
      duration?: 'day' | 'week' | 'month' | 'forever';
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      let hiddenUntil: string | null = null;
      if (duration && duration !== 'forever') {
        const date = new Date();
        if (duration === 'day') date.setDate(date.getDate() + 1);
        else if (duration === 'week') date.setDate(date.getDate() + 7);
        else if (duration === 'month') date.setMonth(date.getMonth() + 1);
        hiddenUntil = date.toISOString();
      }

      const { error } = await apiClient.from('hidden_users')
        .upsert({
          user_id: user.id,
          hidden_user_id: hiddenUserId,
          hidden_until: hiddenUntil,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['hidden-users'] });
      toast.success('Đã ẩn bài viết từ người dùng này');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ẩn người dùng');
    },
  });
}

// Unhide a user
export function useUnhideUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hiddenUserId }: { hiddenUserId: string }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await apiClient.from('hidden_users')
        .delete()
        .eq('user_id', user.id)
        .eq('hidden_user_id', hiddenUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
      queryClient.invalidateQueries({ queryKey: ['hidden-users'] });
      toast.success('Đã bỏ ẩn người dùng');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể bỏ ẩn người dùng');
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

      const { error } = await apiClient.from('post_reports')
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

      const { data, error } = await apiClient.from('hidden_posts')
        .select('post_id, post_type')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(mapHiddenPost);
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
      
      const { data, error } = await apiClient.from('hidden_users')
        .select('hidden_user_id, hidden_until')
        .eq('user_id', user.id)
        .or(`hidden_until.is.null,hidden_until.gt.${now}`);

      if (error) throw error;
      return (data || []).map(mapHiddenUser);
    },
    enabled: !!user,
  });
}

// Check if a post is hidden
export function useIsPostHidden(postId: string) {
  const { data: hiddenPosts } = useHiddenPosts();
  return hiddenPosts?.some(p => p.post_id === postId) ?? false;
}

// Check if a user is hidden
export function useIsUserHidden(userId: string) {
  const { data: hiddenUsers } = useHiddenUsers();
  return hiddenUsers?.some(u => u.hidden_user_id === userId) ?? false;
}
