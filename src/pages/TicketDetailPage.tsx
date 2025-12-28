import { useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTicketDetail, TicketAttachment } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, User, Shield, Loader2 } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';
import ChatMessageInput, { ChatAttachment } from '@/components/chat/ChatMessageInput';
import MessageAttachments from '@/components/chat/MessageAttachments';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { ticket, messages, isLoading, sendMessage } = useTicketDetail(id || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formatDateTime } = useDateFormat();

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    open: { label: t('ticketStatusOpen'), variant: 'default', icon: <AlertCircle className="h-3 w-3" /> },
    pending: { label: t('ticketStatusPending'), variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    resolved: { label: t('ticketStatusResolved'), variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
    closed: { label: t('ticketStatusClosed'), variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  };

  const categories: Record<string, string> = {
    general: t('categoryGeneral'),
    order: t('categoryOrder'),
    payment: t('categoryPayment'),
    account: t('categoryAccount'),
    technical: t('categoryTechnical'),
    other: t('categoryOther'),
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string, attachments: ChatAttachment[]) => {
    if (!message.trim() && attachments.length === 0) return;
    const ticketAttachments: TicketAttachment[] = attachments.map(a => ({
      type: a.type,
      url: a.url,
      sticker: a.sticker
    }));
    await sendMessage.mutateAsync({ message, attachments: ticketAttachments });
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>{t('needLoginToViewTicket')}</p>
          <Button asChild className="mt-4">
            <Link to="/auth">{t('login')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>{t('ticketNotFound')}</p>
          <Button asChild className="mt-4">
            <Link to="/support">{t('goBack')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.open;
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Bạn';

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Link to="/support" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToList')}
        </Link>

        <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          {/* Header */}
          <CardHeader className="pb-3 border-b flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-mono mb-1">{ticket.ticket_number}</p>
                <h2 className="text-lg font-semibold truncate">{ticket.subject}</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{categories[ticket.category] || ticket.category}</span>
                  <span>•</span>
                  <span>{formatDateTime(ticket.created_at)}</span>
                </div>
              </div>
              <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
                {status.icon}
                <span>{status.label}</span>
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages?.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';
                  const isUser = msg.sender_type === 'user';
                  
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3',
                        isUser ? 'flex-row-reverse' : ''
                      )}
                    >
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {isUser ? (
                          <>
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-destructive/10 text-destructive">
                            <Shield className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Message content */}
                      <div className={cn(
                        'flex-1 max-w-[80%] flex flex-col',
                        isUser ? 'items-end' : 'items-start'
                      )}>
                        {/* Sender name */}
                        <span className={cn(
                          'text-xs font-medium mb-1',
                          isUser ? 'text-primary' : 'text-destructive'
                        )}>
                          {isUser ? userName : 'Admin'}
                        </span>

                        {/* Attachments */}
                        <MessageAttachments attachments={(msg as any).attachments || []} />

                        {/* Message bubble */}
                        {msg.message && (
                        <div className={cn(
                          'rounded-2xl px-4 py-2.5',
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                        )}

                        {/* Timestamp */}
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {formatDateTime(msg.created_at, 'HH:mm dd/MM')}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input area */}
          <div className="p-4 border-t flex-shrink-0 bg-muted/30">
            {!isClosed ? (
              <ChatMessageInput
                onSend={handleSendMessage}
                placeholder={t('enterMessage')}
                disabled={sendMessage.isPending}
              />
            ) : (
              <p className="text-center text-muted-foreground text-sm py-2">
                {t('ticketClosed')}
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}