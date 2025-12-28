import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Send, Loader2, Store, User, ArrowLeft, Image
} from 'lucide-react';
import { 
  useSellerChatRooms, useSellerChatMessages, useSendSellerMessage, 
  useMarkSellerMessagesRead, useSellerUnreadCount, SellerChatRoom
} from '@/hooks/useSellerChat';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SellerChatManagerProps {
  sellerId: string;
  shopName: string;
  shopAvatar?: string | null;
}

export function SellerChatManager({ sellerId, shopName, shopAvatar }: SellerChatManagerProps) {
  const { formatRelative, formatDateTime } = useDateFormat();
  const [selectedRoom, setSelectedRoom] = useState<SellerChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useSellerChatRooms(sellerId);
  const { data: messages = [], isLoading: messagesLoading } = useSellerChatMessages(selectedRoom?.id);
  const { data: unreadCount = 0 } = useSellerUnreadCount(sellerId);
  const sendMessage = useSendSellerMessage();
  const markRead = useMarkSellerMessagesRead();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when opening room
  useEffect(() => {
    if (selectedRoom?.id) {
      markRead.mutate(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

  const handleSendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;

    await sendMessage.mutateAsync({
      roomId: selectedRoom.id,
      message: newMessage
    });
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `seller-chat/${sellerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      await sendMessage.mutateAsync({
        roomId: selectedRoom.id,
        message: '📷 Đã gửi một ảnh',
        attachments: [{ type: 'image', url: publicUrl }]
      });
    } catch (error) {
      toast.error('Không thể gửi ảnh');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (roomsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Rooms List */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col",
        selectedRoom && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Tin nhắn
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
            )}
          </h3>
        </div>

        <ScrollArea className="flex-1">
          {rooms.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Chưa có tin nhắn nào
            </div>
          ) : (
            <div className="divide-y">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedRoom?.id === room.id && "bg-muted"
                  )}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={room.user_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {room.user_profile?.full_name || room.user_profile?.email?.split('@')[0] || 'Người dùng'}
                        </span>
                        {room.unread_count! > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {room.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.last_message || 'Chưa có tin nhắn'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {room.last_message_at && formatRelative(room.last_message_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedRoom && "hidden md:flex"
      )}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedRoom(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedRoom.user_profile?.avatar_url || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {selectedRoom.user_profile?.full_name || selectedRoom.user_profile?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  Đang trả lời với tư cách: {shopName}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isShop = msg.sender_type === 'shop';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          isShop && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          {isShop ? (
                            <>
                              <AvatarImage src={shopAvatar || undefined} />
                              <AvatarFallback>
                                <Store className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src={selectedRoom.user_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div className={cn(
                          "max-w-[70%] space-y-1",
                          isShop && "items-end"
                        )}>
                          <div className={cn(
                            "px-3 py-2 rounded-lg",
                            isShop 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            {msg.attachments && Array.isArray(msg.attachments) && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att: any, idx: number) => (
                                  att.type === 'image' && (
                                    <img
                                      key={idx}
                                      src={att.url}
                                      alt=""
                                      className="max-w-full rounded cursor-pointer"
                                      onClick={() => window.open(att.url, '_blank')}
                                    />
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs text-muted-foreground",
                            isShop && "text-right"
                          )}>
                            {formatDateTime(msg.created_at, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessage.isPending || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Store className="h-3 w-3" />
                Tin nhắn sẽ được gửi với danh tính: {shopName}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chọn một cuộc trò chuyện</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
