import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useUserChatRooms, 
  useCreateChatRoom, 
  useChatMessages, 
  useSendMessage,
  useMarkMessagesRead,
  useUnreadCount,
  useChatRealtimeNotification,
  ChatAttachment
} from '@/hooks/useLiveChat';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageCircle, 
  Loader2, 
  X, 
  User, 
  Shield, 
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCheck,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageInput from './ChatMessageInput';
import MessageAttachments from './MessageAttachments';

interface LiveChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { data: rooms, isLoading: roomsLoading } = useUserChatRooms();
  const createRoom = useCreateChatRoom();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedRoomId || '');
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enable realtime notifications
  useChatRealtimeNotification();

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      markRead.mutate(selectedRoomId);
    }
  }, [selectedRoomId, messages]);

  const handleCreateRoom = async () => {
    const room = await createRoom.mutateAsync('Hỗ trợ khách hàng');
    setSelectedRoomId(room.id);
  };

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    if (!selectedRoomId) return;
    if (!message.trim() && attachments.length === 0) return;
    
    await sendMessage.mutateAsync({
      roomId: selectedRoomId,
      message: message.trim(),
      senderType: 'user',
      attachments
    });
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Bạn';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="fixed bottom-24 right-4 w-[340px] sm:w-[380px] h-[520px] z-50 rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-background flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Hỗ trợ trực tuyến</h3>
                  <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Đang hoạt động
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-white/20 text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedRoomId ? (
              // Room list view
              <div className="flex-1 flex flex-col">
                {/* New chat button */}
                <div className="p-4 border-b border-border/50">
                  <Button 
                    className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20" 
                    onClick={handleCreateRoom}
                    disabled={createRoom.isPending}
                  >
                    {createRoom.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Bắt đầu cuộc trò chuyện mới
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Room list */}
                <ScrollArea className="flex-1">
                  {roomsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Đang tải...</p>
                      </div>
                    </div>
                  ) : rooms && rooms.length > 0 ? (
                    <div className="p-3 space-y-2">
                      {rooms.map((room, index) => (
                        <motion.button
                          key={room.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="w-full p-4 rounded-xl hover:bg-muted/50 text-left transition-all duration-200 border border-border/50 hover:border-primary/30 hover:shadow-sm group"
                          onClick={() => setSelectedRoomId(room.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm truncate">
                                  {room.subject || 'Hỗ trợ khách hàng'}
                                </span>
                                <Badge 
                                  variant={room.status === 'open' ? 'default' : 'secondary'}
                                  className={cn(
                                    "text-[10px] px-2 py-0.5",
                                    room.status === 'open' && "bg-green-500/10 text-green-600 border-green-500/20"
                                  )}
                                >
                                  {room.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(room.last_message_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                        <MessageCircle className="h-10 w-10 text-primary/50" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">Chưa có cuộc trò chuyện</h4>
                      <p className="text-sm text-muted-foreground">
                        Bắt đầu cuộc trò chuyện mới để được hỗ trợ
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Chat view
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Chat header */}
                <div className="p-3 border-b border-border/50 flex items-center gap-2 bg-muted/30 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setSelectedRoomId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-background" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Hỗ trợ viên</p>
                      <p className="text-[10px] text-muted-foreground">Thường trả lời trong vài phút</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages area */}
                <div 
                  className="flex-1 overflow-y-auto overscroll-contain p-4"
                  style={{ touchAction: 'pan-y' }}
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        const isUser = msg.sender_type === 'user';
                        const showAvatar = index === 0 || messages[index - 1]?.sender_type !== msg.sender_type;
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              'flex gap-2',
                              isUser ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {/* Admin avatar on left */}
                            {!isUser && (
                              <Avatar className={cn("h-8 w-8 flex-shrink-0", !showAvatar && "invisible")}>
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                                  <Shield className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              'max-w-[70%] flex flex-col',
                              isUser ? 'items-end' : 'items-start'
                            )}>
                              {/* Message bubble */}
                              {/* Attachments */}
                              <MessageAttachments attachments={(msg as any).attachments || []} />
                              
                              {msg.message && (
                              <div
                                className={cn(
                                  'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                                  isUser
                                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                                    : 'bg-muted/80 text-foreground rounded-bl-md border border-border/50'
                                )}
                              >
                                {msg.message}
                              </div>
                              )}
                              
                              {/* Timestamp & read status */}
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isUser && msg.is_read && (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </div>
                            
                            {/* User avatar on right */}
                            {isUser && (
                              <Avatar className={cn("h-8 w-8 flex-shrink-0", !showAvatar && "invisible")}>
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-secondary to-muted">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-primary/50" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">Bắt đầu cuộc trò chuyện!</h4>
                      <p className="text-sm text-muted-foreground">
                        Gửi tin nhắn để được hỗ trợ
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Input area */}
                <div className="p-3 border-t border-border/50 bg-muted/30">
                  <ChatMessageInput
                    onSend={handleSendMessage}
                    placeholder="Nhập tin nhắn..."
                    disabled={sendMessage.isPending}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Footer branding */}
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-center text-muted-foreground">
              Powered by <span className="font-semibold text-primary">Live Support</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Floating chat button
export const LiveChatButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  if (!user) return null;

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <Button
          className={cn(
            "fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-xl z-40 transition-all duration-300",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            "hover:scale-110 hover:shadow-2xl hover:shadow-primary/30",
            isOpen && "rotate-0"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount && unreadCount > 0 && !isOpen && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold shadow-lg"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Pulse effect */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          )}
        </Button>
      </motion.div>
      
      <LiveChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
