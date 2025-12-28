// Hooks for Online Status - MySQL version
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// Update online status
export const useUpdateOnlineStatus = () => {
  const { user } = useAuth();

  const updateStatus = async (isOnline: boolean) => {
    if (!user?.id) return;

    try {
      await db
        .from('profiles')
        .update({ 
          isOnline,
          lastSeen: new Date().toISOString()
        })
        .eq('userId', user.id);
    } catch (e) {
      // Ignore errors silently
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Set online when component mounts
    updateStatus(true);

    // Set offline when window closes/loses focus
    const handleVisibilityChange = () => {
      updateStatus(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      navigator.sendBeacon?.(
        `${apiUrl}/users/${user.id}/offline`,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat to keep online status
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      }
    }, 30000); // Every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeat);
      updateStatus(false);
    };
  }, [user?.id]);
};

// Get online status for a specific user
export const useUserOnlineStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['online-status', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await db
        .from<any>('profiles')
        .select('isOnline, lastSeen')
        .eq('userId', userId)
        .single();

      if (error) return null;
      return {
        is_online: data.isOnline,
        last_seen: data.lastSeen,
      };
    },
    enabled: !!userId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};

// Get online users from a list
export const useOnlineUsers = (userIds: string[]) => {
  return useQuery({
    queryKey: ['online-users', userIds],
    queryFn: async () => {
      if (!userIds.length) return [];

      const { data, error } = await db
        .from<any>('profiles')
        .select('userId, isOnline, lastSeen')
        .in('userId', userIds);

      if (error) return [];
      return (data || []).map((d: any) => ({
        user_id: d.userId,
        is_online: d.isOnline,
        last_seen: d.lastSeen,
      }));
    },
    enabled: userIds.length > 0,
    refetchInterval: 30000
  });
};
