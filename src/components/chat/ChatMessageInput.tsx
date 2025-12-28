import React, { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import EmojiStickerPicker, { Sticker } from './EmojiPicker';
import ChatImageUpload from './ChatImageUpload';

export interface ChatAttachment {
  type: 'image' | 'sticker';
  url?: string;
  sticker?: Sticker;
}

interface ChatMessageInputProps {
  onSend: (message: string, attachments: ChatAttachment[]) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  onSend,
  placeholder = 'Nhập tin nhắn...',
  disabled = false,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const handleStickerSelect = async (sticker: Sticker) => {
    setSending(true);
    try {
      await onSend('', [{ type: 'sticker', sticker }]);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setPendingImages((prev) => [...prev, imageUrl]);
  };

  const handleRemoveImage = (imageUrl: string) => {
    setPendingImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  const handleSend = async () => {
    if (!message.trim() && pendingImages.length === 0) return;

    setSending(true);
    try {
      const attachments: ChatAttachment[] = pendingImages.map((url) => ({
        type: 'image',
        url,
      }));

      await onSend(message.trim(), attachments);
      setMessage('');
      setPendingImages([]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 flex-wrap p-2 bg-muted/30 rounded-lg">
          {pendingImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt="Pending upload"
                className="h-16 w-16 object-cover rounded-md border"
              />
              <button
                onClick={() => handleRemoveImage(url)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="sr-only">Remove</span>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            className="min-h-[44px] max-h-32 resize-none pr-20"
            rows={1}
          />
          
          {/* Action buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <ChatImageUpload
              onImageUpload={handleImageUpload}
              pendingImages={[]}
              onRemoveImage={() => {}}
            />
            <EmojiStickerPicker 
              onEmojiSelect={handleEmojiSelect} 
              onStickerSelect={handleStickerSelect}
            />
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && pendingImages.length === 0)}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatMessageInput;
