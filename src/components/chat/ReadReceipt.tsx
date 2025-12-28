import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatReadTime } from '@/hooks/useReadReceipts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadReceiptProps {
  isRead: boolean;
  readAt?: string | null;
  isSender: boolean;
  className?: string;
}

export function ReadReceipt({ isRead, readAt, isSender, className }: ReadReceiptProps) {
  if (!isSender) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex ml-1", className)}>
          {isRead ? (
            <CheckCheck className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Check className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {isRead ? formatReadTime(readAt || null) : 'Đã gửi'}
      </TooltipContent>
    </Tooltip>
  );
}
