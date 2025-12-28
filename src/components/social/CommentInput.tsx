import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStickerPacks } from '@/hooks/useStickers';
import { Image, Smile, Sticker, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🔥', '⭐', '✨'
];

interface CommentInputProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<void>;
  placeholder?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  placeholder = 'Viết bình luận...',
  isSubmitting = false,
  autoFocus = false
}) => {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: stickerPacks = [] } = useStickerPacks();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Ảnh không được quá 50MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/comment-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setPickerOpen(false);
    inputRef.current?.focus();
  };

  const insertSticker = (stickerUrl: string) => {
    // Insert sticker as an image in content
    setImageUrl(stickerUrl);
    setPickerOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    await onSubmit(content, imageUrl || undefined);
    setContent('');
    setImageUrl(null);
  };

  if (!user) return null;

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={profile?.avatar_url || ''} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {profile?.full_name?.[0] || user.email?.[0]}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            className="flex-1 bg-transparent border-0 outline-none text-sm py-1"
            autoFocus={autoFocus}
          />
          
          <div className="flex items-center gap-0.5">
            {/* Emoji & Sticker Picker */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-accent transition-colors">
                  <Smile className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" side="top" align="end">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'emoji' | 'sticker')}>
                  <TabsList className="w-full grid grid-cols-2 h-9 rounded-none border-b">
                    <TabsTrigger value="emoji" className="gap-1 text-xs">
                      <Smile className="h-3.5 w-3.5" />
                      Emoji
                    </TabsTrigger>
                    <TabsTrigger value="sticker" className="gap-1 text-xs">
                      <Sticker className="h-3.5 w-3.5" />
                      Sticker
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="emoji" className="p-2 m-0">
                    <div className="grid grid-cols-10 gap-0.5 max-h-40 overflow-y-auto">
                      {emojiList.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => insertEmoji(emoji)}
                          className="h-7 w-7 flex items-center justify-center text-base hover:bg-accent rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sticker" className="p-2 m-0">
                    {stickerPacks.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6">
                        <Sticker className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Chưa có sticker nào</p>
                      </div>
                    ) : (
                      <Tabs defaultValue={stickerPacks[0]?.id} className="w-full">
                        <TabsList className="w-full h-8 rounded-none border-b bg-muted/50 overflow-x-auto flex justify-start">
                          {stickerPacks.map((pack) => (
                            <TabsTrigger key={pack.id} value={pack.id} className="text-[10px] px-2 py-1">
                              {pack.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {stickerPacks.map((pack) => (
                          <TabsContent key={pack.id} value={pack.id} className="p-1 m-0">
                            <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                              {(pack.stickers || [])
                                .filter(s => s.is_active)
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((sticker) => (
                                  <button
                                    key={sticker.id}
                                    onClick={() => insertSticker(sticker.image_url)}
                                    className="aspect-square p-1 hover:bg-muted rounded transition-colors"
                                  >
                                    <img 
                                      src={sticker.image_url} 
                                      alt={sticker.name} 
                                      className="w-full h-full object-contain"
                                    />
                                  </button>
                                ))}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>

            {/* Image */}
            <button 
              className="p-1.5 rounded-full hover:bg-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground hover:text-green-500" />
              )}
            </button>

            {/* Send */}
            <button 
              className={cn(
                "p-1.5 rounded-full transition-colors",
                (content.trim() || imageUrl) 
                  ? "text-primary hover:bg-primary/10" 
                  : "text-muted-foreground"
              )}
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageUrl)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div className="relative inline-block">
            <img 
              src={imageUrl} 
              alt="" 
              className="h-20 w-20 object-cover rounded-lg border"
            />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
};

export default CommentInput;
