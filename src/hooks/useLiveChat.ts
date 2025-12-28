import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// User hooks
export const useUserChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as ChatRoom[];
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

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user.id,
          subject
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
            // Avoid duplicates
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

      // Send email notification
      const siteUrl = window.location.origin;
      
      if (senderType === 'user') {
        // User sent message -> notify admin
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
      } else {
        // Admin sent message -> notify user
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('user_id')
          .eq('id', roomId)
          .single();
        
        if (room) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', room.user_id)
            .single();
          
          if (userProfile?.email) {
            sendChatNotificationEmail('chat_new_message_user', userProfile.email, {
              customer_name: userProfile.full_name || 'Quý khách',
              message: message.substring(0, 200),
              site_url: siteUrl,
              date: new Date().toLocaleString('vi-VN'),
            });
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
          
          // Only notify if message is from admin (not from current user)
          if (newMessage.sender_type === 'admin' && newMessage.sender_id !== user.id) {
            // Check if this room belongs to current user
            const { data: room } = await supabase
              .from('chat_rooms')
              .select('user_id')
              .eq('id', newMessage.room_id)
              .single();
            
            if (room?.user_id === user.id) {
              toast.info('Bạn có tin nhắn mới từ hỗ trợ viên!', {
                description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
                duration: 5000,
              });
              
              // Invalidate unread count
              queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
            }
          }
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
          
          // Only notify if message is from user
          if (newMessage.sender_type === 'user') {
            // Fetch user info for the notification
            const { data: room } = await supabase
              .from('chat_rooms')
              .select('user_id')
              .eq('id', newMessage.room_id)
              .single();
            
            if (room) {
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
            }
            
            // Invalidate admin chat rooms
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
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
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

      // Get user's rooms
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('user_id', user.id);

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
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};
