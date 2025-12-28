import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CallSession {
  id: string;
  room_id: string;
  caller_id: string;
  callee_id: string;
  call_type: 'voice' | 'video';
  status: 'pending' | 'ringing' | 'connected' | 'ended' | 'missed' | 'declined';
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  recording_url?: string;
  created_at: string;
  caller?: { full_name: string; avatar_url: string };
  callee?: { full_name: string; avatar_url: string };
}

export const useCallSessions = () => {
  const auth = useAuthSafe();
  const user = auth?.user;
  
  return useQuery({
    queryKey: ['call-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CallSession[];
    },
    enabled: !!user
  });
};

export const useIncomingCall = () => {
  const auth = useAuthSafe();
  const user = auth?.user;
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incoming-calls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`
        },
        async (payload) => {
          const call = payload.new as CallSession;
          if (call.status === 'pending' || call.status === 'ringing') {
            // Fetch caller info
            const { data: callerProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', call.caller_id)
              .single();
            
            setIncomingCall({ ...call, caller: callerProfile || undefined });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`
        },
        (payload) => {
          const call = payload.new as CallSession;
          if (call.status === 'ended' || call.status === 'declined' || call.status === 'missed') {
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { incomingCall, clearIncomingCall: () => setIncomingCall(null) };
};

export const useInitiateCall = () => {
  const queryClient = useQueryClient();
  const auth = useAuthSafe();
  const user = auth?.user;

  return useMutation({
    mutationFn: async ({ 
      calleeId, 
      callType 
    }: { 
      calleeId: string; 
      callType: 'voice' | 'video' 
    }) => {
      if (!user) throw new Error('Chưa đăng nhập');
      
      const roomId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('call_sessions')
        .insert({
          room_id: roomId,
          caller_id: user.id,
          callee_id: calleeId,
          call_type: callType,
          status: 'ringing'
        })
        .select()
        .single();

      if (error) throw error;
      return data as CallSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sessions'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useAnswerCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase
        .from('call_sessions')
        .update({
          status: 'connected',
          started_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data as CallSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sessions'] });
    }
  });
};

export const useDeclineCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from('call_sessions')
        .update({ status: 'declined' })
        .eq('id', callId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sessions'] });
    }
  });
};

export const useEndCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, startedAt }: { callId: string; startedAt?: string }) => {
      const endedAt = new Date();
      let durationSeconds = 0;
      
      if (startedAt) {
        durationSeconds = Math.floor((endedAt.getTime() - new Date(startedAt).getTime()) / 1000);
      }

      const { error } = await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds
        })
        .eq('id', callId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-sessions'] });
    }
  });
};

// WebRTC hook for actual call functionality
export const useWebRTC = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const startLocalStream = useCallback(async (video: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      toast.error('Không thể truy cập camera/microphone');
      throw error;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const endLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      endLocalStream();
    };
  }, [endLocalStream]);

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isMuted,
    isVideoOff,
    startLocalStream,
    toggleMute,
    toggleVideo,
    endLocalStream
  };
};
