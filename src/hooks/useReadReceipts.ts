import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Mark messages as read
export const useMarkMessagesAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, messageIds }: { roomId: string; messageIds?: string[] }) => {
      if (!user?.id) return;

      // If specific message IDs provided, mark those
      if (messageIds && messageIds.length > 0) {
        const { error } = await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString(), is_read: true })
          .in('id', messageIds)
          .neq('sender_id', user.id);

        if (error) throw error;
      } else {
        // Mark all unread messages in room as read
        const { error } = await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString(), is_read: true })
          .eq('room_id', roomId)
          .neq('sender_id', user.id)
          .is('read_at', null);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
  });
};

// Format read receipt time
export const formatReadTime = (readAt: string | null): string => {
  if (!readAt) return '';
  
  const date = new Date(readAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xem';
  if (diffMins < 60) return `Đã xem ${diffMins} phút trước`;
  if (diffHours < 24) return `Đã xem ${diffHours} giờ trước`;
  if (diffDays < 7) return `Đã xem ${diffDays} ngày trước`;
  
  return `Đã xem ${date.toLocaleDateString('vi-VN')}`;
};
