// MySQL version - useVideoCall
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
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

// Legacy mapping
function mapCallSession(data: any): CallSession {
  if (!data) return data;
  return {
    id: data.id,
    room_id: data.roomId || data.room_id,
    caller_id: data.callerId || data.caller_id,
    callee_id: data.calleeId || data.callee_id,
    call_type: data.callType || data.call_type,
    status: data.status,
    started_at: data.startedAt || data.started_at,
    ended_at: data.endedAt || data.ended_at,
    duration_seconds: data.durationSeconds || data.duration_seconds,
    recording_url: data.recordingUrl || data.recording_url,
    created_at: data.createdAt || data.created_at,
    caller: data.caller,
    callee: data.callee,
  };
}

export const useCallSessions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['call-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await apiClient.from('call_sessions')
        .select('*')
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(mapCallSession);
    },
    enabled: !!user
  });
};

export const useIncomingCall = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const queryClient = useQueryClient();

  // Poll for incoming calls instead of real-time subscription
  useEffect(() => {
    if (!user) return;

    const checkIncomingCalls = async () => {
      const { data } = await apiClient.from('call_sessions')
        .select('*')
        .eq('callee_id', user.id)
        .in('status', ['pending', 'ringing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const call = mapCallSession(data[0]);
        // Fetch caller info
        const { data: callerProfile } = await apiClient.from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', call.caller_id)
          .single();
        
        setIncomingCall({ ...call, caller: callerProfile || undefined });
      } else {
        setIncomingCall(null);
      }
    };

    const interval = setInterval(checkIncomingCalls, 3000);
    checkIncomingCalls();

    return () => clearInterval(interval);
  }, [user]);

  return { incomingCall, clearIncomingCall: () => setIncomingCall(null) };
};

export const useInitiateCall = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      
      const { data, error } = await apiClient.from('call_sessions')
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
      return mapCallSession(data);
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
      const { data, error } = await apiClient.from('call_sessions')
        .update({
          status: 'connected',
          started_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return mapCallSession(data);
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
      const { error } = await apiClient.from('call_sessions')
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

      const { error } = await apiClient.from('call_sessions')
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
