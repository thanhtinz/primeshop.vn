// Hooks for Seller Chat - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface SellerChatRoom {
  id: string;
  userId: string;
  targetUserId: string | null;
  subject: string | null;
  status: string;
  roomType: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  userProfile?: {
    userId: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  lastMessage?: string;
  unreadCount?: number;
  // Legacy mappings
  user_id?: string;
  target_user_id?: string | null;
  room_type?: string | null;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string | null;
  user_profile?: any;
  unread_count?: number;
}

export interface SellerChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType: string;
  message: string;
  attachments: any;
  isRead: boolean;
  createdAt: string;
  // Legacy mappings
  room_id?: string;
  sender_id?: string;
  sender_type?: string;
  is_read?: boolean;
  created_at?: string;
}

const mapRoomToLegacy = (r: any): SellerChatRoom => ({
  ...r,
  user_id: r.userId,
  target_user_id: r.targetUserId,
  room_type: r.roomType,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
  last_message_at: r.lastMessageAt,
  user_profile: r.userProfile ? {
    user_id: r.userProfile.userId,
    full_name: r.userProfile.fullName,
    avatar_url: r.userProfile.avatarUrl,
    email: r.userProfile.email,
  } : undefined,
  unread_count: r.unreadCount,
});

const mapMessageToLegacy = (m: any): SellerChatMessage => ({
  ...m,
  room_id: m.roomId,
  sender_id: m.senderId,
  sender_type: m.senderType,
  is_read: m.isRead,
  created_at: m.createdAt,
});

// Get chat rooms where users messaged the seller
export const useSellerChatRooms = (sellerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-chat-rooms', sellerId],
    queryFn: async () => {
      if (!sellerId || !user?.id) return [];

      // Get chat rooms filtered by seller_id
      const { data: rooms, error } = await db
        .from<any>('chat_rooms')
        .select('*')
        .eq('sellerId', sellerId)
        .eq('roomType', 'seller')
        .order('lastMessageAt', { ascending: false });

      if (error) throw error;
      if (!rooms?.length) return [];

      // Get user profiles (the users who initiated chat)
      const userIds = [...new Set(rooms.map((r: any) => r.userId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('userId, fullName, email, avatarUrl')
        .in('userId', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.userId, p]));

      // Get last messages and unread counts
      const roomsWithDetails = await Promise.all(
        rooms.map(async (room: any) => {
          // Get last message
          const { data: messages } = await db
            .from<any>('chat_messages')
            .select('message')
            .eq('roomId', room.id)
            .order('createdAt', { ascending: false })
            .limit(1);

          // Get unread count
          const { data: unreadMessages } = await db
            .from<any>('chat_messages')
            .select('id')
            .eq('roomId', room.id)
            .eq('isRead', false)
            .neq('senderId', user.id);

          return {
            ...room,
            userProfile: profileMap.get(room.userId),
            lastMessage: messages?.[0]?.message,
            unreadCount: unreadMessages?.length || 0,
          };
        })
      );

      return roomsWithDetails.map(mapRoomToLegacy) as SellerChatRoom[];
    },
    enabled: !!sellerId && !!user?.id,
  });
};

// Get messages for seller chat room
export const useSellerChatMessages = (roomId?: string) => {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = realtime.subscribe(`seller-chat-${roomId}`, {
      event: '*',
      table: 'chat_messages',
      filter: { roomId },
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['seller-chat-messages', roomId] });
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['seller-chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await db
        .from<any>('chat_messages')
        .select('*')
        .eq('roomId', roomId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapMessageToLegacy) as SellerChatMessage[];
    },
    enabled: !!roomId,
  });
};

// Send message as seller/shop
export const useSendSellerMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roomId,
      message,
      attachments,
    }: {
      roomId: string;
      message: string;
      attachments?: any;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from('chat_messages')
        .insert({
          roomId,
          senderId: user.id,
          senderType: 'shop', // Mark as shop message
          message: message.trim(),
          attachments,
        })
        .select()
        .single();

      if (error) throw error;

      // Update room last_message_at
      await db
        .from('chat_rooms')
        .update({ lastMessageAt: new Date().toISOString() })
        .eq('id', roomId);

      return mapMessageToLegacy(data);
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['seller-chat-rooms'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi tin nhắn');
    },
  });
};

// Mark messages as read
export const useMarkSellerMessagesRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user?.id) return;

      const { error } = await db
        .from('chat_messages')
        .update({ isRead: true })
        .eq('roomId', roomId)
        .neq('senderId', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-chat-rooms'] });
    },
  });
};

// Get total unread count for seller
export const useSellerUnreadCount = (sellerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-unread-count', sellerId],
    queryFn: async () => {
      if (!user?.id || !sellerId) return 0;

      // Get all rooms for this specific seller
      const { data: rooms } = await db
        .from<any>('chat_rooms')
        .select('id')
        .eq('sellerId', sellerId)
        .eq('roomType', 'seller');

      if (!rooms?.length) return 0;

      const roomIds = rooms.map((r: any) => r.id);

      let totalUnread = 0;
      for (const roomId of roomIds) {
        const { data: unreadMessages } = await db
          .from<any>('chat_messages')
          .select('id')
          .eq('roomId', roomId)
          .eq('isRead', false)
          .neq('senderId', user.id);

        totalUnread += unreadMessages?.length || 0;
      }

      return totalUnread;
    },
    enabled: !!sellerId && !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
