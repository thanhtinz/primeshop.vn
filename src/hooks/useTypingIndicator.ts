import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  user_id: string;
  username?: string;
}

export const useTypingIndicator = (roomId: string | undefined) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Subscribe to typing events
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const channelName = `typing:${roomId}`;
    
    channelRef.current = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channelRef.current?.presenceState() || {};
        const users: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id && presence.is_typing) {
              users.push({
                user_id: presence.user_id,
                username: presence.username
              });
            }
          });
        });
        
        setTypingUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handle new presence
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handle left presence
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channelRef.current?.track({
            user_id: user.id,
            username: profile?.username || profile?.full_name,
            is_typing: false,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId, user?.id, profile?.username, profile?.full_name]);

  // Send typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !user?.id) return;

    await channelRef.current.track({
      user_id: user.id,
      username: profile?.username || profile?.full_name,
      is_typing: isTyping,
      online_at: new Date().toISOString()
    });
  }, [user?.id, profile?.username, profile?.full_name]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    setTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    handleTyping,
    setTyping
  };
};
