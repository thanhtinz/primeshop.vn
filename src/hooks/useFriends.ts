import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
  requester_profile?: any;
  addressee_profile?: any;
}

// Get friends list
export const useFriends = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['friends', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);

      if (error) throw error;

      // Get user profiles
      const friendIds = data?.flatMap(f => 
        f.requester_id === targetUserId ? [f.addressee_id] : [f.requester_id]
      ) || [];

      if (friendIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, banner_url, username')
        .in('user_id', friendIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data?.map(f => ({
        ...f,
        friend_profile: profileMap.get(f.requester_id === targetUserId ? f.addressee_id : f.requester_id)
      })) || [];
    },
    enabled: !!targetUserId
  });
};

// Get pending friend requests
export const usePendingFriendRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-friend-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get requester profiles
      const requesterIds = data?.map(f => f.requester_id) || [];
      if (requesterIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, username')
        .in('user_id', requesterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data?.map(f => ({
        ...f,
        requester_profile: profileMap.get(f.requester_id)
      })) || [];
    },
    enabled: !!user?.id
  });
};

// Check friendship status with specific user
export const useFriendshipStatus = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friendship-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) return null;

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId
  });
};

// Send friend request
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === addresseeId) throw new Error('Không thể tự kết bạn với bản thân');
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, addresseeId) => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status', user?.id, addresseeId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Đã gửi lời mời kết bạn');
    },
    onError: () => {
      toast.error('Không thể gửi lời mời kết bạn');
    }
  });
};

// Accept friend request
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      toast.success('Đã chấp nhận lời mời kết bạn');
    }
  });
};

// Reject friend request
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      toast.success('Đã từ chối lời mời kết bạn');
    }
  });
};

// Unfriend
export const useUnfriend = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`);

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Đã huỷ kết bạn');
    }
  });
};

// Cancel friend request
export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', user.id)
        .eq('addressee_id', targetUserId)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status', user?.id, targetUserId] });
      toast.success('Đã huỷ lời mời kết bạn');
    }
  });
};

// Get friends count
export const useFriendsCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['friends-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!targetUserId
  });
};
