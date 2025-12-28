import { Shield, FileWarning, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NDABadgeProps {
  requiresNDA?: boolean;
  noPortfolioUse?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function NDABadge({ requiresNDA, noPortfolioUse, className, showLabel = true }: NDABadgeProps) {
  if (!requiresNDA && !noPortfolioUse) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {requiresNDA && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
              <Shield className="h-3 w-3" />
              {showLabel && 'NDA'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Yêu cầu bảo mật NDA</p>
            <p className="text-xs text-muted-foreground">Thông tin thiết kế phải được bảo mật</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {noPortfolioUse && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/30">
              <EyeOff className="h-3 w-3" />
              {showLabel && 'No Portfolio'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Không dùng làm Portfolio</p>
            <p className="text-xs text-muted-foreground">Designer không được sử dụng thiết kế này làm mẫu</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
