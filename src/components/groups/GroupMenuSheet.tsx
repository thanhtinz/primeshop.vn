import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  MessageSquareMore, UserMinus, Pin, UserPlus, Share2, 
  Bell, Flag, LogOut, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMuted: boolean;
  isOwner: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
  onShare: () => void;
  onInvite?: () => void;
}

export function GroupMenuSheet({ 
  open, 
  onOpenChange, 
  isMuted, 
  isOwner,
  onToggleMute,
  onLeave,
  onShare,
  onInvite
}: GroupMenuSheetProps) {
  
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const menuItems = [
    {
      icon: MessageSquareMore,
      label: 'Quản lý nội dung',
      onClick: () => toast.info('Tính năng đang phát triển'),
    },
    {
      icon: UserMinus,
      label: 'Bỏ theo dõi nhóm',
      onClick: () => toast.info('Đã bỏ theo dõi nhóm'),
    },
    {
      icon: Pin,
      label: 'Ghim nhóm',
      onClick: () => toast.success('Đã ghim nhóm'),
    },
    {
      icon: UserPlus,
      label: 'Mời',
      onClick: () => {
        if (onInvite) {
          onInvite();
        } else {
          toast.info('Tính năng đang phát triển');
        }
      },
    },
    {
      icon: Share2,
      label: 'Chia sẻ',
      onClick: onShare,
    },
    {
      icon: Bell,
      label: isMuted ? 'Bật thông báo' : 'Quản lý thông báo',
      onClick: onToggleMute,
    },
    {
      icon: Flag,
      label: 'Báo cáo nhóm',
      onClick: () => toast.info('Tính năng đang phát triển'),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl px-0 pb-8">
        {/* Handle bar */}
        <div className="flex justify-center py-2 mb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleAction(item.onClick)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          
          {/* Leave Group - only show if not owner */}
          {!isOwner && (
            <button
              onClick={() => handleAction(onLeave)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="font-medium">Rời nhóm</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
