import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Palette, Heart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '💯', '🎉'];

const BACKGROUND_THEMES = [
  { id: 'default', name: 'Mặc định', gradient: 'bg-background' },
  { id: 'blue', name: 'Xanh dương', gradient: 'bg-gradient-to-b from-blue-500/10 to-blue-600/5' },
  { id: 'purple', name: 'Tím', gradient: 'bg-gradient-to-b from-purple-500/10 to-purple-600/5' },
  { id: 'pink', name: 'Hồng', gradient: 'bg-gradient-to-b from-pink-500/10 to-pink-600/5' },
  { id: 'green', name: 'Xanh lá', gradient: 'bg-gradient-to-b from-green-500/10 to-green-600/5' },
  { id: 'orange', name: 'Cam', gradient: 'bg-gradient-to-b from-orange-500/10 to-orange-600/5' },
  { id: 'dark', name: 'Tối', gradient: 'bg-gradient-to-b from-gray-900/50 to-gray-800/30' },
  { id: 'sunset', name: 'Hoàng hôn', gradient: 'bg-gradient-to-b from-orange-400/10 via-pink-500/10 to-purple-600/10' },
];

interface ChatSettingsDialogProps {
  roomId: string;
  currentEmoji?: string;
  currentBackground?: string;
  currentNickname?: string;
  onUpdate: () => void;
  children?: React.ReactNode;
}

export function ChatSettingsDialog({
  roomId,
  currentEmoji = '👍',
  currentBackground = 'default',
  currentNickname = '',
  onUpdate,
  children
}: ChatSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);
  const [selectedBackground, setSelectedBackground] = useState(currentBackground);
  const [nickname, setNickname] = useState(currentNickname);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedEmoji(currentEmoji);
    setSelectedBackground(currentBackground);
    setNickname(currentNickname || '');
  }, [currentEmoji, currentBackground, currentNickname, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          quick_reaction_emoji: selectedEmoji,
          background_theme: selectedBackground,
          nickname: nickname || null
        })
        .eq('id', roomId);

      if (error) throw error;
      
      toast.success('Đã lưu cài đặt');
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="rounded-full text-blue-500">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cài đặt cuộc trò chuyện</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Quick Reaction */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Biểu tượng cảm xúc nhanh
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                    selectedEmoji === emoji 
                      ? "bg-blue-500 scale-110 shadow-lg" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Background Theme */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Chủ đề nền
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUND_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedBackground(theme.id)}
                  className={cn(
                    "h-16 rounded-lg transition-all flex items-center justify-center text-xs font-medium",
                    theme.gradient,
                    selectedBackground === theme.id 
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" 
                      : "hover:opacity-80"
                  )}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Biệt danh cho đối phương
            </Label>
            <Input 
              placeholder="Nhập biệt danh..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground">
              Biệt danh chỉ hiển thị với bạn
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getBackgroundClass(themeId: string): string {
  const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
  return theme?.gradient || 'bg-background';
}
