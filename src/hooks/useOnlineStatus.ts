import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Update online status
export const useUpdateOnlineStatus = () => {
  const { user } = useAuth();

  const updateStatus = async (isOnline: boolean) => {
    if (!user?.id) return;

    await supabase
      .from('profiles')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', user.id);
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
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`,
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

      const { data, error } = await supabase
        .from('profiles')
        .select('is_online, last_seen')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data;
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

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, is_online, last_seen')
        .in('user_id', userIds);

      if (error) return [];
      return data;
    },
    enabled: userIds.length > 0,
    refetchInterval: 30000
  });
};
