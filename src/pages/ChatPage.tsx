import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  UserPlus,
  Shield,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Search,
  MoreHorizontal,
  Loader2,
  X,
  Settings,
  Trash2,
  Pin,
  Users,
  Bot,
  Sparkles,
  User
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserChatRooms, useSendMessage, useCreateChatRoom, ChatAttachment } from '@/hooks/useChatSystem';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';
import { isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ChatSettingsDialog, getBackgroundClass } from '@/components/chat/ChatSettingsDialog';
import { AddPeopleDialog } from '@/components/chat/AddPeopleDialog';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';
import { GroupMemberNicknameDialog } from '@/components/chat/GroupMemberNicknameDialog';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ReadReceipt } from '@/components/chat/ReadReceipt';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMarkMessagesAsRead } from '@/hooks/useReadReceipts';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import EmojiStickerPicker, { StickerItem } from '@/components/chat/EmojiPicker';
import MessageAttachments from '@/components/chat/MessageAttachments';
import { useAIConversations, useAIMessages, useCreateAIConversation, useStreamingAIChat, AIMessage } from '@/hooks/useAIChat';
import { useIsMobile } from '@/hooks/use-mobile';

const ChatPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { formatDateTime: formatDateTimeHook } = useDateFormat();
  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useUserChatRooms();
  const createRoom = useCreateChatRoom();
  const sendMessage = useSendMessage();
  const { data: siteSettings } = useSiteSettings();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Chat state
  const [isAIChatMode, setIsAIChatMode] = useState(false);
  const [currentAIConversationId, setCurrentAIConversationId] = useState<string | null>(null);
  const { data: aiConversations = [] } = useAIConversations();
  const { data: aiMessages = [] } = useAIMessages(currentAIConversationId);
  const createAIConversation = useCreateAIConversation();
  const { sendMessage: sendAIMessage, isStreaming, streamingContent } = useStreamingAIChat();

  // Typing indicator
  const { typingUsers, setTyping } = useTypingIndicator(selectedRoomId || '');
  const markAsRead = useMarkMessagesAsRead();

  // Chat settings - Images and emoji always enabled, stickers require admin config
  const chatSettings = {
    enableImages: true, // Always enabled
    enableEmoji: true, // Always enabled
    enableStickers: siteSettings?.chat_enable_stickers ?? false, // Requires admin
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-create admin support room if none exists
  useEffect(() => {
    const createDefaultAdminRoom = async () => {
      if (!user || roomsLoading || createRoom.isPending) return;
      
      // Only check when rooms have loaded (not undefined)
      if (rooms === undefined) return;
      
      // Check if admin support room exists
      const hasAdminRoom = rooms.some(room => room.room_type === 'admin');
      
      if (!hasAdminRoom) {
        try {
          const newRoom = await createRoom.mutateAsync('Hỗ trợ khách hàng');
          // Auto-select the new admin room
          if (newRoom?.id) {
            setSelectedRoomId(newRoom.id);
          }
        } catch (error) {
          console.error('Error creating default admin room:', error);
        }
      }
    };

    createDefaultAdminRoom();
  }, [user?.id, rooms, roomsLoading, createRoom.isPending]);

  useEffect(() => {
    if (!selectedRoomId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', selectedRoomId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        // Mark messages as read using the hook
        markAsRead.mutate({ roomId: selectedRoomId });
      }
      setIsLoadingMessages(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`room-${selectedRoomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${selectedRoomId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
          // Mark new incoming messages as read
          if ((payload.new as any).sender_id !== user?.id) {
            markAsRead.mutate({ roomId: selectedRoomId, messageIds: [(payload.new as any).id] });
          }
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === (payload.new as any).id ? payload.new : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoomId, user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedRoomId || !user) return;

    try {
      const chatAttachments: ChatAttachment[] = attachments.map(url => ({ type: 'image' as const, url }));
      await sendMessage.mutateAsync({
        roomId: selectedRoomId,
        message: newMessage,
        attachments: chatAttachments.length > 0 ? chatAttachments : undefined
      });
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const handleSendSticker = async (sticker: StickerItem) => {
    if (!selectedRoomId || !user) return;
    try {
      await sendMessage.mutateAsync({
        roomId: selectedRoomId,
        message: '',
        attachments: [{ type: 'sticker' as const, sticker: { id: sticker.id, url: sticker.url, name: sticker.name } }]
      });
    } catch (error) {
      toast.error('Không thể gửi sticker');
    }
  };

  const handleSendQuickReaction = async (emoji?: string) => {
    if (!selectedRoomId || !user) return;
    const reactionEmoji = emoji || (selectedRoom as any)?.quick_reaction_emoji || '👍';
    try {
      await sendMessage.mutateAsync({
        roomId: selectedRoomId,
        message: reactionEmoji,
      });
    } catch (error) {
      toast.error('Không thể gửi');
    }
  };

  const handleCreateNewChat = async (userId: string, userName: string) => {
    try {
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user?.id,
          target_user_id: userId,
          subject: `Chat với ${userName}`,
          room_type: 'private'
        })
        .select()
        .single();

      if (error) throw error;
      
      refetchRooms();
      setSelectedRoomId(room.id);
      toast.success(`Đã tạo cuộc trò chuyện với ${userName}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Không thể tạo cuộc trò chuyện');
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;

    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', deleteRoomId);

      if (messagesError) throw messagesError;

      // Delete the room
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', deleteRoomId)
        .eq('user_id', user?.id);

      if (roomError) throw roomError;
      
      // Clear selection if deleted room was selected
      if (selectedRoomId === deleteRoomId) {
        setSelectedRoomId(null);
        setMessages([]);
      }
      
      refetchRooms();
      toast.success('Đã xóa cuộc trò chuyện');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Không thể xóa cuộc trò chuyện');
    } finally {
      setDeleteRoomId(null);
    }
  };

  // AI Chat handlers
  const handleOpenAIChat = async () => {
    setIsAIChatMode(true);
    setSelectedRoomId(null);
    
    if (!currentAIConversationId && aiConversations.length === 0) {
      const newConv = await createAIConversation.mutateAsync('Trợ lý AI');
      setCurrentAIConversationId(newConv.id);
    } else if (!currentAIConversationId && aiConversations.length > 0) {
      setCurrentAIConversationId(aiConversations[0].id);
    }
  };

  const handleSendAIMessage = async (directMessage?: string) => {
    const messageToSend = directMessage || newMessage;
    if (!messageToSend.trim() || isStreaming || !currentAIConversationId) return;
    
    if (!directMessage) {
      setNewMessage('');
    }
    
    await sendAIMessage(currentAIConversationId, messageToSend, aiMessages);
  };

  const allAIMessages = [...aiMessages];
  if (streamingContent) {
    allAIMessages.push({
      id: 'streaming',
      conversation_id: currentAIConversationId || '',
      role: 'assistant' as const,
      content: streamingContent,
      created_at: new Date().toISOString()
    });
  }

  // handleAddPerson is now handled by AddPeopleDialog component

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File ảnh không được vượt quá 50MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error(t('pleaseLoginToSendImage'));
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      setAttachments(prev => [...prev, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) return formatDateTimeHook(date, 'HH:mm');
    if (isYesterday(date)) return 'Hôm qua ' + formatDateTimeHook(date, 'HH:mm');
    return formatDateTimeHook(date, 'dd/MM HH:mm');
  };

  const shouldShowTime = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    const current = new Date(currentMsg.created_at);
    const prev = new Date(prevMsg.created_at);
    return differenceInMinutes(current, prev) > 5;
  };

  const shouldShowAvatar = (currentMsg: any, nextMsg: any) => {
    if (!nextMsg) return true;
    return currentMsg.sender_id !== nextMsg.sender_id;
  };

  // Sort rooms: admin rooms first (pinned)
  const sortedRooms = [...(rooms || [])].sort((a, b) => {
    if (a.room_type === 'admin' && b.room_type !== 'admin') return -1;
    if (a.room_type !== 'admin' && b.room_type === 'admin') return 1;
    return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime();
  });

  const filteredRooms = sortedRooms.filter(room => 
    room.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRoom = rooms?.find(r => r.id === selectedRoomId);

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Đăng nhập để sử dụng Chat</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Kết nối với bộ phận hỗ trợ hoặc bạn bè của bạn
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="rounded-full px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            Đăng nhập ngay
          </Button>
        </div>
      </Layout>
    );
  }

  // On mobile with selected room, show fullscreen chat
  const isMobileWithChat = isMobile && (selectedRoomId || isAIChatMode);
  
  const chatUI = (
    <>
      <div className={cn(
        (selectedRoomId || isAIChatMode) ? "h-screen" : "h-[calc(100vh-64px)] pb-16",
        "md:h-[calc(100vh-80px)] md:pb-0"
      )}>
      <div className="h-full flex bg-background">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-[360px] flex flex-col border-r border-border bg-card",
          (selectedRoomId || isAIChatMode) && "hidden md:flex"
        )}>
            {/* Sidebar Header */}
            <div className="p-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Chat</h1>
              <div className="flex items-center gap-1">
                <AddPeopleDialog onCreateRoom={handleCreateNewChat}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    title="Chat riêng"
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>
                </AddPeopleDialog>
                <CreateGroupDialog onGroupCreated={(roomId) => {
                  refetchRooms();
                  setSelectedRoomId(roomId);
                }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    title="Tạo nhóm"
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </CreateGroupDialog>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm kiếm cuộc trò chuyện" 
                  className="pl-9 rounded-full bg-secondary border-0 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Room List */}
            <ScrollArea className="flex-1">
              {roomsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2">
                  {/* Pinned Admin Support Room - ALWAYS visible at top */}
                  <button
                    onClick={async () => {
                      if (!user) {
                        toast.error(t('pleaseLoginToChat'));
                        navigate('/auth');
                        return;
                      }
                      
                      // Check if admin room already exists
                      const existingAdminRoom = filteredRooms.find(r => r.room_type === 'admin');
                      if (existingAdminRoom) {
                        setSelectedRoomId(existingAdminRoom.id);
                        setIsAIChatMode(false);
                        return;
                      }
                      
                      // Create new admin room
                      try {
                        toast.loading('Đang tạo cuộc trò chuyện...', { id: 'create-chat' });
                        const newRoom = await createRoom.mutateAsync('Hỗ trợ khách hàng');
                        toast.dismiss('create-chat');
                        if (newRoom?.id) {
                          setSelectedRoomId(newRoom.id);
                          setIsAIChatMode(false);
                          await refetchRooms();
                          toast.success('Đã tạo cuộc trò chuyện với Admin');
                        }
                      } catch (error: any) {
                        toast.dismiss('create-chat');
                        console.error('Error creating admin room:', error);
                        toast.error(error?.message || 'Không thể tạo cuộc trò chuyện');
                      }
                    }}
                    disabled={createRoom.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors mb-2",
                      "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20",
                      "hover:from-blue-500/20 hover:to-purple-500/20",
                      createRoom.isPending && "opacity-50 cursor-wait",
                      filteredRooms.some(r => r.room_type === 'admin') && selectedRoomId === filteredRooms.find(r => r.room_type === 'admin')?.id && "ring-2 ring-blue-500"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700 text-white text-lg font-semibold">
                          {createRoom.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Shield className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] border-card rounded-full" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">💬 Hỗ trợ Admin</p>
                        <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                          <Pin className="h-3 w-3" />
                          Ghim
                        </span>
                      </div>
                      <p className="text-sm text-blue-500 truncate">
                        {createRoom.isPending ? 'Đang tạo...' : 'Liên hệ hỗ trợ 24/7'}
                      </p>
                    </div>
                  </button>

                  {/* AI Assistant Pinned Room */}
                  <button
                    onClick={handleOpenAIChat}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors mb-2",
                      "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20",
                      "hover:from-emerald-500/20 hover:to-cyan-500/20",
                      isAIChatMode && "ring-2 ring-emerald-500"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-cyan-600 text-white text-lg font-semibold">
                          <Bot className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] border-card rounded-full" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">🤖 AI Assistant</p>
                        <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      </div>
                      <p className="text-sm text-emerald-500 truncate">
                        Trả lời tự động 24/7
                      </p>
                    </div>
                  </button>

                  
                  {/* Other chat rooms (excluding admin rooms since we show pinned one above) */}
                  
                {filteredRooms.filter(room => room.room_type !== 'admin').map(room => {
                    const isGroup = (room as any).is_group;
                    // Get the other user's profile (not current user)
                    const otherProfile = room.user_id === user?.id 
                      ? room.target_user_profile 
                      : room.user_profile;
                    const displayName = (room as any).group_name || room.subject || otherProfile?.full_name || otherProfile?.email?.split('@')[0] || 'Người dùng';
                    const avatarUrl = (room as any).group_avatar_url || otherProfile?.avatar_url;
                    const initials = displayName.charAt(0).toUpperCase();
                    
                    return (
                      <button
                        key={room.id}
                        onClick={() => { setSelectedRoomId(room.id); setIsAIChatMode(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                          "hover:bg-secondary/80",
                          selectedRoomId === room.id && "bg-blue-500/10"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-14 w-14">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={displayName} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                              {isGroup ? <Users className="h-6 w-6" /> : initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-[3px] border-card rounded-full" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{displayName}</p>
                            {isGroup && (
                              <Users className="h-3 w-3 text-purple-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <span>Nhấn để xem</span>
                            <span>·</span>
                            <span>{room.last_message_at && formatMessageTime(new Date(room.last_message_at))}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col bg-background",
            !selectedRoomId && !isAIChatMode && "hidden md:flex"
          )}>
            {/* AI Chat Mode */}
            {isAIChatMode ? (
              <>
                {/* AI Chat Header - same as regular chat */}
                <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-card">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="md:hidden rounded-full"
                    onClick={() => setIsAIChatMode(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      AI Assistant
                    </p>
                    <p className="text-xs text-green-600">Đang hoạt động</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full text-emerald-500">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Cài đặt AI
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* AI Messages - Messenger style (same as support chat) */}
                <ScrollArea className="flex-1 px-4">
                  {allAIMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white text-2xl">
                          <Bot className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-lg">AI Assistant</p>
                      <p className="text-sm text-muted-foreground mt-1">Bắt đầu cuộc trò chuyện</p>
                    </div>
                  ) : (
                    <div className="min-h-full flex flex-col justify-end py-4 space-y-0.5">
                      {allAIMessages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        const prevMsg = allAIMessages[index - 1];
                        const nextMsg = allAIMessages[index + 1];
                        const showAvatar = !nextMsg || nextMsg.role !== msg.role;
                        const isConsecutive = prevMsg?.role === msg.role;
                        
                        // Show time separator every 5 minutes
                        const showTime = !prevMsg || (
                          msg.created_at && prevMsg.created_at && 
                          differenceInMinutes(new Date(msg.created_at), new Date(prevMsg.created_at)) >= 5
                        );
                        
                        return (
                          <div key={msg.id}>
                            {/* Time separator */}
                            {showTime && msg.created_at && (
                              <div className="flex justify-center my-4">
                                <span className="text-xs text-muted-foreground px-3 py-1">
                                  {formatMessageTime(new Date(msg.created_at))}
                                </span>
                              </div>
                            )}

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex gap-2 items-end group",
                                isUser && "flex-row-reverse",
                                !isConsecutive && !showTime && "mt-2"
                              )}
                            >
                              {/* Avatar - only for AI messages */}
                              {!isUser && (
                                <div className="w-7 shrink-0">
                                  {showAvatar && (
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white text-xs">
                                        <Bot className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}
                              
                              {/* Message bubble */}
                              <div className={cn(
                                "max-w-[70%] relative",
                                isUser && "items-end"
                              )}>
                                {(() => {
                                  const stickerMatch = msg.content.match(/^\[sticker:(https?:\/\/[^\]]+)\]$/);
                                  const isLikeEmoji = msg.content === '👍';
                                  
                                  if (isLikeEmoji) {
                                    return <span className="text-4xl">👍</span>;
                                  }
                                  
                                  if (stickerMatch) {
                                    return (
                                      <img 
                                        src={stickerMatch[1]} 
                                        alt="Sticker" 
                                        className="w-24 h-24 object-contain"
                                      />
                                    );
                                  }
                                  
                                  return (
                                    <div className={cn(
                                      "px-3 py-2 rounded-2xl relative",
                                      isUser 
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                                        : "bg-secondary",
                                      showAvatar && (isUser 
                                        ? "rounded-br-sm" 
                                        : "rounded-bl-sm")
                                    )}>
                                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                        {msg.content}
                                      </p>
                                      {msg.id === 'streaming' && (
                                        <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                      {isStreaming && !streamingContent && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2 items-end mt-2"
                        >
                          <div className="w-7 shrink-0">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white text-xs">
                                <Bot className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* AI Input - same as regular chat */}
                <div className="p-3 bg-card border-t border-border">
                  <div className="flex items-center gap-2">
                    {/* Image upload button (disabled for AI chat) */}
                    <div className="flex items-center gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full text-blue-500 hover:bg-blue-500/10"
                        disabled
                        title="Gửi ảnh chưa hỗ trợ trong chat AI"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        placeholder="Aa"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendAIMessage();
                          }
                        }}
                        disabled={isStreaming}
                        className="rounded-full bg-secondary border-0 h-10 pr-10"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <EmojiStickerPicker 
                          onEmojiSelect={(emoji) => {
                            setNewMessage(prev => prev + emoji);
                            inputRef.current?.focus();
                          }}
                          onStickerSelect={(sticker) => {
                            // Send sticker with URL marker for AI chat
                            if (sticker.url) {
                              handleSendAIMessage(`[sticker:${sticker.url}]`);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Send/Like Button */}
                    {newMessage.trim() ? (
                      <Button 
                        onClick={() => handleSendAIMessage()}
                        disabled={isStreaming}
                        size="icon"
                        className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600"
                      >
                        {isStreaming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSendAIMessage('👍')}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-2xl hover:bg-blue-500/10"
                        disabled={isStreaming}
                      >
                        👍
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : selectedRoomId ? (
              (() => {
                const isAdminRoom = selectedRoom?.room_type === 'admin';
                const isGroup = (selectedRoom as any)?.is_group;
                const otherProfile = selectedRoom?.user_id === user?.id 
                  ? selectedRoom?.target_user_profile 
                  : selectedRoom?.user_profile;
                const displayName = (selectedRoom as any)?.group_name || (selectedRoom as any)?.nickname || selectedRoom?.subject || otherProfile?.full_name || otherProfile?.email?.split('@')[0] || 'Hỗ trợ khách hàng';
                const avatarUrl = (selectedRoom as any)?.group_avatar_url || otherProfile?.avatar_url;
                const initials = displayName.charAt(0).toUpperCase();

                return (
                  <>
                    {/* Chat Header */}
                    <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-card">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="md:hidden rounded-full"
                        onClick={() => setSelectedRoomId(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={displayName} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {isAdminRoom ? <Shield className="h-4 w-4" /> : isGroup ? <Users className="h-4 w-4" /> : initials}
                          </AvatarFallback>
                        </Avatar>
                        {!isAdminRoom && !isGroup && otherProfile?.user_id && (
                          <OnlineIndicator 
                            userId={otherProfile.user_id} 
                            size="md"
                            className="absolute bottom-0 right-0"
                          />
                        )}
                        {isAdminRoom && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {displayName}
                        </p>
                        {!isAdminRoom && !isGroup && otherProfile?.user_id ? (
                          <OnlineIndicator userId={otherProfile.user_id} showLastSeen />
                        ) : isAdminRoom ? (
                          <p className="text-xs text-green-600">Đang hoạt động</p>
                        ) : null}
                      </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full text-blue-500">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ChatSettingsDialog
                          roomId={selectedRoomId!}
                          currentEmoji={(selectedRoom as any)?.quick_reaction_emoji}
                          currentBackground={(selectedRoom as any)?.background_theme}
                          currentNickname={(selectedRoom as any)?.nickname}
                          onUpdate={refetchRooms}
                        >
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Settings className="h-4 w-4 mr-2" />
                            Tùy chỉnh cuộc trò chuyện
                          </DropdownMenuItem>
                        </ChatSettingsDialog>
                        <GroupMemberNicknameDialog
                          roomId={selectedRoomId!}
                          isGroup={isGroup}
                          onUpdate={refetchRooms}
                        >
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Users className="h-4 w-4 mr-2" />
                            {isGroup ? 'Thành viên & Biệt danh' : 'Đặt biệt danh'}
                          </DropdownMenuItem>
                        </GroupMemberNicknameDialog>
                        {!isAdminRoom && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteRoomId(selectedRoomId)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa cuộc trò chuyện
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className={cn("flex-1 px-4", getBackgroundClass((selectedRoom as any)?.background_theme || 'default'))}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Avatar className="h-20 w-20 mb-4">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                          <Shield className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-lg">{selectedRoom?.subject || 'Hỗ trợ khách hàng'}</p>
                      <p className="text-sm text-muted-foreground mt-1">Bắt đầu cuộc trò chuyện</p>
                    </div>
                  ) : (
                    <div className="min-h-full flex flex-col justify-end py-4 space-y-0.5">
                      {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        const prevMsg = messages[index - 1];
                        const nextMsg = messages[index + 1];
                        const showTime = shouldShowTime(msg, prevMsg);
                        const showAvatar = shouldShowAvatar(msg, nextMsg);
                        const isConsecutive = prevMsg?.sender_id === msg.sender_id && !showTime;
                        const isLikeEmoji = msg.message === '👍';

                        return (
                          <div key={msg.id}>
                            {/* Time separator */}
                            {showTime && (
                              <div className="flex justify-center my-4">
                                <span className="text-xs text-muted-foreground px-3 py-1">
                                  {formatMessageTime(new Date(msg.created_at))}
                                </span>
                              </div>
                            )}

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex gap-2 items-end group",
                                isOwn && "flex-row-reverse",
                                !isConsecutive && "mt-2"
                              )}
                            >
                              {/* Avatar - only for non-own messages */}
                              {!isOwn && (
                                <div className="w-7 shrink-0">
                                  {showAvatar && (
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                        <Shield className="h-3 w-3" />
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}
                              
                              {/* Message bubble */}
                              <div className={cn(
                                "max-w-[70%] relative",
                                isOwn && "items-end"
                              )}>
                                {(() => {
                                  const attachments = (msg.attachments as any[]) || [];
                                  const hasSticker = attachments.some(att => att.type === 'sticker');
                                  const isStickerOnly = hasSticker && !msg.message;
                                  
                                  if (isLikeEmoji) {
                                    return <span className="text-4xl">👍</span>;
                                  }
                                  
                                  if (isStickerOnly) {
                                    return <MessageAttachments attachments={attachments} />;
                                  }
                                  
                                  return (
                                    <div className={cn(
                                      "px-3 py-2 rounded-2xl relative",
                                      isOwn 
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
                                        : "bg-secondary",
                                      showAvatar && (isOwn 
                                        ? "rounded-br-sm" 
                                        : "rounded-bl-sm")
                                    )}>
                                      {msg.message && (
                                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                          {msg.message}
                                        </p>
                                      )}
                                      <MessageAttachments attachments={attachments} />
                                    </div>
                                  );
                                })()}


                                {/* Read receipt */}
                                {isOwn && showAvatar && (
                                  <div className="flex justify-end mt-1">
                                    <ReadReceipt 
                                      isRead={msg.is_read} 
                                      readAt={msg.read_at}
                                      isSender={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Typing Indicator */}
                <TypingIndicator typingUsers={typingUsers} />

                {/* Input Area */}
                <div className="p-3 bg-card border-t border-border">
                  {/* Attachment Preview */}
                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 mb-3 px-2"
                      >
                        {attachments.map((url, i) => (
                          <div key={i} className="relative group">
                            <img 
                              src={url} 
                              alt="" 
                              className="h-20 w-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-foreground rounded-full flex items-center justify-center shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {/* Action buttons - Images always enabled */}
                    <div className="flex items-center gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full text-blue-500 hover:bg-blue-500/10"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        placeholder="Aa"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          setTyping(e.target.value.length > 0);
                        }}
                        onBlur={() => setTyping(false)}
                        onKeyDown={handleKeyPress}
                        className="rounded-full bg-secondary border-0 h-10 pr-10"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <EmojiStickerPicker 
                          onEmojiSelect={(emoji) => {
                            setNewMessage(prev => prev + emoji);
                            inputRef.current?.focus();
                          }}
                          onStickerSelect={handleSendSticker}
                        />
                      </div>
                    </div>

                    {/* Send/Like Button */}
                    {newMessage.trim() || attachments.length > 0 ? (
                      <Button 
                        onClick={handleSendMessage}
                        disabled={sendMessage.isPending}
                        size="icon"
                        className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600"
                      >
                        {sendMessage.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSendQuickReaction()}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-2xl hover:bg-blue-500/10"
                      >
                        {(selectedRoom as any)?.quick_reaction_emoji || '👍'}
                      </Button>
                    )}
                  </div>
                </div>
                  </>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tin nhắn của bạn</h2>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Chọn cuộc trò chuyện để bắt đầu nhắn tin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Room Confirmation Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ tin nhắn trong cuộc trò chuyện này sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  // Render with or without Layout based on mobile + selectedRoomId/isAIChatMode
  if (isMobileWithChat) {
    return chatUI;
  }
  
  return <Layout>{chatUI}</Layout>;
};

export default ChatPage;
