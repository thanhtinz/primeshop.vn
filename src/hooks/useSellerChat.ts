import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface SellerChatRoom {
  id: string;
  user_id: string;
  target_user_id: string | null;
  subject: string | null;
  status: string;
  room_type: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  user_profile?: {
    user_id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export interface SellerChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  attachments: any;
  is_read: boolean;
  created_at: string;
}

// Get chat rooms where users messaged the seller
export const useSellerChatRooms = (sellerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller-chat-rooms', sellerId],
    queryFn: async () => {
      if (!sellerId || !user?.id) return [];

      // Get chat rooms filtered by seller_id
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('room_type', 'seller')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      if (!rooms?.length) return [];

      // Get user profiles (the users who initiated chat)
      const userIds = [...new Set(rooms.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Get last messages and unread counts
      const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
        // Get last message
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('message')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          ...room,
          user_profile: profileMap.get(room.user_id),
          last_message: messages?.[0]?.message,
          unread_count: count || 0
        };
      }));

      return roomsWithDetails as SellerChatRoom[];
    },
    enabled: !!sellerId && !!user?.id
  });
};

// Get messages for seller chat room
export const useSellerChatMessages = (roomId?: string) => {
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`seller-chat-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['seller-chat-messages', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return useQuery({
    queryKey: ['seller-chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SellerChatMessage[];
    },
    enabled: !!roomId
  });
};

// Send message as seller/shop
export const useSendSellerMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, message, attachments }: {
      roomId: string;
      message: string;
      attachments?: any;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          sender_type: 'shop', // Mark as shop message
          message: message.trim(),
          attachments
        })
        .select()
        .single();

      if (error) throw error;

      // Update room last_message_at
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

      return data;
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['seller-chat-rooms'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi tin nhắn');
    }
  });
};

// Mark messages as read
export const useMarkSellerMessagesRead = () => {
  const queryClient = useQueryClient();
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-chat-rooms'] });
    }
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
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('room_type', 'seller');

      if (!rooms?.length) return 0;

      const roomIds = rooms.map(r => r.id);

      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      return count || 0;
    },
    enabled: !!sellerId && !!user?.id,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};
