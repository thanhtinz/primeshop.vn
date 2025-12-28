import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, Loader2, Shield, CheckCircle, User, Store, RotateCcw
} from 'lucide-react';
import { 
  useSellerTickets, useSellerTicketMessages, useSendSellerTicketMessage,
  useInviteAdminToTicket, useMarkTicketResolved, useReopenTicket,
  SellerTicket, SellerTicketAttachment
} from '@/hooks/useSellerTickets';
import { Seller } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';
import ChatMessageInput, { ChatAttachment } from '@/components/chat/ChatMessageInput';
import MessageAttachments from '@/components/chat/MessageAttachments';

interface SellerSupportTicketsProps {
  seller: Seller;
}

export function SellerSupportTickets({ seller }: SellerSupportTicketsProps) {
  const { data: tickets = [], isLoading } = useSellerTickets();
  const [selectedTicket, setSelectedTicket] = useState<SellerTicket | null>(null);
  const { formatDateTime } = useDateFormat();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-500">Mới</Badge>;
      case 'pending':
        return <Badge variant="secondary">Chờ khách</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Đã giải quyết</Badge>;
      case 'closed':
        return <Badge variant="outline">Đóng</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Hỗ trợ khách hàng</h2>
        <p className="text-sm text-muted-foreground">Ticket từ khách hàng của bạn</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Chưa có ticket nào từ khách hàng</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                      {getStatusBadge(ticket.status)}
                      {ticket.admin_joined && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {ticket.buyer_resolved && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Khách xác nhận
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      Khách: {ticket.buyer?.email || 'N/A'}
                      {ticket.order && ` • Đơn: ${ticket.order.order_number}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(ticket.updated_at, 'dd/MM HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b bg-muted/30">
            <DialogTitle className="flex items-center gap-2 flex-wrap text-base">
              <span className="font-mono text-xs text-muted-foreground">{selectedTicket?.ticket_number}</span>
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket?.admin_joined && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <TicketConversation 
              ticket={selectedTicket}
              sellerId={seller.id}
              onUpdate={() => setSelectedTicket(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketConversation({ 
  ticket,
  sellerId,
  onUpdate
}: { 
  ticket: SellerTicket;
  sellerId: string;
  onUpdate: () => void;
}) {
  const { data: messages = [], isLoading } = useSellerTicketMessages(ticket.id);
  const sendMessage = useSendSellerTicketMessage();
  const inviteAdmin = useInviteAdminToTicket();
  const markResolved = useMarkTicketResolved();
  const reopenTicket = useReopenTicket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { formatDateTime } = useDateFormat();

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendReply = async (message: string, attachments: ChatAttachment[]) => {
    if (!message.trim() && attachments.length === 0) return;
    try {
      const ticketAttachments: SellerTicketAttachment[] = attachments.map(a => ({
        type: a.type,
        url: a.url,
        sticker: a.sticker
      }));
      
      await sendMessage.mutateAsync({
        ticketId: ticket.id,
        message: message.trim(),
        senderType: 'seller',
        attachments: ticketAttachments
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleInviteAdmin = async () => {
    try {
      await inviteAdmin.mutateAsync(ticket.id);
      toast.success('Đã mời admin tham gia');
    } catch (error: any) {
      console.error('Invite admin failed:', error);
      toast.error(error.message || 'Không thể mời admin');
    }
  };

  const handleMarkResolved = async () => {
    try {
      await markResolved.mutateAsync({ ticketId: ticket.id, party: 'seller' });
      toast.success('Đã đánh dấu là đã giải quyết');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenTicket.mutateAsync({ ticketId: ticket.id, party: 'seller' });
      toast.success('Đã mở lại ticket');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const isClosed = ticket.status === 'closed';

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-[70vh] max-h-[500px]">
      {/* Ticket Info Header */}
      <div className="px-4 py-3 bg-muted/50 border-b text-sm">
        <p className="font-medium">{ticket.subject}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          Khách: {ticket.buyer?.email}
          {ticket.order && ` • Đơn: ${ticket.order.order_number}`}
        </p>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.map((msg) => {
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
                    {formatDateTime(msg.created_at, 'HH:mm')}
                  </span>
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={msg.id}
              className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isSeller ? 'order-1' : 'order-2'}`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isSeller ? 'justify-end' : 'justify-start'}`}>
                  {!isSeller && (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-muted'
                    }`}>
                      {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {isSeller ? 'Bạn' : isAdmin ? 'Admin' : 'Khách'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(msg.created_at, 'HH:mm')}
                  </span>
                  {isSeller && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Store className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </div>
                {msg.message && (
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  isSeller 
                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                    : isAdmin
                    ? 'bg-amber-100 text-amber-900 border border-amber-200 rounded-bl-md'
                    : 'bg-muted rounded-bl-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
                )}
                
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <MessageAttachments attachments={msg.attachments} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      {!isClosed ? (
        <div className="border-t p-3 space-y-2 bg-background">
          <ChatMessageInput
            onSend={handleSendReply}
            placeholder="Nhập phản hồi..."
            disabled={sendMessage.isPending}
          />
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!ticket.admin_joined && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleInviteAdmin}
                disabled={inviteAdmin.isPending}
                className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                {inviteAdmin.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-1" />
                )}
                Mời Admin
              </Button>
            )}
            {ticket.admin_joined && (
              <Badge variant="outline" className="h-8 px-3 text-amber-600 border-amber-300">
                <Shield className="h-3 w-3 mr-1" />
                Admin đã tham gia
              </Badge>
            )}
            {!ticket.seller_resolved && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkResolved}
                disabled={markResolved.isPending}
                className="h-8 text-green-600 border-green-200 hover:bg-green-50"
              >
                {markResolved.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Đã giải quyết
              </Button>
            )}
            {ticket.seller_resolved && (
              <Badge variant="outline" className="h-8 px-3 text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Bạn đã xác nhận
              </Badge>
            )}
            {ticket.buyer_resolved && (
              <Badge variant="outline" className="h-8 px-3 text-blue-600 border-blue-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Khách đã xác nhận
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ticket đã đóng
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReopen}
              disabled={reopenTicket.isPending}
            >
              {reopenTicket.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Mở lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}