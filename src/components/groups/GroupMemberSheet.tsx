import { Sheet, SheetContent } from '@/components/ui/sheet';
import { UserMinus, Bell, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface GroupMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
}

export function GroupMemberSheet({ 
  open, 
  onOpenChange, 
  isMuted,
  onToggleMute,
  onLeave,
}: GroupMemberSheetProps) {
  
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const menuItems = [
    {
      icon: UserMinus,
      label: 'Bỏ theo dõi nhóm',
      onClick: () => toast.info('Đã bỏ theo dõi nhóm'),
    },
    {
      icon: Bell,
      label: 'Quản lý thông báo',
      onClick: onToggleMute,
    },
    {
      icon: LogOut,
      label: 'Rời nhóm',
      onClick: onLeave,
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
