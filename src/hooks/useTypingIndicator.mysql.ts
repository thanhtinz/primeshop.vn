// MySQL version - useTypingIndicator
// Note: This is a simplified version without Supabase Presence.
// Real-time typing indicators would need Socket.io implementation on backend
import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient, socketManager } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface TypingUser {
  user_id: string;
  username?: string;
}

export const useTypingIndicator = (roomId: string | undefined) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to typing events via Socket.io
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    // Join typing room
    socket.emit('join-typing', { roomId, userId: user.id });

    // Listen for typing events
    const handleTypingStart = (data: { userId: string; username?: string }) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          if (prev.some(u => u.user_id === data.userId)) return prev;
          return [...prev, { user_id: data.userId, username: data.username }];
        });

        // Auto-remove after 3 seconds if no update
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.user_id !== data.userId));
        }, 3000);
      }
    };

    const handleTypingStop = (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.user_id !== data.userId));
    };

    socket.on('typing-start', handleTypingStart);
    socket.on('typing-stop', handleTypingStop);

    return () => {
      socket.emit('leave-typing', { roomId, userId: user.id });
      socket.off('typing-start', handleTypingStart);
      socket.off('typing-stop', handleTypingStop);
    };
  }, [roomId, user?.id]);

  // Send typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!roomId || !user?.id) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    if (isTyping) {
      socket.emit('typing-start', {
        roomId,
        userId: user.id,
        username: profile?.username || profile?.full_name
      });
    } else {
      socket.emit('typing-stop', {
        roomId,
        userId: user.id
      });
    }
  }, [roomId, user?.id, profile?.username, profile?.full_name]);

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

// Fallback hook for polling-based typing indicator (if Socket.io not available)
export const useTypingIndicatorPolling = (roomId: string | undefined) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for typing users
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const pollTyping = async () => {
      try {
        const { data } = await apiClient.from('chat_typing_indicators')
          .select('user_id, username')
          .eq('room_id', roomId)
          .neq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 5000).toISOString());

        if (data) {
          setTypingUsers(data.map((d: any) => ({
            user_id: d.user_id || d.userId,
            username: d.username
          })));
        }
      } catch (err) {
        // Ignore errors
      }
    };

    const interval = setInterval(pollTyping, 2000);
    pollTyping();

    return () => clearInterval(interval);
  }, [roomId, user?.id]);

  // Send typing status via API
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!roomId || !user?.id) return;

    try {
      if (isTyping) {
        await apiClient.from('chat_typing_indicators')
          .upsert({
            room_id: roomId,
            user_id: user.id,
            username: profile?.username || profile?.full_name,
            updated_at: new Date().toISOString()
          });
      } else {
        await apiClient.from('chat_typing_indicators')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      // Ignore errors
    }
  }, [roomId, user?.id, profile?.username, profile?.full_name]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    setTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

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
