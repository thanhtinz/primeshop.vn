import React, { useState, useRef, useEffect } from 'react';
import { 
  useMyTicketsToSellers, 
  useSellerTicketMessages, 
  useSendSellerTicketMessage,
  useBuyerInviteAdminToTicket,
  useMarkTicketResolved,
  useReopenTicket,
  SellerTicketAttachment
} from '@/hooks/useSellerTickets';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Store, Clock, User, Shield, CheckCircle, RotateCcw } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ChatMessageInput, { ChatAttachment } from '@/components/chat/ChatMessageInput';
import MessageAttachments from '@/components/chat/MessageAttachments';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Đang mở', variant: 'default' },
  pending: { label: 'Chờ phản hồi', variant: 'secondary' },
  resolved: { label: 'Đã giải quyết', variant: 'outline' },
  closed: { label: 'Đã đóng', variant: 'destructive' }
};

export const BuyerShopTickets = () => {
  const { t, language } = useLanguage();
  const { formatDateTime } = useDateFormat();
  const { data: tickets, isLoading } = useMyTicketsToSellers();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('shopSupport')}
          </CardTitle>
          <CardDescription>
            {t('shopSupportDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noShopTickets')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('shopSupport')}
          </CardTitle>
          <CardDescription>
            {t('shopSupportDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket: any) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            return (
              <div
                key={ticket.id}
                className="p-4 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm truncate">
                        {ticket.seller?.shop_name || 'Shop'}
                      </span>
                    </div>
                    <p className="font-medium truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(ticket.created_at)}
                      <span className="text-muted-foreground/50">•</span>
                      <span>#{ticket.ticket_number}</span>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl h-[80vh] max-h-[600px] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedTicket?.seller?.shop_avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Store className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">
                  {selectedTicket?.seller?.shop_name || 'Shop'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedTicket?.subject} • #{selectedTicket?.ticket_number}
                </p>
              </div>
              <Badge variant={statusConfig[selectedTicket?.status]?.variant || 'default'}>
                {statusConfig[selectedTicket?.status]?.label || selectedTicket?.status}
              </Badge>
            </div>
          </DialogHeader>
          {selectedTicket && (
            <TicketConversation 
              ticket={selectedTicket} 
              onClose={() => setSelectedTicket(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const TicketConversation = ({ ticket, onClose }: { ticket: any; onClose: () => void }) => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const { formatDateTime } = useDateFormat();
  const { data: messages, isLoading } = useSellerTicketMessages(ticket.id);
  const sendMessage = useSendSellerTicketMessage();
  const inviteAdmin = useBuyerInviteAdminToTicket();
  const markResolved = useMarkTicketResolved();
  const reopenTicket = useReopenTicket();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (message: string, attachments: ChatAttachment[]) => {
    if (!message.trim() && attachments.length === 0) return;
    
    const ticketAttachments: SellerTicketAttachment[] = attachments.map(a => ({
      type: a.type,
      url: a.url,
      sticker: a.sticker
    }));
    
    await sendMessage.mutateAsync({
      ticketId: ticket.id,
      message: message.trim(),
      senderType: 'buyer',
      attachments: ticketAttachments
    });
  };

  const handleInviteAdmin = async () => {
    try {
      await inviteAdmin.mutateAsync(ticket.id);
      toast.success('Đã mời Admin tham gia hỗ trợ');
    } catch (error) {
      toast.error('Không thể mời Admin');
    }
  };

  const handleMarkResolved = async () => {
    try {
      await markResolved.mutateAsync({ ticketId: ticket.id, party: 'buyer' });
      toast.success('Đã đánh dấu là đã giải quyết');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenTicket.mutateAsync({ ticketId: ticket.id, party: 'buyer' });
      toast.success('Đã mở lại ticket');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const isClosed = ticket.status === 'closed';
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Bạn';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages?.map((msg: any) => {
              const isBuyer = msg.sender_type === 'buyer';
              const isSeller = msg.sender_type === 'seller';
              const isAdmin = msg.sender_type === 'admin';
              const isSystem = msg.message.startsWith('🛡️') || msg.message.startsWith('✅') || msg.message.startsWith('🔄') || msg.message.startsWith('🔒') || msg.message.startsWith('🔓');
              
              // System message - centered
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-muted/50 border border-border/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
                      {msg.message}
                      <span className="ml-2 opacity-70">
                        {formatDateTime(msg.created_at, 'HH:mm dd/MM')}
                      </span>
                    </div>
                  </div>
                );
              }
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isBuyer ? 'flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {isBuyer ? (
                      <>
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : isAdmin ? (
                      <AvatarFallback className="bg-destructive/10 text-destructive">
                        <Shield className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={ticket.seller?.shop_avatar_url} />
                        <AvatarFallback className="bg-secondary">
                          <Store className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>

                  {/* Message content */}
                  <div className={cn(
                    'flex-1 max-w-[80%] flex flex-col',
                    isBuyer ? 'items-end' : 'items-start'
                  )}>
                    {/* Sender name */}
                    <span className={cn(
                      'text-xs font-medium mb-1',
                      isBuyer ? 'text-primary' : isAdmin ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {isBuyer ? userName : isAdmin ? 'Admin' : ticket.seller?.shop_name || 'Shop'}
                    </span>

                    {/* Message bubble */}
                    {msg.message && (
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5',
                      isBuyer
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : isAdmin
                          ? 'bg-destructive/10 border border-destructive/20 rounded-bl-sm'
                          : 'bg-muted rounded-bl-sm'
                    )}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    )}
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} />
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {formatDateTime(msg.created_at, 'HH:mm dd/MM')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t flex-shrink-0 bg-muted/30">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {!ticket.admin_joined && !isClosed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleInviteAdmin}
              disabled={inviteAdmin.isPending}
            >
              {inviteAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
              Mời Admin
            </Button>
          )}
          {ticket.admin_joined && !isClosed && (
            <Badge variant="secondary" className="h-8 px-3">
              <Shield className="h-3 w-3 mr-1" />
              Admin đã tham gia
            </Badge>
          )}
          {!isClosed && !ticket.buyer_resolved && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkResolved}
              disabled={markResolved.isPending}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              {markResolved.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Đã giải quyết
            </Button>
          )}
          {!isClosed && ticket.buyer_resolved && (
            <Badge variant="outline" className="h-8 px-3 text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Bạn đã xác nhận
            </Badge>
          )}
          {!isClosed && ticket.seller_resolved && (
            <Badge variant="outline" className="h-8 px-3 text-blue-600 border-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Shop đã xác nhận
            </Badge>
          )}
          {isClosed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReopen}
              disabled={reopenTicket.isPending}
            >
              {reopenTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              Mở lại ticket
            </Button>
          )}
        </div>

        {/* Message input */}
        {!isClosed ? (
          <ChatMessageInput
            onSend={handleSend}
            placeholder={t('typeMessage')}
            disabled={sendMessage.isPending}
          />
        ) : (
          <p className="text-center text-muted-foreground text-sm py-2">
            {t('ticketClosed')}
          </p>
        )}
      </div>
    </div>
  );
};

export default BuyerShopTickets;
