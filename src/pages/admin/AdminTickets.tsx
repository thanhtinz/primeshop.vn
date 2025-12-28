import { useState, useRef, useEffect } from 'react';
import { useAdminTickets, useTicketDetail, TicketAttachment } from '@/hooks/useTickets';
import { 
  useAdminSellerTickets, 
  useSellerTicketMessages, 
  useAdminSendSellerTicketMessage,
  useAdminUpdateSellerTicketStatus,
  useAdminMarkTicketResolved,
  useAdminReopenTicket,
  SellerTicket 
} from '@/hooks/useSellerTickets';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Search, User, Shield, Store, Loader2, CheckCircle, RotateCcw, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ChatMessageInput, { ChatAttachment } from '@/components/chat/ChatMessageInput';
import MessageAttachments from '@/components/chat/MessageAttachments';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Mở', variant: 'default' },
  pending: { label: 'Chờ xử lý', variant: 'secondary' },
  resolved: { label: 'Đã giải quyết', variant: 'outline' },
  closed: { label: 'Đã đóng', variant: 'outline' },
};

const categories: Record<string, string> = {
  general: 'Câu hỏi chung',
  order: 'Vấn đề đơn hàng',
  payment: 'Thanh toán',
  account: 'Tài khoản',
  technical: 'Kỹ thuật',
  other: 'Khác',
};

// User Ticket Detail Dialog
function TicketDetailDialog({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { user: adminUser } = useAdminAuth();
  const { ticket, messages, isLoading, sendMessage } = useTicketDetail(ticketId);
  const { updateTicketStatus, sendAdminMessage } = useAdminTickets();
  const [status, setStatus] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    if (!adminUser) return;
    if (!message.trim() && attachments.length === 0) return;
    
    const ticketAttachments: TicketAttachment[] = attachments.map(a => ({
      type: a.type,
      url: a.url,
      sticker: a.sticker
    }));
    
    await sendAdminMessage.mutateAsync({
      ticketId,
      message: message.trim(),
      adminId: adminUser.id,
      attachments: ticketAttachments
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateTicketStatus.mutateAsync({ ticketId, status: newStatus });
    setStatus(newStatus);
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <p className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</p>
          <h3 className="font-semibold">{ticket.subject}</h3>
          <p className="text-sm text-muted-foreground">{categories[ticket.category]}</p>
        </div>
        <Select value={status || ticket.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Mở</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        <div className="space-y-4 pr-4">
          {messages?.map((msg) => {
            const isAdmin = msg.sender_type === 'admin';
            return (
              <div
                key={msg.id}
                className={cn('flex gap-3', isAdmin ? 'flex-row-reverse' : '')}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                    {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                    <div className={cn('max-w-[75%] flex flex-col', isAdmin ? 'items-end' : 'items-start')}>
                      <span className={cn('text-xs font-medium mb-1', isAdmin ? 'text-primary' : 'text-muted-foreground')}>
                        {isAdmin ? 'Admin' : 'Khách hàng'}
                      </span>
                      <MessageAttachments attachments={(msg as any).attachments || []} />
                      {msg.message && (
                      <div className={cn(
                        'rounded-2xl px-4 py-2.5',
                        isAdmin ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      )}
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), 'HH:mm dd/MM', { locale: vi })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pt-3 border-t">
        {!isClosed ? (
          <ChatMessageInput
            onSend={handleSendMessage}
            placeholder="Nhập phản hồi..."
            disabled={sendAdminMessage.isPending}
          />
        ) : (
          <p className="text-center text-muted-foreground text-sm py-2">Ticket đã đóng</p>
        )}
      </div>
    </div>
  );
}

// Check if message is a system message
const isSystemMessage = (message: string) => {
  return message.startsWith('🛡️') || message.startsWith('✅') || message.startsWith('🔄') || message.startsWith('🔒') || message.startsWith('🔓');
};

// Marketplace Seller Ticket Detail Dialog
function SellerTicketDetailDialog({ ticket, onClose }: { ticket: SellerTicket; onClose: () => void }) {
  const { user: adminUser } = useAdminAuth();
  const { data: messages, isLoading } = useSellerTicketMessages(ticket.id);
  const sendMessage = useAdminSendSellerTicketMessage();
  const updateStatus = useAdminUpdateSellerTicketStatus();
  const adminResolve = useAdminMarkTicketResolved();
  const adminReopen = useAdminReopenTicket();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !adminUser) return;
    await sendMessage.mutateAsync({
      ticketId: ticket.id,
      message: newMessage,
      adminId: adminUser.id,
    });
    setNewMessage('');
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({ id: ticket.id, status: newStatus as SellerTicket['status'] });
  };

  const handleAdminResolve = async () => {
    if (!adminUser) return;
    await adminResolve.mutateAsync({ ticketId: ticket.id, adminId: adminUser.id });
  };

  const handleAdminReopen = async () => {
    if (!adminUser) return;
    await adminReopen.mutateAsync({ ticketId: ticket.id, adminId: adminUser.id });
  };

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-mono">{ticket.ticket_number}</p>
          <h3 className="font-semibold truncate">{ticket.subject}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Store className="h-3 w-3" />
            <span>{ticket.seller?.shop_name}</span>
            <span>↔</span>
            <User className="h-3 w-3" />
            <span>{ticket.buyer?.full_name || ticket.buyer?.email}</span>
          </div>
          {ticket.order && (
            <p className="text-xs text-muted-foreground mt-1">Đơn hàng: #{ticket.order.order_number}</p>
          )}
          {/* Resolution status badges */}
          <div className="flex items-center gap-2 mt-2">
            {ticket.buyer_resolved && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Người mua đã xác nhận
              </Badge>
            )}
            {ticket.seller_resolved && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Người bán đã xác nhận
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Mở</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="resolved">Đã giải quyết</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
          {!isClosed ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAdminResolve}
              disabled={adminResolve.isPending}
              className="text-green-600 border-green-500/30 hover:bg-green-500/10"
            >
              {adminResolve.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              Đóng ticket
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAdminReopen}
              disabled={adminReopen.isPending}
            >
              {adminReopen.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
              Mở lại
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pr-4">
            {messages?.map((msg) => {
              const isAdmin = msg.sender_type === 'admin';
              const isSeller = msg.sender_type === 'seller';
              const isBuyer = msg.sender_type === 'buyer';
              const isSystem = isSystemMessage(msg.message);

              // System message - centered
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-muted/50 border border-border/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
                      {msg.message}
                      <span className="ml-2 opacity-70">
                        {format(new Date(msg.created_at), 'HH:mm dd/MM', { locale: vi })}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn('flex gap-3', isAdmin ? 'flex-row-reverse' : '')}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      isAdmin ? 'bg-destructive/10 text-destructive' :
                      isSeller ? 'bg-primary/10 text-primary' :
                      'bg-secondary'
                    )}>
                      {isAdmin ? <Shield className="h-4 w-4" /> : 
                       isSeller ? <Store className="h-4 w-4" /> : 
                       <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn('max-w-[75%] flex flex-col', isAdmin ? 'items-end' : 'items-start')}>
                    <span className={cn(
                      'text-xs font-medium mb-1',
                      isAdmin ? 'text-destructive' : isSeller ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {isAdmin ? 'Admin' : isSeller ? ticket.seller?.shop_name : (ticket.buyer?.full_name || 'Người mua')}
                    </span>
                    <MessageAttachments attachments={(msg as any).attachments || []} />
                    {msg.message && !isSystem && (
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5',
                      isAdmin ? 'bg-destructive/10 border border-destructive/20 rounded-br-sm' :
                      isSeller ? 'bg-primary/10 rounded-bl-sm' :
                      'bg-muted rounded-bl-sm'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), 'HH:mm dd/MM', { locale: vi })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="pt-3 border-t">
        {!isClosed ? (
          <ChatMessageInput
            onSend={async (message, attachments) => {
              if (!message.trim() && attachments.length === 0) return;
              await sendMessage.mutateAsync({
                ticketId: ticket.id,
                message: message.trim(),
                adminId: adminUser?.id || '',
                attachments: attachments.map(a => ({
                  type: a.type,
                  url: a.url,
                  sticker: a.sticker
                }))
              });
            }}
            placeholder="Nhập phản hồi với vai trò Admin..."
            disabled={sendMessage.isPending}
          />
        ) : (
          <p className="text-center text-muted-foreground text-sm py-2">Ticket đã đóng</p>
        )}
      </div>
    </div>
  );
}

export default function AdminTickets() {
  const { tickets, isLoading } = useAdminTickets();
  const { data: sellerTickets, isLoading: sellerLoading } = useAdminSellerTickets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedSellerTicket, setSelectedSellerTicket] = useState<SellerTicket | null>(null);

  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSellerTickets = sellerTickets?.filter((ticket) => {
    const matchesSearch = ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.seller?.shop_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Quản lý Ticket</h1>
        <p className="text-sm text-muted-foreground">Xử lý các yêu cầu hỗ trợ từ khách hàng và marketplace</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="open">Mở</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="user" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user" className="gap-2">
            <User className="h-4 w-4" />
            User Tickets ({filteredTickets?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Store className="h-4 w-4" />
            Marketplace ({filteredSellerTickets?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* User Tickets Tab */}
        <TabsContent value="user">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Mobile View */}
                <div className="md:hidden divide-y">
                  {filteredTickets?.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">Không có ticket nào</div>
                  ) : (
                    filteredTickets?.map((ticket) => {
                      const status = statusConfig[ticket.status] || statusConfig.open;
                      return (
                        <div key={ticket.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
                              <p className="font-medium text-sm truncate">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground">{categories[ticket.category] || ticket.category}</p>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(ticket.id)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chi tiết
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop View */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã ticket</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Không có ticket nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets?.map((ticket) => {
                        const status = statusConfig[ticket.status] || statusConfig.open;
                        return (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                            <TableCell>{categories[ticket.category] || ticket.category}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(ticket.id)}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Marketplace Tickets Tab */}
        <TabsContent value="marketplace">
          {sellerLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {/* Mobile View */}
                <div className="md:hidden divide-y">
                  {filteredSellerTickets?.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Chưa có ticket marketplace nào</p>
                      <p className="text-xs mt-1">Seller có thể mời admin tham gia ticket từ dashboard</p>
                    </div>
                  ) : (
                    filteredSellerTickets?.map((ticket) => {
                      const status = statusConfig[ticket.status] || statusConfig.open;
                      return (
                        <div key={ticket.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
                              <p className="font-medium text-sm truncate">{ticket.subject}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Store className="h-3 w-3" />
                                <span className="truncate">{ticket.seller?.shop_name}</span>
                              </div>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSellerTicket(ticket)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chi tiết
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop View */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã ticket</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Người mua</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellerTickets?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>Chưa có ticket marketplace nào</p>
                          <p className="text-xs mt-1">Seller có thể mời admin tham gia ticket từ dashboard</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSellerTickets?.map((ticket) => {
                        const status = statusConfig[ticket.status] || statusConfig.open;
                        return (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{ticket.subject}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" />
                                <span className="truncate max-w-[120px]">{ticket.seller?.shop_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm truncate max-w-[120px]">
                              {ticket.buyer?.full_name || ticket.buyer?.email || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedSellerTicket(ticket)}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* User Ticket Dialog */}
      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Ticket</DialogTitle>
          </DialogHeader>
          {selectedTicketId && (
            <TicketDetailDialog ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Marketplace Ticket Dialog */}
      <Dialog open={!!selectedSellerTicket} onOpenChange={() => setSelectedSellerTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Marketplace Ticket
            </DialogTitle>
          </DialogHeader>
          {selectedSellerTicket && (
            <SellerTicketDetailDialog ticket={selectedSellerTicket} onClose={() => setSelectedSellerTicket(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}