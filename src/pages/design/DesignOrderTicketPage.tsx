import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Clock, CheckCircle, AlertTriangle, 
  RefreshCw, XCircle, Flag, History, Shield,
  MessageCircle, FileText, Upload, ChevronDown,
  Eye, Star, Package, Palette, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessageInput, { ChatAttachment } from '@/components/chat/ChatMessageInput';
import { ChatMessageBubble } from '@/components/design/ChatMessageBubble';
import { DesignFileUpload } from '@/components/design/DesignFileUpload';
import { TypingIndicator } from '@/components/design/TypingIndicator';
import { 
  useDesignOrder, useDesignTicket, useDesignTicketMessages, 
  useSendDesignTicketMessage, useUpdateDesignOrder, useUpdateDesignTicket,
  useCreateDesignReview, useConfirmDesignOrderCompletion
} from '@/hooks/useDesignServices';
import { DeadlineCountdown } from '@/components/design/DeadlineCountdown';
import { QuickActions } from '@/components/design/QuickActions';
import { FileVersionHistory } from '@/components/design/FileVersionHistory';
import { SellerNotes } from '@/components/design/SellerNotes';
import { ActivityLog } from '@/components/design/ActivityLog';
import { ReportDialog } from '@/components/design/ReportDialog';
import { AcceptNowButton } from '@/components/design/AcceptNowButton';
import { MultiCriteriaReview } from '@/components/design/MultiCriteriaReview';
import { NDABadge } from '@/components/design/NDABadge';
import { LicenseBadge } from '@/components/design/LicenseBadge';
import { MilestoneTracker } from '@/components/design/MilestoneTracker';
import { RevisionPackageCard } from '@/components/design/RevisionPackageCard';
import { TeamCollaborators } from '@/components/design/TeamCollaborators';
import { InternalNotesPanel } from '@/components/design/InternalNotesPanel';
import { RevisionLimitDialog } from '@/components/design/RevisionLimitDialog';
import { RevisionWarningBadge } from '@/components/design/RevisionWarningBadge';
import { useDesignRevisionPackages } from '@/hooks/useDesignAdvanced';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, isBefore } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending_accept: { label: 'Chờ designer nhận', color: 'bg-yellow-500', icon: Clock, bgColor: 'bg-yellow-500/10' },
  in_progress: { label: 'Đang thiết kế', color: 'bg-blue-500', icon: Palette, bgColor: 'bg-blue-500/10' },
  revision_requested: { label: 'Chờ chỉnh sửa', color: 'bg-orange-500', icon: RefreshCw, bgColor: 'bg-orange-500/10' },
  delivered: { label: 'Đã giao sản phẩm', color: 'bg-green-500', icon: Package, bgColor: 'bg-green-500/10' },
  pending_confirm: { label: 'Chờ xác nhận hoàn tất', color: 'bg-purple-500', icon: CheckCircle, bgColor: 'bg-purple-500/10' },
  completed: { label: 'Đã hoàn tất', color: 'bg-green-600', icon: CheckCircle, bgColor: 'bg-green-600/10' },
  disputed: { label: 'Tranh chấp', color: 'bg-red-500', icon: AlertTriangle, bgColor: 'bg-red-500/10' },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-500', icon: XCircle, bgColor: 'bg-gray-500/10' },
};

const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ designer nhận', color: 'bg-yellow-500' },
  waiting_seller: { label: 'Chờ designer', color: 'bg-yellow-500' },
  designing: { label: 'Đang thiết kế', color: 'bg-blue-500' },
  revision: { label: 'Chờ chỉnh sửa', color: 'bg-orange-500' },
  delivered: { label: 'Đã giao', color: 'bg-green-500' },
  pending_confirm: { label: 'Chờ xác nhận', color: 'bg-purple-500' },
  closed: { label: 'Đã đóng', color: 'bg-gray-500' },
  disputed: { label: 'Tranh chấp', color: 'bg-red-500' },
};

export default function DesignOrderTicketPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { formatDate, formatDateTime } = useDateFormat();
  
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useDesignOrder(orderId);
  const { data: ticket, refetch: refetchTicket } = useDesignTicket(orderId);
  const { data: messages, refetch: refetchMessages } = useDesignTicketMessages(ticket?.id);
  
  const sendMessage = useSendDesignTicketMessage();
  const updateOrder = useUpdateDesignOrder();
  const updateTicket = useUpdateDesignTicket();
  const createReview = useCreateDesignReview();
  const confirmCompletion = useConfirmDesignOrderCompletion();
  
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [showRevisionLimitDialog, setShowRevisionLimitDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch revision packages to calculate remaining
  const { data: revisionPackages } = useDesignRevisionPackages(orderId);

  const isSeller = order?.seller?.user_id === user?.id;
  const isBuyer = order?.buyer_id === user?.id;

  // Calculate remaining revisions
  const baseRevisions = (order?.service as any)?.revision_count || 0;
  const purchasedRevisions = revisionPackages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
  const totalRevisions = baseRevisions + purchasedRevisions;
  const usedRevisions = order?.revision_used || 0;
  const remainingRevisions = totalRevisions - usedRevisions;
  const revisionPrice = (order?.service as any)?.extra_revision_price || 0;

  // Realtime subscription
  useEffect(() => {
    if (!ticket?.id) return;

    const channel = supabase
      .channel(`design-ticket-${ticket.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_ticket_messages', filter: `ticket_id=eq.${ticket.id}` },
        () => refetchMessages()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_tickets', filter: `id=eq.${ticket.id}` },
        () => refetchTicket()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    if (!ticket) return;

    try {
      const formattedAttachments = attachments.map(att => {
        if (att.type === 'sticker' && att.sticker) {
          return { type: 'sticker', url: att.sticker.url, name: att.sticker.name };
        }
        return { type: 'image', url: att.url };
      });

      await sendMessage.mutateAsync({
        ticket_id: ticket.id,
        sender_id: user!.id,
        sender_type: isSeller ? 'seller' : 'buyer',
        message: message.trim(),
        attachments: formattedAttachments.length > 0 ? formattedAttachments : null,
        is_delivery: false,
        is_revision_request: false,
      });
    } catch (error) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const handleFileUploadComplete = async (files: { name: string; url: string; size: number; type: string }[]) => {
    if (!ticket) return;

    const attachments = files.map(f => ({
      type: f.type.startsWith('image/') ? 'image' : 'file',
      url: f.url,
      name: f.name,
      size: f.size,
    }));

    try {
      await sendMessage.mutateAsync({
        ticket_id: ticket.id,
        sender_id: user!.id,
        sender_type: isSeller ? 'seller' : 'buyer',
        message: `📎 Đã gửi ${files.length} file`,
        attachments,
        is_delivery: false,
        is_revision_request: false,
      });
      setShowFileUpload(false);
    } catch (error) {
      toast.error('Không thể gửi file');
    }
  };

  const handleAcceptOrder = async () => {
    if (!order || !ticket) return;
    try {
      await updateOrder.mutateAsync({ id: order.id, status: 'in_progress' });
      await updateTicket.mutateAsync({ id: ticket.id, status: 'designing' });
      await refetchOrder();
      toast.success('Đã nhận đơn hàng!');
    } catch (error: any) {
      console.error('handleAcceptOrder error:', error);
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeliverProduct = async () => {
    if (!order || !ticket) return;
    try {
      await updateOrder.mutateAsync({ id: order.id, status: 'delivered' });
      await updateTicket.mutateAsync({ id: ticket.id, status: 'delivered' });
      await sendMessage.mutateAsync({
        ticket_id: ticket.id,
        sender_id: user!.id,
        sender_type: 'seller',
        message: '📦 Đã giao sản phẩm thiết kế. Vui lòng xác nhận hoàn tất nếu bạn hài lòng.',
        attachments: null,
        is_delivery: true,
        is_revision_request: false,
      });
      await refetchOrder();
      toast.success('Đã giao sản phẩm!');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleRequestRevision = async () => {
    if (!order || !ticket) return;
    
    // Check if out of revisions
    if (remainingRevisions <= 0) {
      // Show dialog to buy more if price is available
      if (revisionPrice > 0) {
        setShowRevisionLimitDialog(true);
      } else {
        toast.error('Đã hết lượt chỉnh sửa. Vui lòng liên hệ seller để thương lượng.');
      }
      return;
    }
    
    // Show warning toast if using last revision
    const isLastRevision = remainingRevisions === 1;
    
    try {
      await updateOrder.mutateAsync({ 
        id: order.id, 
        status: 'revision_requested',
        revision_used: (order.revision_used || 0) + 1
      });
      await updateTicket.mutateAsync({ 
        id: ticket.id, 
        status: 'revision',
        revision_requested: (ticket.revision_requested || 0) + 1
      });
      await sendMessage.mutateAsync({
        ticket_id: ticket.id,
        sender_id: user!.id,
        sender_type: 'buyer',
        message: '🔄 Yêu cầu chỉnh sửa',
        attachments: null,
        is_delivery: false,
        is_revision_request: true,
      });
      await refetchOrder();
      
      if (isLastRevision) {
        toast.warning('Đã gửi yêu cầu chỉnh sửa. Đây là lượt chỉnh sửa cuối cùng!', {
          description: revisionPrice > 0 ? 'Bạn có thể mua thêm lượt nếu cần.' : undefined,
          duration: 5000,
        });
      } else {
        toast.success(`Đã gửi yêu cầu chỉnh sửa. Còn ${remainingRevisions - 1} lượt.`);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleConfirmComplete = async () => {
    if (!order) return;
    
    const confirmType = isBuyer ? 'buyer' : 'seller';

    try {
      const result = await confirmCompletion.mutateAsync({ 
        orderId: order.id, 
        confirmType: confirmType as 'buyer' | 'seller'
      });
      
      await refetchOrder();
      await refetchTicket();

      if (result.both_confirmed) {
        toast.success('Đơn hàng hoàn tất! Tiền sẽ được giữ 3 ngày trước khi về ví designer.');
        
        if (isBuyer) {
          setReviewDialogOpen(true);
        }
      } else if (result.already_confirmed) {
        toast.info('Bạn đã xác nhận trước đó. Đang chờ đối phương.');
      } else {
        toast.success('Đã xác nhận! Chờ đối phương xác nhận.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra');
    }
  };

  const handleQuickAction = (actionType: string, messageTemplate: string) => {
    if (actionType === 'approve') {
      handleConfirmComplete();
    } else if (actionType === 'revision') {
      handleRequestRevision();
    } else {
      handleSendMessage(messageTemplate, []);
    }
  };

  const handleDispute = async () => {
    if (!order || !ticket) return;
    try {
      await updateOrder.mutateAsync({ 
        id: order.id, 
        status: 'disputed',
        disputed_at: new Date().toISOString(),
      });
      await updateTicket.mutateAsync({ id: ticket.id, status: 'disputed', admin_involved: true });
      toast.success('Đã mở tranh chấp. Admin sẽ xem xét.');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (orderLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[700px] rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[200px] rounded-xl" />
              <Skeleton className="h-[150px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h1>
            <p className="text-muted-foreground mb-6">Đơn hàng này không tồn tại hoặc bạn không có quyền xem.</p>
            <Button asChild>
              <Link to="/settings/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại đơn hàng
              </Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_accept;
  const ticketStatusConfig = ticket ? TICKET_STATUS_CONFIG[ticket.status] : null;
  const canDispute = order.escrow_status === 'holding' && order.escrow_release_at && 
    isBefore(new Date(), new Date(order.escrow_release_at));

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings/orders?tab=design">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">Đơn #{order.order_number}</h1>
                <Badge className={cn(statusConfig.color, 'text-white')}>
                  {statusConfig.label}
                </Badge>
                <NDABadge 
                  requiresNDA={order.requires_nda} 
                  noPortfolioUse={order.no_portfolio_use} 
                />
                <LicenseBadge licenseType={order.license_type_id} />
                {isBuyer && (
                  <RevisionWarningBadge 
                    remaining={remainingRevisions} 
                    total={totalRevisions}
                    onClick={() => revisionPrice > 0 && setShowRevisionLimitDialog(true)}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {(order.service as any)?.name} • {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowActivityLog(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Lịch sử</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowReportDialog(true)}
              className="gap-2"
            >
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Báo cáo</span>
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat/Ticket Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="h-[700px] flex flex-col overflow-hidden border-2">
              {/* Ticket Header */}
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', statusConfig.bgColor)}>
                      <statusConfig.icon className={cn('h-5 w-5', statusConfig.color.replace('bg-', 'text-'))} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Ticket #{ticket?.ticket_number}
                        </CardTitle>
                        {ticketStatusConfig && (
                          <Badge variant="secondary" className="text-xs">
                            {ticketStatusConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isSeller ? 'Khách hàng' : 'Designer'}: {isSeller ? 'Buyer' : order.seller?.shop_name || 'Designer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setShowVersionHistory(true)}
                      className="h-9 w-9"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Deadline Countdown */}
                {order.deadline && order.status !== 'completed' && order.status !== 'cancelled' && (
                  <DeadlineCountdown deadline={order.deadline} className="mt-3" />
                )}
              </CardHeader>

              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-3 w-auto justify-start shrink-0">
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  {isSeller && (
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="files" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Files
                  </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 mt-2">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 py-4">
                      {/* Requirement Card */}
                      <Collapsible open={requirementOpen} onOpenChange={setRequirementOpen}>
                        <CollapsibleTrigger asChild>
                          <motion.div
                            className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl cursor-pointer hover:from-primary/15 transition-colors"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <h4 className="font-semibold">Yêu cầu thiết kế</h4>
                              </div>
                              <ChevronDown className={cn(
                                'h-4 w-4 transition-transform',
                                requirementOpen && 'rotate-180'
                              )} />
                            </div>
                          </motion.div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 p-4 bg-muted/50 rounded-xl space-y-2 text-sm"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {order.requirement_text && (
                                <div className="col-span-full">
                                  <span className="text-muted-foreground">Nội dung:</span>
                                  <p className="font-medium mt-0.5">{order.requirement_text}</p>
                                </div>
                              )}
                              {order.requirement_colors && (
                                <div>
                                  <span className="text-muted-foreground">Màu sắc:</span>
                                  <p className="font-medium">{order.requirement_colors}</p>
                                </div>
                              )}
                              {order.requirement_style && (
                                <div>
                                  <span className="text-muted-foreground">Phong cách:</span>
                                  <p className="font-medium">{order.requirement_style}</p>
                                </div>
                              )}
                              {order.requirement_size && (
                                <div>
                                  <span className="text-muted-foreground">Kích thước:</span>
                                  <p className="font-medium">{order.requirement_size}</p>
                                </div>
                              )}
                              {order.requirement_purpose && (
                                <div>
                                  <span className="text-muted-foreground">Mục đích:</span>
                                  <p className="font-medium">{order.requirement_purpose}</p>
                                </div>
                              )}
                              {order.requirement_notes && (
                                <div className="col-span-full">
                                  <span className="text-muted-foreground">Ghi chú:</span>
                                  <p className="font-medium">{order.requirement_notes}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Messages */}
                      <AnimatePresence mode="popLayout">
                        {messages?.map((msg) => (
                          <ChatMessageBubble
                            key={msg.id}
                            message={msg.message}
                            attachments={msg.attachments as any}
                            senderType={msg.sender_type as 'buyer' | 'seller' | 'admin'}
                            isOwn={msg.sender_id === user?.id}
                            isDelivery={msg.is_delivery}
                            isRevisionRequest={msg.is_revision_request}
                            createdAt={msg.created_at}
                            senderName={msg.sender_type === 'seller' ? order.seller?.shop_name : 'Bạn'}
                          />
                        ))}
                      </AnimatePresence>

                      {/* Typing Indicator */}
                      {isTyping && <TypingIndicator />}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Quick Actions & Input */}
                  {ticket?.status !== 'closed' && (
                    <>
                      <QuickActions 
                        userType={isSeller ? 'seller' : 'buyer'}
                        onAction={handleQuickAction}
                        disabled={sendMessage.isPending}
                      />
                      <div className="border-t p-4 shrink-0 bg-background">
                        <ChatMessageInput
                          onSend={handleSendMessage}
                          placeholder="Nhập tin nhắn..."
                          disabled={sendMessage.isPending}
                        />
                      </div>
                    </>
                  )}

                  {ticket?.status === 'closed' && (
                    <div className="border-t p-4 text-center text-muted-foreground bg-muted/30">
                      <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">Ticket đã đóng</p>
                    </div>
                  )}
                </TabsContent>

                {/* Upload Tab (Seller Only) */}
                {isSeller && (
                  <TabsContent value="upload" className="flex-1 overflow-auto m-0 p-4">
                    <div className="max-w-md mx-auto">
                      <div className="text-center mb-6">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Upload sản phẩm</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tải lên file thiết kế để gửi cho khách hàng
                        </p>
                      </div>
                      {ticket && order && (
                        <DesignFileUpload
                          orderId={order.id}
                          ticketId={ticket.id}
                          onUploadComplete={handleFileUploadComplete}
                        />
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* Files Tab */}
                <TabsContent value="files" className="flex-1 overflow-auto m-0">
                  {ticket && order && (
                    <FileVersionHistory
                      orderId={order.id}
                      ticketId={ticket.id}
                      isBuyer={isBuyer}
                      isSeller={isSeller}
                      canApprove={isBuyer && order.status === 'delivered'}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Status & Actions Card */}
            <Card className="overflow-hidden">
              <div className={cn('h-2', statusConfig.color)} />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <statusConfig.icon className="h-5 w-5" />
                  {statusConfig.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deadline */}
                {order.deadline && order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">{formatDateTime(order.deadline)}</p>
                    </div>
                  </div>
                )}

                {/* Revision count */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Lượt chỉnh sửa</span>
                  </div>
                  <Badge variant="secondary">
                    {order.revision_used}/{(order.service as any)?.revision_count || 0}
                  </Badge>
                </div>

                {/* Escrow info */}
                {order.escrow_release_at && order.escrow_status === 'holding' && (
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Tiền đang được giữ</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Về ví designer: {formatDateTime(order.escrow_release_at)}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Seller Actions */}
                {isSeller && (
                  <div className="space-y-2">
                    {order.status === 'pending_accept' && (
                      <Button className="w-full gap-2" onClick={handleAcceptOrder}>
                        <CheckCircle className="h-4 w-4" />
                        Nhận đơn hàng
                      </Button>
                    )}
                    {(order.status === 'in_progress' || order.status === 'revision_requested') && (
                      <Button className="w-full gap-2" onClick={handleDeliverProduct}>
                        <Package className="h-4 w-4" />
                        Giao sản phẩm
                      </Button>
                    )}
                    {order.status === 'delivered' && !order.seller_confirmed && (
                      <Button className="w-full gap-2" onClick={handleConfirmComplete}>
                        <CheckCircle className="h-4 w-4" />
                        Xác nhận hoàn tất
                      </Button>
                    )}
                    {order.seller_confirmed && !order.buyer_confirmed && (
                      <Badge variant="outline" className="w-full justify-center py-2.5">
                        ✓ Đã xác nhận, chờ buyer
                      </Badge>
                    )}
                  </div>
                )}

                {/* Buyer Actions */}
                {isBuyer && (
                  <div className="space-y-2">
                    {order.status === 'delivered' && (
                      <>
                        {remainingRevisions > 0 && (
                          <Button variant="outline" className="w-full gap-2" onClick={handleRequestRevision}>
                            <RefreshCw className="h-4 w-4" />
                            Yêu cầu chỉnh sửa ({remainingRevisions} còn lại)
                          </Button>
                        )}
                        {!order.buyer_confirmed && (
                          <>
                            <AcceptNowButton
                              onAccept={handleConfirmComplete}
                              remainingRevisions={remainingRevisions}
                              className="w-full"
                            />
                          </>
                        )}
                      </>
                    )}
                    {order.buyer_confirmed && !order.seller_confirmed && (
                      <Badge variant="outline" className="w-full justify-center py-2.5">
                        ✓ Đã xác nhận, chờ designer
                      </Badge>
                    )}
                    {canDispute && order.status === 'completed' && (
                      <Button variant="destructive" className="w-full gap-2" onClick={handleDispute}>
                        <AlertTriangle className="h-4 w-4" />
                        Mở tranh chấp
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dịch vụ:</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{(order.service as any)?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <span className="font-semibold text-primary">{formatPrice(order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designer nhận:</span>
                  <span>{formatPrice(order.seller_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày đặt:</span>
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Milestone Tracker */}
            {order.is_milestone_order && (
              <MilestoneTracker
                orderId={order.id}
                isBuyer={isBuyer}
                isSeller={isSeller}
                currentMilestoneId={order.current_milestone}
              />
            )}

            {/* Revision Package Card */}
            {((order.seller as any)?.design_extra_revision_price > 0 || (order.service as any)?.extra_revision_price > 0) && (
              <RevisionPackageCard
                orderId={order.id}
                isBuyer={isBuyer}
                revisionPrice={(order.seller as any)?.design_extra_revision_price || (order.service as any)?.extra_revision_price || 0}
                baseRevisions={(order.service as any)?.revision_count || 0}
                usedRevisions={order.revision_used || 0}
                sellerId={order.seller_id}
              />
            )}

            {/* Team Collaborators - Seller only */}
            {isSeller && ticket && (
              <TeamCollaborators
                ticketId={ticket.id}
                orderId={order.id}
                sellerId={order.seller_id}
                isSeller={isSeller}
              />
            )}

            {/* Internal Notes Panel - Seller only */}
            {isSeller && ticket && (
              <InternalNotesPanel
                ticketId={ticket.id}
                orderId={order.id}
                isSeller={isSeller}
              />
            )}

            {/* Seller Notes - Only visible to seller */}
            {isSeller && ticket && (
              <SellerNotes 
                ticketId={ticket.id} 
                sellerId={order.seller_id} 
              />
            )}

            {/* Seller Info for Buyer */}
            {isBuyer && order.seller && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Thông tin Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={order.seller.shop_avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {order.seller.shop_name?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.seller.shop_name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>5.0</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/seller/${order.seller.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Review Dialog - Multi Criteria */}
        {isBuyer && order && (
          <MultiCriteriaReview
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            orderId={order.id}
            serviceId={order.service_id}
            sellerId={order.seller_id}
          />
        )}

        {/* File Version History Dialog */}
        {ticket && order && (
          <FileVersionHistory
            orderId={order.id}
            ticketId={ticket.id}
            isBuyer={isBuyer}
            isSeller={isSeller}
            canApprove={isBuyer && order.status === 'delivered'}
            open={showVersionHistory}
            onOpenChange={setShowVersionHistory}
          />
        )}

        {/* Activity Log Dialog */}
        {ticket && (
          <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Lịch sử hoạt động</DialogTitle>
                <DialogDescription>
                  Xem toàn bộ lịch sử thao tác trên đơn hàng này
                </DialogDescription>
              </DialogHeader>
              <ActivityLog ticketId={ticket.id} orderId={order?.id} />
            </DialogContent>
          </Dialog>
        )}

        {/* Report Dialog */}
        {ticket && order && (
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            ticketId={ticket.id}
            orderId={order.id}
            reportedUserId={isBuyer ? order.seller?.user_id || '' : order.buyer_id}
          />
        )}

        {/* Revision Limit Dialog */}
        {isBuyer && order && revisionPrice > 0 && (
          <RevisionLimitDialog
            open={showRevisionLimitDialog}
            onOpenChange={setShowRevisionLimitDialog}
            orderId={order.id}
            revisionPrice={revisionPrice}
            onPurchaseSuccess={() => refetchOrder()}
          />
        )}
      </div>
    </Layout>
  );
}
