// Hooks for Follow - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Follow a user
export const useFollow = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === targetUserId) throw new Error('Không thể tự theo dõi bản thân');
      
      const { data, error } = await db
        .from<any>('follows')
        .insert({
          followerId: user.id,
          followingId: targetUserId
        })
        .select('*')
        .single();

      if (error) throw error;
      
      return {
        ...data,
        follower_id: data.followerId,
        following_id: data.followingId,
      };
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Đã theo dõi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Unfollow a user
export const useUnfollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await db
        .from('follows')
        .delete()
        .eq('followerId', user.id)
        .eq('followingId', targetUserId);

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success('Đã bỏ theo dõi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Check if following
export const useFollowStatus = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) return false;

      const { data, error } = await db
        .from<any>('follows')
        .select('id')
        .eq('followerId', user.id)
        .eq('followingId', targetUserId)
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

      const { data, error } = await db
        .from<any>('follows')
        .select('id')
        .eq('followingId', targetUserId);

      if (error) return 0;
      return data?.length || 0;
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

      const { data, error } = await db
        .from<any>('follows')
        .select('id')
        .eq('followerId', targetUserId);

      if (error) return 0;
      return data?.length || 0;
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

      const { data: follows, error } = await db
        .from<any>('follows')
        .select('followerId')
        .eq('followingId', targetUserId);

      if (error) throw error;

      const followerIds = follows?.map((f: any) => f.followerId) || [];
      if (followerIds.length === 0) return [];

      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username')
        .in('userId', followerIds);

      return (profiles || []).map((p: any) => ({
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
      }));
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

      const { data: follows, error } = await db
        .from<any>('follows')
        .select('followingId')
        .eq('followerId', targetUserId);

      if (error) throw error;

      const followingIds = follows?.map((f: any) => f.followingId) || [];
      if (followingIds.length === 0) return [];

      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username')
        .in('userId', followingIds);

      return (profiles || []).map((p: any) => ({
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
      }));
    },
    enabled: !!targetUserId
  });
};

// Toggle follow
export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === targetUserId) throw new Error('Không thể tự theo dõi bản thân');

      // Check if already following
      const { data: existing } = await db
        .from<any>('follows')
        .select('id')
        .eq('followerId', user.id)
        .eq('followingId', targetUserId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        await db.from('follows').delete().eq('id', existing.id);
        return { action: 'unfollowed' };
      } else {
        // Follow
        await db
          .from<any>('follows')
          .insert({
            followerId: user.id,
            followingId: targetUserId
          });
        return { action: 'followed' };
      }
    },
    onSuccess: (result, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-count', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      toast.success(result.action === 'followed' ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
