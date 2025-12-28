import { cn } from '@/lib/utils';
import { useUserOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDateFormat } from '@/hooks/useDateFormat';

interface OnlineIndicatorProps {
  userId?: string;
  className?: string;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OnlineIndicator({ 
  userId, 
  className,
  showLastSeen = false,
  size = 'sm'
}: OnlineIndicatorProps) {
  const { data: status } = useUserOnlineStatus(userId);
  const { formatRelative } = useDateFormat();

  if (!status) return null;

  const sizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  if (showLastSeen && !status.is_online && status.last_seen) {
    return (
      <span className="text-xs text-muted-foreground">
        Hoạt động {formatRelative(status.last_seen)}
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "rounded-full border-2 border-background",
        status.is_online 
          ? "bg-green-500" 
          : "bg-muted-foreground",
        sizeClasses[size],
        className
      )}
      title={status.is_online ? 'Đang hoạt động' : 'Ngoại tuyến'}
    />
  );
}
