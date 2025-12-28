import { useState, useRef } from 'react';
import { Camera, Globe, Loader2, Sparkles, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSetActiveFrame } from '@/hooks/useAvatarFrames';

interface AvatarFrame {
  id: string;
  image_url: string;
  name: string;
  avatar_border_radius?: string | null;
}

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFrame?: AvatarFrame | null;
  allFrames?: AvatarFrame[];
  userOwnedFrameIds?: string[];
}

export const AvatarUploadDialog = ({ 
  open, 
  onOpenChange, 
  activeFrame, 
  allFrames = [],
  userOwnedFrameIds = []
}: AvatarUploadDialogProps) => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setActiveFrameMutation = useSetActiveFrame();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [shareToFeed, setShareToFeed] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(activeFrame?.id || null);
  const [expirationDays, setExpirationDays] = useState<string>('never');
  const [showFrameSelector, setShowFrameSelector] = useState(false);
  const [hasSelectedFrame, setHasSelectedFrame] = useState(false);

  const currentFrame = hasSelectedFrame 
    ? (selectedFrameId ? allFrames.find(f => f.id === selectedFrameId) : null)
    : activeFrame;

  // Helper to check if user has Prime Boost
  const hasPrime = profile?.has_prime_boost && 
                   profile?.prime_expires_at && 
                   new Date(profile.prime_expires_at) > new Date();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File quá lớn. Tối đa 50MB');
        return;
      }
      
      // Check GIF restriction for non-Prime users
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      if (isGif && !hasPrime) {
        toast.error('Chỉ thành viên Prime mới được sử dụng ảnh GIF');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFrameSelect = (frameId: string | null) => {
    setSelectedFrameId(frameId);
    setHasSelectedFrame(true);
    setShowFrameSelector(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsUploading(true);
    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(fileName);

        avatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Calculate expiration date
      let expiresAt: string | null = null;
      if (expirationDays !== 'never') {
        const days = parseInt(expirationDays);
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        expiresAt = expDate.toISOString();
      }

      // Update profile
      const updateData: any = {
        avatar_description: description || null,
        avatar_updated_at: new Date().toISOString(),
        avatar_expires_at: expiresAt,
      };
      
      if (selectedFile) {
        updateData.avatar_url = avatarUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update active frame if changed
      if (selectedFrameId !== activeFrame?.id) {
        await setActiveFrameMutation.mutateAsync(selectedFrameId);
      }

      // If share to feed is enabled and new avatar uploaded
      if (shareToFeed && selectedFile) {
        const { error: postError } = await supabase
          .from('user_posts')
          .insert({
            user_id: user.id,
            content: description || 'đã cập nhật ảnh đại diện.',
            images: [avatarUrl],
            visibility: 'public'
          });

        if (postError) {
          console.error('Error creating post:', postError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Cập nhật avatar thành công');
      
      handleClose();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Không thể cập nhật avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setShareToFeed(true);
    setSelectedFrameId(activeFrame?.id || null);
    setExpirationDays('never');
    setShowFrameSelector(false);
    setHasSelectedFrame(false);
    onOpenChange(false);
  };

  const initials = profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?';
  const displayUrl = previewUrl || profile?.avatar_url || '';

  // Filter owned frames
  const ownedFrames = allFrames.filter(f => userOwnedFrameIds.includes(f.id));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Xem trước ảnh đại diện</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4">
            {/* Privacy indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Đến:</span>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>Công khai</span>
              </div>
            </div>

            {/* Description input */}
            <Textarea
              placeholder="Hãy nói gì đó về ảnh đại diện của bạn"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] resize-none"
              maxLength={500}
            />

            {/* Avatar preview with frame */}
            <div className="flex justify-center py-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {/* Frame + Avatar container */}
              <div 
                className="relative cursor-pointer group"
                style={{ 
                  width: currentFrame ? '200px' : '160px', 
                  height: currentFrame ? '200px' : '160px' 
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Glow effect */}
                <div 
                  className="absolute rounded-full opacity-30 blur-xl transition-opacity group-hover:opacity-50"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4))',
                    width: '70%',
                    height: '70%',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                
                {/* Avatar - centered */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar 
                    className="border-4 border-background shadow-xl ring-2 ring-background/50 transition-transform group-hover:scale-105"
                    style={{ 
                      borderRadius: currentFrame?.avatar_border_radius || '50%',
                      width: currentFrame ? '62%' : '100%',
                      height: currentFrame ? '62%' : '100%'
                    }}
                  >
                    <AvatarImage 
                      src={displayUrl}
                      className="object-cover"
                      style={{ borderRadius: currentFrame?.avatar_border_radius || '50%' }} 
                    />
                    <AvatarFallback 
                      className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground" 
                      style={{ borderRadius: currentFrame?.avatar_border_radius || '50%' }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Frame overlay */}
                {currentFrame && (
                  <img 
                    src={currentFrame.image_url}
                    alt="Avatar frame"
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-lg"
                    style={{ objectFit: 'contain' }}
                  />
                )}
                
                {/* Camera overlay on hover */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  style={{ 
                    borderRadius: currentFrame ? '0' : '50%',
                    width: currentFrame ? '62%' : '100%',
                    height: currentFrame ? '62%' : '100%',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-1" />
                Chọn ảnh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFrameSelector(!showFrameSelector)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Chọn khung
              </Button>
            </div>

            {/* Frame selector */}
            {showFrameSelector && (
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Chọn khung avatar</Label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {/* No frame option */}
                  <button
                    onClick={() => handleFrameSelect(null)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      !selectedFrameId 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Không</span>
                    </div>
                  </button>
                  
                  {/* Owned frames */}
                  {ownedFrames.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => handleFrameSelect(frame.id)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedFrameId === frame.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <img 
                        src={frame.image_url} 
                        alt={frame.name}
                        className="w-12 h-12 mx-auto object-contain"
                      />
                    </button>
                  ))}
                </div>
                {ownedFrames.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Bạn chưa sở hữu khung nào. Mua khung trong cửa hàng!
                  </p>
                )}
              </div>
            )}

            {/* Expiration setting */}
            <div className="flex items-center justify-between gap-3 py-2 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Tự động xóa sau</Label>
              </div>
              <Select value={expirationDays} onValueChange={setExpirationDays}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Không bao giờ</SelectItem>
                  <SelectItem value="1">1 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="14">14 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="90">90 ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Share to feed toggle */}
            <div className="flex items-center justify-between py-2 border-t">
              <Label htmlFor="share-feed" className="cursor-pointer">
                Chia sẻ thông tin mới lên Bảng feed
              </Label>
              <Switch
                id="share-feed"
                checked={shareToFeed}
                onCheckedChange={setShareToFeed}
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Hủy
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu'
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
