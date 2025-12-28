// Hooks for Notifications - MySQL version
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, realtime, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'security' | 'system' | 'promo';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  // Legacy mappings
  user_id?: string;
  is_read?: boolean;
  created_at?: string;
}

const mapToLegacy = (notif: any): Notification => ({
  ...notif,
  user_id: notif.userId,
  is_read: notif.isRead,
  created_at: notif.createdAt,
});

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await db
        .from<Notification>('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime notifications via Socket.IO
  useEffect(() => {
    if (!user?.id) return;

    // Join user's personal channel
    realtime.joinUserChannel(user.id);

    const channel = realtime.channel(`notifications:${user.id}`);
    
    channel
      .on('INSERT', { table: 'notifications' }, (payload: any) => {
        const newNotification = mapToLegacy(payload.new);
        
        // Show toast for new notification
        toast(newNotification.title, {
          description: newNotification.message,
          action: newNotification.link ? {
            label: 'Xem',
            onClick: () => window.location.href = newNotification.link!,
          } : undefined,
        });

        // Update query cache
        queryClient.setQueryData(['notifications', user.id], (old: Notification[] = []) => {
          return [newNotification, ...old];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  // Unread count
  const unreadCount = notifications.filter(n => !n.isRead && !n.is_read).length;

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await db
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { data } = await rpc('mark_notifications_read', { userId: user.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await db
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete all notifications
  const deleteAllNotifications = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await db
        .from('notifications')
        .delete()
        .eq('userId', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    deleteAllNotifications: deleteAllNotifications.mutate,
  };
};

// Create notification helper
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      type,
      title,
      message,
      link,
    }: {
      userId: string;
      type: Notification['type'];
      title: string;
      message: string;
      link?: string;
    }) => {
      const { data, error } = await db
        .from<Notification>('notifications')
        .insert({
          userId,
          type,
          title,
          message,
          link: link || null,
          isRead: false,
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', data.userId] });
    },
  });
};
