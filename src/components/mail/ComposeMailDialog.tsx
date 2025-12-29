import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Minus,
  Maximize2,
  Send,
  Paperclip,
  Image,
  Clock,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Smile,
  Trash2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useSendMail } from '@/hooks/useMail';
import type { Mailbox, MailMessage, ComposeMailData } from '@/types/mail';

interface ComposeMailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'new' | 'reply' | 'replyAll' | 'forward';
  replyToMessage?: MailMessage | null;
  mailbox?: Mailbox | null;
}

export const ComposeMailDialog: React.FC<ComposeMailDialogProps> = ({
  open,
  onOpenChange,
  mode,
  replyToMessage,
  mailbox,
}) => {
  const sendMail = useSendMail();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [showSchedule, setShowSchedule] = useState(false);

  // Initialize form based on mode
  useEffect(() => {
    if (!open) return;

    if (mode === 'new') {
      resetForm();
    } else if (replyToMessage) {
      if (mode === 'reply' || mode === 'replyAll') {
        setTo(replyToMessage.from_address);
        if (mode === 'replyAll' && replyToMessage.cc_addresses) {
          const ccList = replyToMessage.cc_addresses
            .map(a => a.email)
            .filter(e => e !== mailbox?.email_address)
            .join(', ');
          if (ccList) {
            setCc(ccList);
            setShowCc(true);
          }
        }
        setSubject(replyToMessage.subject?.startsWith('Re:')
          ? replyToMessage.subject
          : `Re: ${replyToMessage.subject || ''}`
        );
        setBody(buildReplyBody(replyToMessage));
      } else if (mode === 'forward') {
        setSubject(replyToMessage.subject?.startsWith('Fwd:')
          ? replyToMessage.subject
          : `Fwd: ${replyToMessage.subject || ''}`
        );
        setBody(buildForwardBody(replyToMessage));
      }
    }
  }, [open, mode, replyToMessage, mailbox]);

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setPriority('normal');
    setShowCc(false);
    setShowBcc(false);
    setAttachments([]);
    setScheduledDate(undefined);
    setShowSchedule(false);
  };

  const buildReplyBody = (msg: MailMessage): string => {
    const date = format(new Date(msg.received_at), "EEEE, d MMMM yyyy 'lúc' HH:mm", { locale: vi });
    return `\n\n-------- Tin nhắn gốc --------\nVào ${date}, ${msg.from_name || msg.from_address} đã viết:\n\n${msg.body_text || ''}`;
  };

  const buildForwardBody = (msg: MailMessage): string => {
    const date = format(new Date(msg.received_at), "EEEE, d MMMM yyyy 'lúc' HH:mm", { locale: vi });
    const toList = msg.to_addresses.map(a => a.name ? `${a.name} <${a.email}>` : a.email).join(', ');
    return `\n\n-------- Thư chuyển tiếp --------\nTừ: ${msg.from_name ? `${msg.from_name} <${msg.from_address}>` : msg.from_address}\nNgày: ${date}\nĐến: ${toList}\nTiêu đề: ${msg.subject || '(Không có tiêu đề)'}\n\n${msg.body_text || ''}`;
  };

  const handleSend = async (isDraft = false) => {
    if (!to.trim() && !isDraft) {
      toast.error('Vui lòng nhập người nhận');
      return;
    }

    if (!subject.trim() && !isDraft) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    try {
      await sendMail.mutateAsync({
        to,
        cc: showCc ? cc : undefined,
        bcc: showBcc ? bcc : undefined,
        subject,
        body,
        priority,
        isDraft,
        scheduledAt: scheduledDate,
        replyTo: mode !== 'new' ? replyToMessage?.message_id || undefined : undefined,
        threadId: mode !== 'new' && mode !== 'forward' ? replyToMessage?.thread_id || undefined : undefined,
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 right-4 z-50"
      >
        <div
          className="bg-card border rounded-t-lg shadow-lg w-80 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground rounded-t-lg">
            <span className="font-medium truncate flex-1">
              {subject || 'Thư mới'}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'p-0 gap-0 transition-all duration-200',
          isMaximized
            ? 'max-w-full w-full h-full max-h-full rounded-none'
            : 'max-w-2xl w-full max-h-[90vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-primary text-primary-foreground">
          <DialogTitle className="text-base font-medium">
            {mode === 'new' && 'Thư mới'}
            {mode === 'reply' && 'Trả lời'}
            {mode === 'replyAll' && 'Trả lời tất cả'}
            {mode === 'forward' && 'Chuyển tiếp'}
          </DialogTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(true)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* From */}
          <div className="flex items-center px-4 py-2 border-b text-sm">
            <span className="text-muted-foreground w-12">Từ:</span>
            <span className="font-medium">{mailbox?.email_address}</span>
          </div>

          {/* To */}
          <div className="flex items-center px-4 py-2 border-b">
            <span className="text-muted-foreground w-12 text-sm">Đến:</span>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Nhập email người nhận"
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
            />
            <div className="flex gap-2 text-sm">
              {!showCc && (
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCc(true)}
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowBcc(true)}
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-center px-4 py-2 border-b">
              <span className="text-muted-foreground w-12 text-sm">Cc:</span>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Nhập email cc"
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
              />
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div className="flex items-center px-4 py-2 border-b">
              <span className="text-muted-foreground w-12 text-sm">Bcc:</span>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Nhập email bcc"
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center px-4 py-2 border-b">
            <span className="text-muted-foreground w-12 text-sm">Tiêu đề:</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề"
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
            />
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nhập nội dung thư..."
              className="h-full border-0 shadow-none focus-visible:ring-0 rounded-none resize-none"
              style={{ minHeight: isMaximized ? '400px' : '200px' }}
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-t bg-muted/50">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 text-sm"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-32">{file.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled */}
          {scheduledDate && (
            <div className="px-4 py-2 border-t bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
                <span>
                  Lên lịch gửi: {format(scheduledDate, "EEEE, d MMMM yyyy 'lúc' HH:mm", { locale: vi })}
                </span>
                <button
                  onClick={() => setScheduledDate(undefined)}
                  className="ml-auto hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-1">
              <Button
                onClick={() => handleSend(false)}
                className="gap-2"
                disabled={sendMail.isPending}
              >
                <Send className="h-4 w-4" />
                Gửi
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label>
                      <Button variant="ghost" size="icon" asChild>
                        <span>
                          <Paperclip className="h-4 w-4" />
                        </span>
                      </Button>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachment}
                      />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>Đính kèm tệp</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Text formatting buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>In đậm</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>In nghiêng</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Underline className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gạch chân</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Priority */}
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Ưu tiên thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Ưu tiên cao</SelectItem>
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Schedule */}
              <Popover open={showSchedule} onOpenChange={setShowSchedule}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Clock className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => {
                      setScheduledDate(date);
                      setShowSchedule(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSend(true)}
                disabled={sendMail.isPending}
              >
                Lưu nháp
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeMailDialog;
