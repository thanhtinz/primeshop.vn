import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { notifyNewMessage } from '@/services/notificationService';

export interface ChatRoom {
  id: string;
  user_id: string;
  admin_id?: string;
  target_user_id?: string;
  room_type: 'admin' | 'user';
  status: 'open' | 'closed';
  subject?: string;
  last_message_at: string;
  created_at: string;
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
  room_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
  attachments?: ChatAttachment[];
}

// Send chat notification email
const sendChatNotificationEmail = async (
  templateName: string,
  recipient: string,
  variables: Record<string, string>
) => {
  try {
    await supabase.functions.invoke('send-email', {
      body: {
        recipient,
        template_name: templateName,
        variables,
      },
    });
  } catch (error) {
    console.error('Failed to send chat notification email:', error);
  }
};

// User hooks - get all chat rooms for user
export const useUserChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get rooms where user is initiator, target, or member
      const { data: memberRooms } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id);

      const memberRoomIds = memberRooms?.map(m => m.room_id) || [];

      // Build query for all rooms user has access to
      let query = supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (memberRoomIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},target_user_id.eq.${user.id},id.in.(${memberRoomIds.join(',')})`);
      } else {
        query = query.or(`user_id.eq.${user.id},target_user_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for all users involved
      const userIds = [...new Set(data?.flatMap(r => [r.user_id, r.target_user_id].filter(Boolean)) || [])] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data?.map(room => ({
        ...room,
        user_profile: profileMap.get(room.user_id),
        target_user_profile: room.target_user_id 
          ? profileMap.get(room.target_user_id)
          : null
      })) as ChatRoom[];
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

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user.id,
          subject,
          room_type: 'admin'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

// Create or get user-to-user chat room
export const useCreateUserChatRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUserId, subject }: { targetUserId: string; subject?: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      // Check if room already exists between these users
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'user')
        .or(`and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`)
        .single();

      if (existingRoom) {
        return existingRoom;
      }

      // Create new room
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          subject,
          room_type: 'user'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-chat-rooms'] });
    }
  });
};

export const useChatMessages = (roomId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            attachments: (payload.new.attachments as unknown as ChatAttachment[]) || []
          } as ChatMessage;
          
          queryClient.setQueryData<ChatMessage[]>(['chat-messages', roomId], (old) => {
            if (!old) return [newMessage];
            if (old.some(m => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        attachments: (msg.attachments as unknown as ChatAttachment[]) || []
      })) as ChatMessage[];
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

      const insertData: any = {
        room_id: roomId,
        sender_id: user.id,
        sender_type: senderType,
        message,
        attachments: attachments
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Update room's last_message_at
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

      // Get room info for notifications
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('user_id, target_user_id, room_type')
        .eq('id', roomId)
        .single();

      if (room) {
        const siteUrl = window.location.origin;

        if (room.room_type === 'admin' && senderType === 'user') {
          // User sent message to admin
          const { data: adminEmails } = await supabase
            .from('admin_users')
            .select('email')
            .limit(5);
          
          if (adminEmails && adminEmails.length > 0) {
            const customerName = profile?.full_name || user.email || 'Khách hàng';
            for (const admin of adminEmails) {
              sendChatNotificationEmail('chat_new_message_admin', admin.email, {
                customer_name: customerName,
                customer_email: user.email || '',
                message: message.substring(0, 200),
                admin_url: `${siteUrl}/admin/chat`,
                date: new Date().toLocaleString('vi-VN'),
              });
            }
          }
        } else if (room.room_type === 'user') {
          // User-to-user chat - notify the other person
          const recipientId = room.user_id === user.id ? room.target_user_id : room.user_id;
          if (recipientId) {
            const { data: recipientProfile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('user_id', recipientId)
              .single();
            
            if (recipientProfile?.email) {
              sendChatNotificationEmail('chat_new_message_user', recipientProfile.email, {
                customer_name: recipientProfile.full_name || 'Bạn',
                message: message.substring(0, 200),
                site_url: siteUrl,
                date: new Date().toLocaleString('vi-VN'),
              });
            }
            
            // Create in-app notification
            const senderName = profile?.full_name || user.email || 'Người dùng';
            notifyNewMessage(recipientId, senderName, roomId, message);
          }
        }
      }

      return data;
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

      const { error } = await supabase
        .from('chat_messages')
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

    const channel = supabase
      .channel('user-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if this room involves current user
          const { data: room } = await supabase
            .from('chat_rooms')
            .select('user_id, target_user_id, room_type')
            .eq('id', newMessage.room_id)
            .single();
          
          if (!room) return;

          const isInvolved = room.user_id === user.id || room.target_user_id === user.id;
          if (!isInvolved) return;

          // Get sender name
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', newMessage.sender_id)
            .single();

          const senderName = room.room_type === 'admin' && newMessage.sender_type === 'admin'
            ? 'Hỗ trợ viên'
            : senderProfile?.full_name || senderProfile?.email || 'Người dùng';

          toast.info(`Tin nhắn mới từ ${senderName}`, {
            description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
            duration: 5000,
          });
          
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};

// Admin realtime notification hook
export const useAdminChatRealtimeNotification = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          if (newMessage.sender_type === 'user') {
            const { data: room } = await supabase
              .from('chat_rooms')
              .select('user_id, room_type')
              .eq('id', newMessage.room_id)
              .single();
            
            // Only notify for admin rooms
            if (room?.room_type !== 'admin') return;

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', room.user_id)
              .single();
            
            const senderName = profile?.full_name || profile?.email || 'Khách hàng';
            
            toast.info(`Tin nhắn mới từ ${senderName}`, {
              description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
              duration: 5000,
            });
            
            queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// Admin hooks
export const useAdminChatRooms = () => {
  return useQuery({
    queryKey: ['admin-chat-rooms'],
    queryFn: async () => {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'admin')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(rooms?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return rooms?.map(room => ({
        ...room,
        user_profile: profileMap.get(room.user_id)
      })) as ChatRoom[];
    }
  });
};

export const useCloseChatRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('chat_rooms')
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

      // Get all rooms where user is involved
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`user_id.eq.${user.id},target_user_id.eq.${user.id}`);

      if (!rooms?.length) return 0;

      const roomIds = rooms.map(r => r.id);

      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });
};
