import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RevisionWarningBadgeProps {
  remaining: number;
  total: number;
  className?: string;
  onClick?: () => void;
}

export function RevisionWarningBadge({ remaining, total, className, onClick }: RevisionWarningBadgeProps) {
  // Don't show if has plenty of revisions
  if (remaining > 2) return null;

  const isLow = remaining === 1 || remaining === 2;
  const isEmpty = remaining <= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            'cursor-pointer transition-all hover:scale-105 gap-1.5',
            isEmpty 
              ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30 animate-pulse' 
              : 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30',
            className
          )}
          onClick={onClick}
        >
          {isEmpty ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {isEmpty ? 'Hết lượt sửa' : `Còn ${remaining} lượt`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {isEmpty ? (
          <div className="text-center">
            <p className="font-medium text-red-500">Đã hết lượt chỉnh sửa!</p>
            <p className="text-xs text-muted-foreground">Click để mua thêm</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-medium">Còn {remaining}/{total} lượt chỉnh sửa</p>
            <p className="text-xs text-muted-foreground">
              {remaining === 1 ? 'Đây là lượt cuối cùng!' : 'Sắp hết lượt chỉnh sửa'}
            </p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}