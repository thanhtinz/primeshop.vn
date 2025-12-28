// Hooks for Friends - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: string;
  updatedAt: string;
  requesterProfile?: any;
  addresseeProfile?: any;
  friendProfile?: any;
  // Legacy mappings
  requester_id?: string;
  addressee_id?: string;
  created_at?: string;
  updated_at?: string;
  requester_profile?: any;
  addressee_profile?: any;
  friend_profile?: any;
}

const mapToLegacy = (f: any): Friendship => ({
  ...f,
  requester_id: f.requesterId,
  addressee_id: f.addresseeId,
  created_at: f.createdAt,
  updated_at: f.updatedAt,
  requester_profile: f.requesterProfile,
  addressee_profile: f.addresseeProfile,
  friend_profile: f.friendProfile,
});

// Get friends list
export const useFriends = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['friends', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await db
        .from<any>('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requesterId.eq.${targetUserId},addresseeId.eq.${targetUserId}`);

      if (error) throw error;

      // Get user profiles
      const friendIds = data?.flatMap((f: any) => 
        f.requesterId === targetUserId ? [f.addresseeId] : [f.requesterId]
      ) || [];

      if (friendIds.length === 0) return [];

      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, bannerUrl, username')
        .in('userId', friendIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        banner_url: p.bannerUrl,
        username: p.username,
      }]));

      return data?.map((f: any) => ({
        ...mapToLegacy(f),
        friend_profile: profileMap.get(f.requesterId === targetUserId ? f.addresseeId : f.requesterId),
        friendProfile: profileMap.get(f.requesterId === targetUserId ? f.addresseeId : f.requesterId),
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

      const { data, error } = await db
        .from<any>('friendships')
        .select('*')
        .eq('addresseeId', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Get requester profiles
      const requesterIds = data?.map((f: any) => f.requesterId) || [];
      if (requesterIds.length === 0) return [];

      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username')
        .in('userId', requesterIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
      }]));

      return data?.map((f: any) => ({
        ...mapToLegacy(f),
        requester_profile: profileMap.get(f.requesterId),
        requesterProfile: profileMap.get(f.requesterId),
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
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        return { status: 'none' as const, canSendRequest: false };
      }

      const { data, error } = await db
        .from<any>('friendships')
        .select('*')
        .or(`and(requesterId.eq.${user.id},addresseeId.eq.${targetUserId}),and(requesterId.eq.${targetUserId},addresseeId.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return { status: 'none' as const, canSendRequest: true };

      return {
        status: data.status as 'pending' | 'accepted' | 'rejected' | 'blocked',
        canSendRequest: false,
        isRequester: data.requesterId === user.id,
        friendship: mapToLegacy(data),
      };
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId
  });
};

// Send friend request
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === targetUserId) throw new Error('Không thể kết bạn với chính mình');

      const { data, error } = await db
        .from<any>('friendships')
        .insert({
          requesterId: user.id,
          addresseeId: targetUserId,
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['friendship-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      toast.success('Đã gửi lời mời kết bạn');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Accept friend request
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .eq('addresseeId', user.id)
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Đã chấp nhận lời mời kết bạn');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Reject friend request
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('friendships')
        .update({ status: 'rejected' })
        .eq('id', friendshipId)
        .eq('addresseeId', user.id)
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Đã từ chối lời mời kết bạn');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Remove friend
export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { error } = await db.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Đã hủy kết bạn');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Block user
export const useBlockUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Check if friendship exists
      const { data: existing } = await db
        .from<any>('friendships')
        .select('id')
        .or(`and(requesterId.eq.${user.id},addresseeId.eq.${targetUserId}),and(requesterId.eq.${targetUserId},addresseeId.eq.${user.id})`)
        .single();

      if (existing) {
        // Update existing friendship
        const { error } = await db
          .from<any>('friendships')
          .update({ status: 'blocked' })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new blocked relationship
        const { error } = await db
          .from<any>('friendships')
          .insert({
            requesterId: user.id,
            addresseeId: targetUserId,
            status: 'blocked',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Đã chặn người dùng');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Get friend count
export const useFriendCount = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['friend-count', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return 0;

      const { data, error } = await db
        .from<any>('friendships')
        .select('id')
        .eq('status', 'accepted')
        .or(`requesterId.eq.${targetUserId},addresseeId.eq.${targetUserId}`);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!targetUserId
  });
};

// Get mutual friends
export const useMutualFriends = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mutual-friends', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) return [];

      // Get current user's friends
      const { data: myFriendships } = await db
        .from<any>('friendships')
        .select('requesterId, addresseeId')
        .eq('status', 'accepted')
        .or(`requesterId.eq.${user.id},addresseeId.eq.${user.id}`);

      const myFriendIds = new Set(
        myFriendships?.flatMap((f: any) => 
          f.requesterId === user.id ? [f.addresseeId] : [f.requesterId]
        ) || []
      );

      // Get target user's friends
      const { data: theirFriendships } = await db
        .from<any>('friendships')
        .select('requesterId, addresseeId')
        .eq('status', 'accepted')
        .or(`requesterId.eq.${targetUserId},addresseeId.eq.${targetUserId}`);

      const theirFriendIds = new Set(
        theirFriendships?.flatMap((f: any) => 
          f.requesterId === targetUserId ? [f.addresseeId] : [f.requesterId]
        ) || []
      );

      // Find mutual
      const mutualIds = [...myFriendIds].filter(id => theirFriendIds.has(id));

      if (mutualIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl, username')
        .in('userId', mutualIds);

      return (profiles || []).map((p: any) => ({
        user_id: p.userId,
        full_name: p.fullName,
        email: p.email,
        avatar_url: p.avatarUrl,
        username: p.username,
      }));
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId
  });
};
