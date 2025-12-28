// Hooks for Chat System - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ChatRoom {
  id: string;
  userId: string;
  adminId?: string;
  targetUserId?: string;
  roomType: 'admin' | 'user';
  status: 'open' | 'closed';
  subject?: string;
  lastMessageAt: string;
  createdAt: string;
  userProfile?: any;
  targetUserProfile?: any;
  // Legacy mappings
  user_id?: string;
  admin_id?: string;
  target_user_id?: string;
  room_type?: 'admin' | 'user';
  last_message_at?: string;
  created_at?: string;
  user_profile?: any;
  target_user_profile?: any;
}

export interface ChatAttachment {
  type: 'image' | 'sticker';
  url?: string;
  sticker?: {
    id: string;
    url: string;
    name: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderType: 'user' | 'admin';
  message: string;
  isRead: boolean;
  createdAt: string;
  attachments?: ChatAttachment[];
  // Legacy mappings
  room_id?: string;
  sender_id?: string;
  sender_type?: 'user' | 'admin';
  is_read?: boolean;
  created_at?: string;
}

const mapRoomToLegacy = (r: any): ChatRoom => ({
  ...r,
  user_id: r.userId,
  admin_id: r.adminId,
  target_user_id: r.targetUserId,
  room_type: r.roomType,
  last_message_at: r.lastMessageAt,
  created_at: r.createdAt,
  user_profile: r.userProfile,
  target_user_profile: r.targetUserProfile,
});

const mapMessageToLegacy = (m: any): ChatMessage => ({
  ...m,
  room_id: m.roomId,
  sender_id: m.senderId,
  sender_type: m.senderType,
  is_read: m.isRead,
  created_at: m.createdAt,
});

// Get user's chat rooms
export const useUserChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get rooms where user is participant
      const { data: memberRooms } = await db
        .from<any>('chat_room_members')
        .select('roomId')
        .eq('userId', user.id);

      const memberRoomIds = memberRooms?.map((m: any) => m.roomId) || [];

      // Get all rooms
      let query = db
        .from<any>('chat_rooms')
        .select('*')
        .order('lastMessageAt', { ascending: false });

      if (memberRoomIds.length > 0) {
        query = query.or(`userId.eq.${user.id},targetUserId.eq.${user.id},id.in.(${memberRoomIds.join(',')})`);
      } else {
        query = query.or(`userId.eq.${user.id},targetUserId.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get profiles
      const userIds = [...new Set(data?.flatMap((r: any) => [r.userId, r.targetUserId].filter(Boolean)) || [])] as string[];
      
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('userId, fullName, email, avatarUrl')
          .in('userId', userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
          user_id: p.userId,
          full_name: p.fullName,
          email: p.email,
          avatar_url: p.avatarUrl,
        }]));

        return (data || []).map((room: any) => ({
          ...mapRoomToLegacy(room),
          user_profile: profileMap.get(room.userId),
          target_user_profile: room.targetUserId ? profileMap.get(room.targetUserId) : null,
        }));
      }

      return (data || []).map(mapRoomToLegacy);
    },
    enabled: !!user?.id
  });
};

// Create admin chat room
export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subject?: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('chat_rooms')
        .insert({
          userId: user.id,
          subject,
          roomType: 'admin',
          status: 'open',
          lastMessageAt: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapRoomToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

// Create user-to-user chat room
export const useCreateUserChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, subject }: { targetUserId: string; subject?: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      if (user.id === targetUserId) throw new Error('Không thể chat với chính mình');

      // Check existing room
      const { data: existing } = await db
        .from<any>('chat_rooms')
        .select('*')
        .eq('roomType', 'user')
        .or(`and(userId.eq.${user.id},targetUserId.eq.${targetUserId}),and(userId.eq.${targetUserId},targetUserId.eq.${user.id})`)
        .single();

      if (existing) {
        return mapRoomToLegacy(existing);
      }

      // Create new room
      const { data, error } = await db
        .from<any>('chat_rooms')
        .insert({
          userId: user.id,
          targetUserId,
          subject,
          roomType: 'user',
          status: 'open',
          lastMessageAt: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapRoomToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

// Get messages for a room
export const useChatMessages = (roomId: string) => {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('chat_messages')
        .select('*')
        .eq('roomId', roomId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapMessageToLegacy);
    },
    enabled: !!roomId
  });
};

// Send message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      message, 
      attachments 
    }: { 
      roomId: string; 
      message: string;
      attachments?: ChatAttachment[];
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('chat_messages')
        .insert({
          roomId,
          senderId: user.id,
          senderType: 'user',
          message,
          attachments: attachments || [],
          isRead: false,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update room's last message time
      await db
        .from('chat_rooms')
        .update({ lastMessageAt: new Date().toISOString() })
        .eq('id', roomId);

      return mapMessageToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

// Mark messages as read
export const useMarkMessagesRead = () => {
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
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });
};

// Get unread count
export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get rooms user is in
      const { data: rooms } = await db
        .from<any>('chat_rooms')
        .select('id')
        .or(`userId.eq.${user.id},targetUserId.eq.${user.id}`);

      const roomIds = rooms?.map((r: any) => r.id) || [];
      if (roomIds.length === 0) return 0;

      // Count unread messages
      const { data } = await db
        .from<any>('chat_messages')
        .select('id')
        .in('roomId', roomIds)
        .eq('isRead', false)
        .neq('senderId', user.id);

      return data?.length || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Real-time subscription for messages
export const useChatSubscription = (roomId: string, onNewMessage: (message: ChatMessage) => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to real-time updates
    const unsubscribe = realtime.subscribe(`chat_messages:${roomId}`, (payload: any) => {
      if (payload.type === 'INSERT') {
        const message = mapMessageToLegacy(payload.new);
        onNewMessage(message);
        queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, onNewMessage, queryClient]);
};

// Close chat room
export const useCloseChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await db
        .from('chat_rooms')
        .update({ status: 'closed' })
        .eq('id', roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
      toast.success('Đã đóng cuộc hội thoại');
    }
  });
};

// Admin: Get all chat rooms
export const useAdminChatRooms = () => {
  return useQuery({
    queryKey: ['admin-chat-rooms'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('chat_rooms')
        .select('*')
        .eq('roomType', 'admin')
        .order('lastMessageAt', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const userIds = data?.map((r: any) => r.userId).filter(Boolean) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('userId, fullName, email, avatarUrl')
          .in('userId', userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
          user_id: p.userId,
          full_name: p.fullName,
          email: p.email,
          avatar_url: p.avatarUrl,
        }]));

        return (data || []).map((room: any) => ({
          ...mapRoomToLegacy(room),
          user_profile: profileMap.get(room.userId),
        }));
      }

      return (data || []).map(mapRoomToLegacy);
    }
  });
};

// Admin: Send message
export const useAdminSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      message,
      attachments 
    }: { 
      roomId: string; 
      message: string;
      attachments?: ChatAttachment[];
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<any>('chat_messages')
        .insert({
          roomId,
          senderId: user.id,
          senderType: 'admin',
          message,
          attachments: attachments || [],
          isRead: false,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update room
      await db
        .from('chat_rooms')
        .update({ 
          lastMessageAt: new Date().toISOString(),
          adminId: user.id,
        })
        .eq('id', roomId);

      return mapMessageToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
    }
  });
};
