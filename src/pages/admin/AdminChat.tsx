import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminChatRooms, useChatMessages, useSendMessage, useCloseChatRoom, useAdminChatRealtimeNotification, ChatAttachment } from '@/hooks/useLiveChat';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { MessageCircle, Loader2, CheckCircle, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatMessageInput from '@/components/chat/ChatMessageInput';
import MessageAttachments from '@/components/chat/MessageAttachments';

const AdminChat = () => {
  const { user } = useAdminAuth();
  const { data: rooms, isLoading: roomsLoading } = useAdminChatRooms();
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedRoomId || '');
  const sendMessage = useSendMessage();
  const closeRoom = useCloseChatRoom();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enable realtime notifications
  useAdminChatRealtimeNotification();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    if (!selectedRoomId) return;
    if (!message.trim() && attachments.length === 0) return;
    
    await sendMessage.mutateAsync({
      roomId: selectedRoomId,
      message: message.trim(),
      senderType: 'admin',
      attachments
    });
  };

  const handleCloseRoom = () => {
    if (!selectedRoomId) return;
    if (confirm('Bạn có chắc muốn đóng cuộc trò chuyện này?')) {
      closeRoom.mutate(selectedRoomId);
    }
  };

  const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
  const openRooms = rooms?.filter(r => r.status === 'open') || [];
  const closedRooms = rooms?.filter(r => r.status === 'closed') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Chat Support</h1>
        <p className="text-muted-foreground">Quản lý và trả lời tin nhắn từ khách hàng</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Room List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cuộc trò chuyện</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <Tabs defaultValue="open" className="h-full flex flex-col">
              <TabsList className="mx-4 mb-2">
                <TabsTrigger value="open">Đang mở ({openRooms.length})</TabsTrigger>
                <TabsTrigger value="closed">Đã đóng ({closedRooms.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="open" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  {roomsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : openRooms.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {openRooms.map(room => (
                        <button
                          key={room.id}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-colors',
                            selectedRoomId === room.id ? 'bg-primary/10' : 'hover:bg-muted'
                          )}
                          onClick={() => setSelectedRoomId(room.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={(room.user_profile as any)?.avatar_url} />
                              <AvatarFallback>
                                {((room.user_profile as any)?.full_name || (room.user_profile as any)?.email || '?')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {(room.user_profile as any)?.full_name || (room.user_profile as any)?.email || 'Khách'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(room.last_message_at).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Không có cuộc trò chuyện nào</p>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="closed" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  {closedRooms.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {closedRooms.map(room => (
                        <button
                          key={room.id}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-colors opacity-60',
                            selectedRoomId === room.id ? 'bg-primary/10' : 'hover:bg-muted'
                          )}
                          onClick={() => setSelectedRoomId(room.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {((room.user_profile as any)?.email || '?')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {(room.user_profile as any)?.full_name || (room.user_profile as any)?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">Đã đóng</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Không có</p>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedRoomId ? (
            <>
              <CardHeader className="pb-2 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={(selectedRoom?.user_profile as any)?.avatar_url} />
                      <AvatarFallback>
                        {((selectedRoom?.user_profile as any)?.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {(selectedRoom?.user_profile as any)?.full_name || (selectedRoom?.user_profile as any)?.email}
                      </p>
                      <Badge variant={selectedRoom?.status === 'open' ? 'default' : 'secondary'}>
                        {selectedRoom?.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                      </Badge>
                    </div>
                  </div>
                  {selectedRoom?.status === 'open' && (
                    <Button variant="outline" size="sm" onClick={handleCloseRoom}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Đóng
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map(msg => {
                        const isAdmin = msg.sender_type === 'admin';
                        const userName = (selectedRoom?.user_profile as any)?.full_name || 
                                        (selectedRoom?.user_profile as any)?.email || 
                                        'Khách hàng';
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex gap-2',
                              isAdmin ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {/* User avatar on left */}
                            {!isAdmin && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={(selectedRoom?.user_profile as any)?.avatar_url} />
                                <AvatarFallback className="bg-secondary">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              'max-w-[70%] flex flex-col',
                              isAdmin ? 'items-end' : 'items-start'
                            )}>
                              {/* Sender name */}
                              <span className={cn(
                                'text-xs font-medium mb-1',
                                isAdmin ? 'text-primary' : 'text-muted-foreground'
                              )}>
                                {isAdmin ? 'Admin' : userName}
                              </span>
                              
                              {/* Message bubble */}
                              <MessageAttachments attachments={(msg as any).attachments || []} />
                              {msg.message && (
                              <div
                                className={cn(
                                  'rounded-2xl px-4 py-2',
                                  isAdmin
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-muted rounded-bl-sm'
                                )}
                              >
                                {msg.message}
                              </div>
                              )}
                              
                              {/* Timestamp */}
                              <span className="text-[10px] text-muted-foreground mt-1">
                                {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            {/* Admin avatar on right */}
                            {isAdmin && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  <Shield className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Chưa có tin nhắn</p>
                  )}
                </ScrollArea>

                {selectedRoom?.status === 'open' && (
                  <div className="p-4 border-t">
                    <ChatMessageInput
                      onSend={handleSendMessage}
                      placeholder="Nhập tin nhắn..."
                      disabled={sendMessage.isPending}
                    />
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminChat;
