import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyNewFollower } from '@/services/notificationService';

// Follow a user
export const useFollow = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === targetUserId) throw new Error('Không thể tự theo dõi bản thân');
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        })
        .select()
        .single();

      if (error) throw error;
      
      // Create notification for the followed user
      const followerName = profile?.full_name || profile?.email || 'Người dùng';
      notifyNewFollower(targetUserId, followerName);
      
      return data;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-count', user?.id] });
      toast.success('Đã theo dõi');
    }
  });
};

// Unfollow a user
export const useUnfollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-count', user?.id] });
      toast.success('Đã bỏ theo dõi');
    }
  });
};

// Check if following
export const useFollowStatus = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId
  });
};

// Get followers count
export const useFollowersCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['followers-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!targetUserId
  });
};

// Get following count
export const useFollowingCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['following-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!targetUserId
  });
};

// Get followers list
export const useFollowers = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', targetUserId);

      if (error) throw error;

      const followerIds = data?.map(f => f.follower_id) || [];
      if (followerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username')
        .in('user_id', followerIds);

      return profiles || [];
    },
    enabled: !!targetUserId
  });
};

// Get following list
export const useFollowing = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['following', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', targetUserId);

      if (error) throw error;

      const followingIds = data?.map(f => f.following_id) || [];
      if (followingIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username')
        .in('user_id', followingIds);

      return profiles || [];
    },
    enabled: !!targetUserId
  });
};
