// MySQL version - useLiveChat
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, socketManager } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ChatRoom {
  id: string;
  user_id: string;
  admin_id?: string;
  status: 'open' | 'closed';
  subject?: string;
  last_message_at: string;
  created_at: string;
  user_profile?: any;
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
  room_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
  attachments?: ChatAttachment[];
}

// Legacy mappings
function mapChatRoom(data: any): ChatRoom {
  if (!data) return data;
  return {
    id: data.id,
    user_id: data.userId || data.user_id,
    admin_id: data.adminId || data.admin_id,
    status: data.status,
    subject: data.subject,
    last_message_at: data.lastMessageAt || data.last_message_at,
    created_at: data.createdAt || data.created_at,
    user_profile: data.user_profile || data.userProfile,
  };
}

function mapChatMessage(data: any): ChatMessage {
  if (!data) return data;
  return {
    id: data.id,
    room_id: data.roomId || data.room_id,
    sender_id: data.senderId || data.sender_id,
    sender_type: data.senderType || data.sender_type,
    message: data.message,
    is_read: data.isRead ?? data.is_read ?? false,
    created_at: data.createdAt || data.created_at,
    attachments: data.attachments || [],
  };
}

// User hooks
export const useUserChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await apiClient.from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapChatRoom);
    },
    enabled: !!user?.id
  });
};

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subject?: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await apiClient.from('chat_rooms')
        .insert({
          user_id: user.id,
          subject
        })
        .select()
        .single();

      if (error) throw error;
      return mapChatRoom(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

export const useChatMessages = (roomId: string) => {
  const queryClient = useQueryClient();

  // Subscribe to real-time messages via Socket.io
  useEffect(() => {
    if (!roomId) return;

    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit('join-chat-room', { roomId });

      const handleNewMessage = (newMessage: any) => {
        const mapped = mapChatMessage(newMessage);
        queryClient.setQueryData<ChatMessage[]>(['chat-messages', roomId], (old) => {
          if (!old) return [mapped];
          if (old.some(m => m.id === mapped.id)) return old;
          return [...old, mapped];
        });
      };

      socket.on('new-chat-message', handleNewMessage);

      return () => {
        socket.emit('leave-chat-room', { roomId });
        socket.off('new-chat-message', handleNewMessage);
      };
    }
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapChatMessage);
    },
    enabled: !!roomId
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, message, senderType = 'user', attachments = [] }: { roomId: string; message: string; senderType?: 'user' | 'admin'; attachments?: ChatAttachment[] }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const insertData = {
        room_id: roomId,
        sender_id: user.id,
        sender_type: senderType,
        message,
        attachments
      };

      const { data, error } = await apiClient.from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update room's last_message_at
      await apiClient.from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

      // Send email notifications via backend
      try {
        await apiClient.post('/notifications/chat', {
          roomId,
          message: message.substring(0, 200),
          senderType,
          senderName: profile?.full_name || user.email || 'User'
        });
      } catch (err) {
        console.error('Failed to send chat notification:', err);
      }

      return mapChatMessage(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
    }
  });
};

export const useMarkMessagesRead = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user?.id) return;

      const { error } = await apiClient.from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id);

      if (error) throw error;
    }
  });
};

// Realtime notification hook for users
export const useChatRealtimeNotification = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleNewMessage = async (newMessage: any) => {
      const mapped = mapChatMessage(newMessage);
      
      // Only notify if message is from admin (not from current user)
      if (mapped.sender_type === 'admin' && mapped.sender_id !== user.id) {
        // Check if this room belongs to current user
        const { data: room } = await apiClient.from('chat_rooms')
          .select('user_id')
          .eq('id', mapped.room_id)
          .single();
        
        if (room?.user_id === user.id) {
          toast.info('Bạn có tin nhắn mới từ hỗ trợ viên!', {
            description: mapped.message.substring(0, 50) + (mapped.message.length > 50 ? '...' : ''),
            duration: 5000,
          });
          
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
        }
      }
    };

    socket.on('new-chat-message', handleNewMessage);

    return () => {
      socket.off('new-chat-message', handleNewMessage);
    };
  }, [user?.id, queryClient]);
};

// Admin realtime notification hook
export const useAdminChatRealtimeNotification = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleNewMessage = async (newMessage: any) => {
      const mapped = mapChatMessage(newMessage);
      
      // Only notify if message is from user
      if (mapped.sender_type === 'user') {
        // Fetch user info for the notification
        const { data: room } = await apiClient.from('chat_rooms')
          .select('user_id')
          .eq('id', mapped.room_id)
          .single();
        
        if (room) {
          const { data: profile } = await apiClient.from('profiles')
            .select('full_name, email')
            .eq('user_id', room.user_id || room.userId)
            .single();
          
          const senderName = profile?.full_name || profile?.email || 'Khách hàng';
          
          toast.info(`Tin nhắn mới từ ${senderName}`, {
            description: mapped.message.substring(0, 50) + (mapped.message.length > 50 ? '...' : ''),
            duration: 5000,
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
      }
    };

    socket.on('new-chat-message', handleNewMessage);

    return () => {
      socket.off('new-chat-message', handleNewMessage);
    };
  }, [queryClient]);
};

// Admin hooks
export const useAdminChatRooms = () => {
  return useQuery({
    queryKey: ['admin-chat-rooms'],
    queryFn: async () => {
      const { data: rooms, error } = await apiClient.from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const mappedRooms = (rooms || []).map(mapChatRoom);
      const userIds = [...new Set(mappedRooms.map(r => r.user_id))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await apiClient.from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id || p.userId, p]));

        return mappedRooms.map(room => ({
          ...room,
          user_profile: profileMap.get(room.user_id)
        }));
      }

      return mappedRooms;
    }
  });
};

export const useCloseChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await apiClient.from('chat_rooms')
        .update({ status: 'closed' })
        .eq('id', roomId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
      toast.success('Đã đóng cuộc trò chuyện');
    }
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get user's rooms
      const { data: rooms } = await apiClient.from('chat_rooms')
        .select('id')
        .eq('user_id', user.id);

      if (!rooms?.length) return 0;

      const roomIds = rooms.map((r: any) => r.id);

      // Count unread messages
      const { data, error } = await apiClient.from('chat_messages')
        .select('id')
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (error) return 0;
      return data?.length || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};
