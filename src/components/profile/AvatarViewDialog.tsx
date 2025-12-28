import { X } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    avatar_url?: string | null;
    full_name?: string | null;
    email?: string | null;
    avatar_description?: string | null;
    avatar_updated_at?: string | null;
  } | null;
  activeFrame?: {
    id: string;
    image_url: string;
    avatar_border_radius?: string | null;
  } | null;
}

export const AvatarViewDialog = ({ open, onOpenChange, profile, activeFrame }: AvatarViewDialogProps) => {
  const { formatDate } = useDateFormat();
  if (!profile) return null;

  const initials = profile.full_name?.charAt(0) || profile.email?.charAt(0)?.toUpperCase() || '?';
  const updatedAt = profile.avatar_updated_at 
    ? formatDate(profile.avatar_updated_at, "dd 'tháng' MM, yyyy")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Ảnh đại diện của {profile.full_name || 'Người dùng'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar preview with frame */}
          <div className="flex justify-center py-6">
            <div className={`relative ${activeFrame ? 'h-52 w-52' : 'h-44 w-44'}`}>
              {/* Glow effect */}
              <div 
                className="absolute rounded-full opacity-40 blur-2xl"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.4))',
                  width: activeFrame ? '80%' : '90%',
                  height: activeFrame ? '80%' : '90%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              
              {/* Avatar centered - size adjusted to fit frame better */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar 
                  className={`${activeFrame ? 'h-[78%] w-[78%]' : 'h-full w-full'} border-2 border-background/50 shadow-xl`}
                  style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                >
                  <AvatarImage 
                    src={profile.avatar_url || ''} 
                    className="object-cover"
                    style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }} 
                  />
                  <AvatarFallback 
                    className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground" 
                    style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Frame overlay */}
              {activeFrame && (
                <img 
                  src={activeFrame.image_url}
                  alt="Avatar frame"
                  className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-lg"
                  style={{ objectFit: 'contain' }}
                />
              )}
            </div>
          </div>

          {/* Description */}
          {profile.avatar_description && (
            <div className="text-center">
              <p className="text-foreground">{profile.avatar_description}</p>
            </div>
          )}

          {/* Updated at */}
          {updatedAt && (
            <p className="text-center text-sm text-muted-foreground">
              Cập nhật: {updatedAt}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
