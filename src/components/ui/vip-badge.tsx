import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VipBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  levelName: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const getVipStyles = (levelName: string | null | undefined) => {
  const name = (levelName || '').toLowerCase();
  
  if (name === 'diamond' || name.includes('kim cương')) {
    return {
      bg: 'bg-gradient-to-r from-cyan-500/20 via-blue-400/20 to-cyan-500/20 bg-[length:200%_100%]',
      border: 'border-cyan-400/50',
      text: 'text-cyan-500 dark:text-cyan-400',
      iconColor: 'text-cyan-500',
      animation: 'animate-vip-diamond-glow animate-vip-shimmer',
      iconAnimation: 'animate-pulse'
    };
  }
  
  if (name === 'gold' || name.includes('vàng')) {
    return {
      bg: 'bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-500/20 bg-[length:200%_100%]',
      border: 'border-yellow-500/50',
      text: 'text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-500',
      animation: 'animate-vip-gold-glow animate-vip-shimmer',
      iconAnimation: 'animate-pulse'
    };
  }
  
  if (name === 'silver' || name.includes('bạc')) {
    return {
      bg: 'bg-gradient-to-r from-slate-400/20 via-gray-300/20 to-slate-400/20 bg-[length:200%_100%]',
      border: 'border-slate-400/50',
      text: 'text-slate-500 dark:text-slate-300',
      iconColor: 'text-slate-400',
      animation: 'animate-vip-silver-glow animate-vip-shimmer',
      iconAnimation: 'animate-pulse'
    };
  }
  
  if (name === 'bronze' || name.includes('đồng')) {
    return {
      bg: 'bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-orange-600/20 bg-[length:200%_100%]',
      border: 'border-orange-600/50',
      text: 'text-orange-600 dark:text-orange-400',
      iconColor: 'text-orange-600',
      animation: 'animate-vip-bronze-glow animate-vip-shimmer',
      iconAnimation: 'animate-pulse'
    };
  }
  
  // Member level or default - show with subtle style
  return {
    bg: 'bg-gradient-to-r from-slate-500/10 via-gray-400/10 to-slate-500/10 bg-[length:200%_100%]',
    border: 'border-border',
    text: 'text-muted-foreground',
    iconColor: 'text-muted-foreground',
    animation: 'animate-vip-member-glow animate-vip-shimmer',
    iconAnimation: 'animate-pulse'
  };
};

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

const VipBadge = React.forwardRef<HTMLDivElement, VipBadgeProps>(
  ({ levelName, size = 'md', showIcon = true, className, ...props }, ref) => {
    const styles = getVipStyles(levelName);
    const displayName = levelName || 'Member';
    
    return (
      <Badge 
        ref={ref}
        variant="outline" 
        className={cn(
          'font-medium flex items-center gap-1 relative overflow-hidden',
          styles.bg,
          styles.border,
          styles.text,
          styles.animation,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showIcon && (
          <Crown className={cn(iconSizeClasses[size], styles.iconColor, styles.iconAnimation)} />
        )}
        {displayName}
      </Badge>
    );
  }
);

VipBadge.displayName = 'VipBadge';

export { VipBadge, getVipStyles as getVipColors };
