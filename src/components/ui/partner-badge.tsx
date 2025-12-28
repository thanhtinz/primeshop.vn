import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Handshake, ShieldCheck, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  variant?: 'default' | 'icon-only';
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1'
};

const iconSizeClasses = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4'
};

const iconOnlySizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

const PartnerBadge = React.forwardRef<HTMLDivElement, PartnerBadgeProps>(
  ({ size = 'sm', showIcon = true, showText = true, variant = 'default', className, ...props }, ref) => {
    
    if (variant === 'icon-only') {
      return (
        <span 
          ref={ref as React.Ref<HTMLSpanElement>}
          className={cn(
            "inline-flex items-center justify-center",
            className
          )}
          title="Đối tác chính thức"
          {...props}
        >
          <BadgeCheck 
            className={cn(
              iconOnlySizeClasses[size], 
              "text-emerald-500 drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]"
            )} 
          />
        </span>
      );
    }
    
    return (
      <Badge 
        ref={ref}
        variant="outline" 
        className={cn(
          'font-semibold flex items-center gap-1 relative overflow-hidden',
          'bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-emerald-500/20 bg-[length:200%_100%]',
          'border-emerald-500/50',
          'text-emerald-600 dark:text-emerald-400',
          'animate-vip-shimmer',
          'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
          sizeClasses[size],
          className
        )}
        title="Đối tác chính thức"
        {...props}
      >
        {showIcon && (
          <BadgeCheck 
            className={cn(
              iconSizeClasses[size], 
              'text-emerald-500',
              'animate-pulse'
            )} 
          />
        )}
        {showText && <span>Partner</span>}
      </Badge>
    );
  }
);

PartnerBadge.displayName = 'PartnerBadge';

export { PartnerBadge };
