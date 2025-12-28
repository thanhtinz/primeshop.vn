import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Sticker } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStickerPacks } from '@/hooks/useStickers';

const EMOJI_CATEGORIES = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '💪', '🦾', '🖕', '✍️', '🤳', '💅'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '😻', '💑', '💏'],
  objects: ['🎁', '🎉', '🎊', '🎈', '🎂', '🍰', '🧁', '🎄', '🎃', '🎗️', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🎮', '🎯', '🎪', '🎬', '🎤', '🎧', '🎵', '🎶', '💻', '📱', '📷', '📹', '💡', '🔥', '⭐', '🌟', '✨', '💫', '🌈'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐝', '🦋', '🐌', '🐞', '🐙', '🦑', '🦀', '🐠', '🐟', '🐬', '🐳', '🦈'],
};

export interface StickerItem {
  id: string;
  url: string;
  name: string;
}

// Alias for backward compatibility
export type Sticker = StickerItem;

interface EmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect?: (sticker: StickerItem) => void;
}

const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({ 
  onEmojiSelect, 
  onStickerSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [mainTab, setMainTab] = useState<'emoji' | 'sticker'>('emoji');
  const { data: stickerPacks = [] } = useStickerPacks();

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  const handleStickerClick = (sticker: StickerItem) => {
    if (onStickerSelect) {
      onStickerSelect(sticker);
      setOpen(false);
    }
  };

  // Transform sticker packs to the format expected by the component
  const formattedPacks = stickerPacks.map(pack => ({
    id: pack.id,
    name: pack.name,
    stickers: (pack.stickers || [])
      .filter(s => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({
        id: s.id,
        url: s.image_url,
        name: s.name,
      })),
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'emoji' | 'sticker')} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-none border-b">
            <TabsTrigger value="emoji" className="gap-1">
              <Smile className="h-4 w-4" />
              Emoji
            </TabsTrigger>
            <TabsTrigger value="sticker" className="gap-1">
              <Sticker className="h-4 w-4" />
              Sticker
            </TabsTrigger>
          </TabsList>

          {/* Emoji Tab */}
          <TabsContent value="emoji" className="m-0">
            <Tabs defaultValue="smileys" className="w-full">
              <TabsList className="w-full grid grid-cols-5 h-9 rounded-none border-b bg-muted/50">
                <TabsTrigger value="smileys" className="text-lg p-1">😀</TabsTrigger>
                <TabsTrigger value="gestures" className="text-lg p-1">👍</TabsTrigger>
                <TabsTrigger value="hearts" className="text-lg p-1">❤️</TabsTrigger>
                <TabsTrigger value="objects" className="text-lg p-1">🎁</TabsTrigger>
                <TabsTrigger value="animals" className="text-lg p-1">🐶</TabsTrigger>
              </TabsList>
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <TabsContent key={category} value={category} className="p-2 m-0">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-xl p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Sticker Tab */}
          <TabsContent value="sticker" className="m-0 p-4">
            {formattedPacks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Sticker className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có sticker nào</p>
                <p className="text-xs mt-1">Admin sẽ tải lên sau</p>
              </div>
            ) : (
              <Tabs defaultValue={formattedPacks[0]?.id} className="w-full">
                <TabsList className="w-full h-9 rounded-none border-b bg-muted/50 overflow-x-auto">
                  {formattedPacks.map((pack) => (
                    <TabsTrigger key={pack.id} value={pack.id} className="text-xs px-3">
                      {pack.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {formattedPacks.map((pack) => (
                  <TabsContent key={pack.id} value={pack.id} className="p-2 m-0">
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {pack.stickers.map((sticker) => (
                        <button
                          key={sticker.id}
                          onClick={() => handleStickerClick(sticker)}
                          className="aspect-square p-1 hover:bg-muted rounded transition-colors cursor-pointer"
                        >
                          <img 
                            src={sticker.url} 
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
  );
};

export default EmojiStickerPicker;
