import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, FileIcon, ImageIcon, Package, RefreshCw, CheckCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Attachment {
  type: 'image' | 'sticker' | 'file';
  url?: string;
  name?: string;
  size?: number;
}

interface ChatMessageBubbleProps {
  message: string;
  attachments?: Attachment[] | null;
  senderType: 'buyer' | 'seller' | 'admin';
  isOwn: boolean;
  isDelivery?: boolean;
  isRevisionRequest?: boolean;
  createdAt: string;
  senderAvatar?: string;
  senderName?: string;
  isRead?: boolean;
}

export function ChatMessageBubble({
  message,
  attachments,
  senderType,
  isOwn,
  isDelivery,
  isRevisionRequest,
  createdAt,
  senderAvatar,
  senderName,
  isRead,
}: ChatMessageBubbleProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if message is only emoji (1-5 emoji characters with no other text)
  const isOnlyEmoji = (text: string) => {
    const trimmed = text.trim();
    // Match common emoji patterns including variation selectors
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)+$/u;
    // Also check if text is short enough (emoji typically take 1-4 chars each, max ~20 chars for 5 emoji)
    return trimmed.length <= 20 && emojiRegex.test(trimmed);
  };

  // Separate stickers from other attachments
  const stickers = attachments?.filter(att => att.type === 'sticker') || [];
  const otherAttachments = attachments?.filter(att => att.type !== 'sticker') || [];
  const hasOnlyStickers = stickers.length > 0 && !message && otherAttachments.length === 0;
  const isEmojiOnly = message && isOnlyEmoji(message) && (!attachments || attachments.length === 0);

  const renderAttachment = (att: Attachment, index: number) => {
    if (att.type === 'sticker') {
      return (
        <motion.img
          key={index}
          src={att.url}
          alt="Sticker"
          className="h-24 w-24 object-contain"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      );
    }

    if (att.type === 'image') {
      return (
        <motion.div
          key={index}
          className="relative group cursor-pointer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => setPreviewImage(att.url || null)}
        >
          <img
            src={att.url}
            alt="Attachment"
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover border shadow-sm hover:shadow-md transition-shadow"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      );
    }

    if (att.type === 'file') {
      return (
        <motion.div
          key={index}
          className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border"
          initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{att.name || 'File'}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
          </div>
          {att.url && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(att.url, '_blank');
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      );
    }

    return null;
  };

  return (
    <>
      <motion.div
        className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {!isOwn && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback className={cn(
              senderType === 'admin' && 'bg-red-500 text-white',
              senderType === 'seller' && 'bg-primary text-primary-foreground',
              senderType === 'buyer' && 'bg-secondary text-secondary-foreground'
            )}>
              {senderName?.charAt(0)?.toUpperCase() || (senderType === 'admin' ? 'A' : senderType === 'seller' ? 'D' : 'B')}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn('max-w-[75%] space-y-1', isOwn && 'order-first')}>
          {/* Special message badges */}
          {(isDelivery || isRevisionRequest) && (
            <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              {isDelivery && (
                <Badge className="bg-green-500 text-white gap-1">
                  <Package className="h-3 w-3" />
                  Giao sản phẩm
                </Badge>
              )}
              {isRevisionRequest && (
                <Badge className="bg-orange-500 text-white gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Yêu cầu chỉnh sửa
                </Badge>
              )}
            </div>
          )}

          {/* Stickers - rendered outside bubble */}
          {stickers.length > 0 && (
            <div className={cn('flex flex-wrap gap-2', isOwn ? 'justify-end' : 'justify-start')}>
              {stickers.map((att, idx) => renderAttachment(att, idx))}
            </div>
          )}

          {/* Emoji only - no bubble */}
          {isEmojiOnly && (
            <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <span className="text-4xl">{message}</span>
            </div>
          )}

          {/* Message bubble - only show if there's text (non-emoji) or other attachments */}
          {(!hasOnlyStickers && !isEmojiOnly && (message || otherAttachments.length > 0)) && (
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 shadow-sm',
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : senderType === 'admin'
                  ? 'bg-red-100 dark:bg-red-900/30 text-foreground rounded-bl-md'
                  : 'bg-muted text-foreground rounded-bl-md',
                isDelivery && 'border-2 border-green-500',
                isRevisionRequest && 'border-2 border-orange-500'
              )}
            >
              {message && (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message}
                </p>
              )}

              {/* Other Attachments (images, files) */}
              {otherAttachments.length > 0 && (
                <div className={cn('flex flex-wrap gap-2', message && 'mt-2')}>
                  {otherAttachments.map((att, idx) => renderAttachment(att, idx))}
                </div>
              )}
            </div>
          )}

          {/* Timestamp and read status */}
          <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', isOwn ? 'justify-end' : 'justify-start')}>
            <span>{format(new Date(createdAt), 'HH:mm', { locale: vi })}</span>
            {isOwn && (
              isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )
            )}
          </div>
        </div>

        {isOwn && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={senderAvatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {senderName?.charAt(0)?.toUpperCase() || 'Y'}
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <img
            src={previewImage || ''}
            alt="Preview"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
