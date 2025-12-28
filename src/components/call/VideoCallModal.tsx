import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Volume2, VolumeX, Maximize2, X, Loader2 
} from 'lucide-react';
import { 
  useIncomingCall, useAnswerCall, useDeclineCall, useEndCall, useWebRTC, CallSession 
} from '@/hooks/useVideoCall';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VideoCallModalProps {
  call?: CallSession | null;
  isOutgoing?: boolean;
  onClose?: () => void;
}

export const VideoCallModal = ({ call, isOutgoing, onClose }: VideoCallModalProps) => {
  const [callDuration, setCallDuration] = useState(0);
  
  const answerCall = useAnswerCall();
  const declineCall = useDeclineCall();
  const endCall = useEndCall();
  
  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isMuted,
    isVideoOff,
    startLocalStream,
    toggleMute,
    toggleVideo,
    endLocalStream
  } = useWebRTC();

  // Start local stream when call connects
  useEffect(() => {
    if (call?.status === 'connected') {
      startLocalStream(call.call_type === 'video');
    }
    
    return () => {
      endLocalStream();
    };
  }, [call?.status, call?.call_type]);

  // Call duration timer
  useEffect(() => {
    if (call?.status === 'connected' && call?.started_at) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - new Date(call.started_at!).getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [call?.status, call?.started_at]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async () => {
    if (call) {
      await answerCall.mutateAsync(call.id);
    }
  };

  const handleDecline = async () => {
    if (call) {
      await declineCall.mutateAsync(call.id);
      onClose?.();
    }
  };

  const handleEndCall = async () => {
    if (call) {
      await endCall.mutateAsync({ callId: call.id, startedAt: call.started_at });
      endLocalStream();
      onClose?.();
    }
  };

  if (!call) return null;

  const isRinging = call.status === 'pending' || call.status === 'ringing';
  const isActive = call.status === 'connected';
  const isVideoCall = call.call_type === 'video';

  return (
    <Dialog open={!!call} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gray-900">
        <div className="relative h-[500px] flex flex-col">
          {/* Remote Video / Avatar */}
          <div className="flex-1 relative bg-gray-800 flex items-center justify-center">
            {isActive && isVideoCall ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={isOutgoing ? call.callee?.avatar_url : call.caller?.avatar_url} />
                  <AvatarFallback className="text-4xl bg-gray-700">
                    {(isOutgoing ? call.callee?.full_name : call.caller?.full_name)?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xl font-semibold text-white">
                  {isOutgoing ? call.callee?.full_name : call.caller?.full_name}
                </p>
                <p className="text-gray-400 mt-2">
                  {isRinging && (isOutgoing ? 'Đang gọi...' : 'Cuộc gọi đến')}
                  {isActive && formatDuration(callDuration)}
                </p>
              </div>
            )}

            {/* Local Video PIP */}
            {isActive && isVideoCall && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden bg-gray-700 shadow-lg"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover",
                    isVideoOff && "hidden"
                  )}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </motion.div>
            )}

            {/* Ringing animation */}
            {isRinging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-40 h-40 rounded-full border-4 border-primary/30 animate-ping" />
                <div className="absolute w-48 h-48 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {isActive && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full",
                      isMuted ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/20"
                    )}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-white" />}
                  </Button>
                  
                  {isVideoCall && (
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full",
                        isVideoOff ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/20"
                      )}
                      onClick={toggleVideo}
                    >
                      {isVideoOff ? <VideoOff className="h-5 w-5 text-red-500" /> : <Video className="h-5 w-5 text-white" />}
                    </Button>
                  )}
                </>
              )}

              {isRinging && !isOutgoing && (
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={handleAnswer}
                  disabled={answerCall.isPending}
                >
                  {answerCall.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Phone className="h-6 w-6" />
                  )}
                </Button>
              )}

              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                onClick={isRinging ? handleDecline : handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Incoming call notification
export const IncomingCallNotification = () => {
  const { incomingCall, clearIncomingCall } = useIncomingCall();
  const answerCall = useAnswerCall();
  const declineCall = useDeclineCall();
  const [showFullModal, setShowFullModal] = useState(false);

  const handleAnswer = async () => {
    if (incomingCall) {
      await answerCall.mutateAsync(incomingCall.id);
      setShowFullModal(true);
    }
  };

  const handleDecline = async () => {
    if (incomingCall) {
      await declineCall.mutateAsync(incomingCall.id);
      clearIncomingCall();
    }
  };

  if (showFullModal && incomingCall) {
    return <VideoCallModal call={incomingCall} onClose={() => { setShowFullModal(false); clearIncomingCall(); }} />;
  }

  return (
    <AnimatePresence>
      {incomingCall && !showFullModal && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-card border rounded-2xl shadow-2xl p-4 w-80"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={incomingCall.caller?.avatar_url} />
                <AvatarFallback>{incomingCall.caller?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                {incomingCall.call_type === 'video' ? (
                  <Video className="h-3 w-3 text-white" />
                ) : (
                  <Phone className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold">{incomingCall.caller?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {incomingCall.call_type === 'video' ? 'Video call' : 'Voice call'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleDecline}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={handleAnswer}
            >
              <Phone className="h-4 w-4 mr-2" />
              Trả lời
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoCallModal;
