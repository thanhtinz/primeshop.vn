import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUploadBanner } from '@/hooks/useUserProfile';
import { useAvatarFrames, useUserAvatarFrames } from '@/hooks/useAvatarFrames';
import { AvatarUploadDialog } from './AvatarUploadDialog';

export const ProfileHeader = () => {
  const { profile } = useAuth();
  const uploadBanner = useUploadBanner();
  const { data: frames } = useAvatarFrames();
  const { data: userFrames } = useUserAvatarFrames();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  const activeFrameId = profile?.avatar_frame_id;
  const activeFrame = frames?.find(f => f.id === activeFrameId);
  const userOwnedFrameIds = userFrames?.map(uf => uf.frame_id) || [];

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Banner input changed!', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size);
      if (file.size > 50 * 1024 * 1024) {
        alert('File quá lớn. Tối đa 50MB');
        return;
      }
      uploadBanner.mutate(file);
    }
  };

  const bannerUrl = (profile as any)?.banner_url;
  const initials = profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="relative">
      {/* Hidden file input - OUTSIDE banner div */}
      <input
        id="banner-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleBannerChange}
        onClick={() => console.log('Banner input clicked!')}
      />

      {/* Banner */}
      <div 
        className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/40 rounded-xl relative"
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Banner change button using label */}
        <label
          htmlFor="banner-upload"
          onClick={() => console.log('Banner label clicked!')}
          className="absolute top-2 right-2 z-50 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors shadow-md"
        >
          {uploadBanner.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Camera className="h-4 w-4" />
              <span>Đổi banner</span>
            </>
          )}
        </label>
      </div>

      {/* Avatar with frame - Discord style */}
      <div className="absolute -bottom-16 left-4 sm:left-8">
        <div className="relative">
          {/* Frame container - bigger size */}
          <div className={`relative ${activeFrame ? 'h-52 w-52' : 'h-32 w-32'}`}>
            {/* Avatar - fixed size to fill frame properly */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative group">
                <Avatar 
                  className={`${activeFrame ? 'h-[31px] w-[31px]' : 'h-32 w-32'} border border-background shadow-lg cursor-pointer`}
                  style={{ 
                    borderRadius: activeFrame?.avatar_border_radius || '50%',
                    width: activeFrame ? '176px' : undefined,
                    height: activeFrame ? '176px' : undefined
                  }}
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <AvatarImage src={profile?.avatar_url || ''} style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground" style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full z-30 pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAvatarDialogOpen(true);
                  }}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Frame overlay on top */}
            {activeFrame && (
              <img 
                key={activeFrame.id}
                src={activeFrame.image_url}
                alt="Avatar frame"
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <AvatarUploadDialog 
        open={avatarDialogOpen} 
        onOpenChange={setAvatarDialogOpen}
        activeFrame={activeFrame}
        allFrames={frames || []}
        userOwnedFrameIds={userOwnedFrameIds}
      />

      {/* Spacer for avatar overflow */}
      <div className="h-20" />
    </div>
  );
};
