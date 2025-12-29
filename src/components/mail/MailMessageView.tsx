import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Star,
  Archive,
  Printer,
  MoreVertical,
  ChevronDown,
  Paperclip,
  Download,
  ExternalLink,
  Clock,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useMailMessage, useToggleStar, useUpdateMessage } from '@/hooks/useMail';
import type { MailMessage, MailFolder } from '@/types/mail';

interface MailMessageViewProps {
  messageId: string;
  onClose: () => void;
  onReply: (message: MailMessage) => void;
  onReplyAll: (message: MailMessage) => void;
  onForward: (message: MailMessage) => void;
  onDelete: (id: string) => void;
  folders: MailFolder[];
  onMoveToFolder: (messageId: string, folderId: string) => void;
}

export const MailMessageView: React.FC<MailMessageViewProps> = ({
  messageId,
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  folders,
  onMoveToFolder,
}) => {
  const { data: message, isLoading } = useMailMessage(messageId);
  const toggleStar = useToggleStar();
  const updateMessage = useUpdateMessage();

  const [showDetails, setShowDetails] = React.useState(false);

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const formatFullDate = (date: string) => {
    return format(new Date(date), "EEEE, d MMMM yyyy 'lúc' HH:mm:ss", { locale: vi });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePrint = () => {
    const printContent = document.getElementById('mail-content');
    if (printContent) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${message?.subject || 'Email'}</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                .meta { color: #666; margin-bottom: 20px; }
                .content { line-height: 1.6; }
              </style>
            </head>
            <body>
              <h1>${message?.subject || '(Không có tiêu đề)'}</h1>
              <div class="meta">
                <p><strong>Từ:</strong> ${message?.from_name || message?.from_address}</p>
                <p><strong>Ngày:</strong> ${message ? formatFullDate(message.received_at) : ''}</p>
              </div>
              <div class="content">${message?.body_html || message?.body_text || ''}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="space-y-3 mt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg">Không tìm thấy thư</h3>
          <p className="text-muted-foreground">Thư này có thể đã bị xóa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <header className="h-14 border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Đóng</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onReply(message)}>
                  <Reply className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Trả lời</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onReplyAll(message)}>
                  <ReplyAll className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Trả lời tất cả</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onForward(message)}>
                  <Forward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chuyển tiếp</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleStar.mutate({ messageId: message.id, isStarred: !message.is_starred })}
                  className={cn(message.is_starred && 'text-yellow-500')}
                >
                  <Star className={cn('h-4 w-4', message.is_starred && 'fill-current')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{message.is_starred ? 'Bỏ gắn sao' : 'Gắn sao'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Archive className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {folders.map(f => (
                <DropdownMenuItem
                  key={f.id}
                  onClick={() => onMoveToFolder(message.id, f.id)}
                >
                  Chuyển đến {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>In</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(message.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xóa</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateMessage.mutate({ id: message.id, is_read: false })}>
                Đánh dấu chưa đọc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateMessage.mutate({ id: message.id, is_important: !message.is_important })}>
                {message.is_important ? 'Bỏ đánh dấu quan trọng' : 'Đánh dấu quan trọng'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Báo cáo spam</DropdownMenuItem>
              <DropdownMenuItem>Chặn người gửi</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6" id="mail-content">
          {/* Subject */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <h1 className="text-2xl font-semibold flex-1">
                {message.subject || '(Không có tiêu đề)'}
              </h1>
              {message.priority === 'high' && (
                <Badge variant="destructive">Quan trọng</Badge>
              )}
              {message.labels?.map((label, i) => (
                <Badge key={i} variant="outline">{label}</Badge>
              ))}
            </div>
          </div>

          {/* Sender Info */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {getInitials(message.from_name, message.from_address)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {message.from_name || message.from_address}
                  </h3>
                  {message.from_name && (
                    <p className="text-sm text-muted-foreground">
                      &lt;{message.from_address}&gt;
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-muted-foreground">
                    {formatFullDate(message.received_at)}
                  </p>
                </div>
              </div>

              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground mt-1 hover:text-foreground">
                  <span>
                    đến {message.to_addresses.map(a => a.name || a.email).join(', ')}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Từ:</span>{' '}
                    {message.from_name ? `${message.from_name} <${message.from_address}>` : message.from_address}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Đến:</span>{' '}
                    {message.to_addresses.map(a => a.name ? `${a.name} <${a.email}>` : a.email).join(', ')}
                  </p>
                  {message.cc_addresses && message.cc_addresses.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">Cc:</span>{' '}
                      {message.cc_addresses.map(a => a.name ? `${a.name} <${a.email}>` : a.email).join(', ')}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Ngày:</span>{' '}
                    {formatFullDate(message.received_at)}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4" />
                <span className="font-medium text-sm">
                  {message.attachments.length} tệp đính kèm
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                  >
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.original_filename}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
            ) : (
              <div className="whitespace-pre-wrap">{message.body_text}</div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Quick Reply */}
      <div className="border-t p-4 shrink-0">
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => onReply(message)}>
            <Reply className="h-4 w-4" />
            Trả lời
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => onForward(message)}>
            <Forward className="h-4 w-4" />
            Chuyển tiếp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MailMessageView;
