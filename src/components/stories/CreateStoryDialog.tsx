import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, ImagePlus, Type, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateStory } from '@/hooks/useStories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BACKGROUND_COLORS = [
  'bg-gradient-to-br from-pink-500 to-orange-500',
  'bg-gradient-to-br from-purple-600 to-blue-500',
  'bg-gradient-to-br from-green-400 to-cyan-500',
  'bg-gradient-to-br from-yellow-400 to-red-500',
  'bg-gradient-to-br from-indigo-500 to-purple-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-black',
  'bg-white',
];

interface CreateStoryDialogProps {
  children?: React.ReactNode;
}

export function CreateStoryDialog({ children }: CreateStoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createStory = useCreateStory();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Chỉ hỗ trợ ảnh hoặc video');
      return;
    }

    // Image max 10MB, Video max 100MB
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxLabel = file.type.startsWith('video/') ? '100MB' : '10MB';
    
    if (file.size > maxSize) {
      toast.error(`File không được vượt quá ${maxLabel}`);
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setSelectedImage(publicUrl);
      setMode('image');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải lên file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'image' && !selectedImage) {
      toast.error('Vui lòng chọn ảnh');
      return;
    }

    if (mode === 'text' && !textContent.trim()) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }

    try {
      if (mode === 'image') {
        await createStory.mutateAsync({
          media_url: selectedImage!,
          media_type: selectedImage?.includes('.mp4') ? 'video' : 'image',
          caption: caption.trim() || undefined
        });
      } else {
        // For text stories, create a placeholder image URL
        await createStory.mutateAsync({
          media_url: 'text-story',
          media_type: 'image',
          text_content: textContent.trim(),
          background_color: selectedBg,
          caption: caption.trim() || undefined
        });
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating story:', error);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setTextContent('');
    setCaption('');
    setMode('image');
    setSelectedBg(BACKGROUND_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {children || (
          <button className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-primary/50 hover:border-primary transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Tạo story</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo Story mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'image' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('image')}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Ảnh/Video
            </Button>
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMode('text')}
            >
              <Type className="h-4 w-4 mr-2" />
              Văn bản
            </Button>
          </div>

          {mode === 'image' ? (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              
              {selectedImage ? (
                <div className="relative aspect-[9/16] max-h-[300px] rounded-lg overflow-hidden bg-black">
                  <img src={selectedImage} alt="" className="w-full h-full object-contain" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-[9/16] max-h-[300px] rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Chọn ảnh hoặc video</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className={cn(
                "aspect-[9/16] max-h-[300px] rounded-lg flex items-center justify-center p-6",
                selectedBg
              )}>
                <p className={cn(
                  "text-center text-xl font-bold",
                  selectedBg === 'bg-white' ? 'text-black' : 'text-white'
                )}>
                  {textContent || 'Nhập nội dung...'}
                </p>
              </div>

              {/* Background selector */}
              <div className="space-y-2">
                <Label>Màu nền</Label>
                <div className="flex gap-2 flex-wrap">
                  {BACKGROUND_COLORS.map((bg, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        bg,
                        selectedBg === bg ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                      )}
                      onClick={() => setSelectedBg(bg)}
                    />
                  ))}
                </div>
              </div>

              {/* Text input */}
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  placeholder="Viết gì đó..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {textContent.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label>Chú thích (tùy chọn)</Label>
            <Textarea
              placeholder="Thêm chú thích..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createStory.isPending || (mode === 'image' && !selectedImage) || (mode === 'text' && !textContent.trim())}
          >
            {createStory.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang đăng...
              </>
            ) : (
              'Đăng Story'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
