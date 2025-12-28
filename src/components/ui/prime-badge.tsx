import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';

type PrimeType = 'basic' | 'boost';

interface PrimeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  primeType?: PrimeType;
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

const getPrimeStyles = (primeType: PrimeType) => {
  if (primeType === 'basic') {
    return {
      bg: 'bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20 bg-[length:200%_100%]',
      border: 'border-blue-500/50',
      text: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500',
      animation: 'animate-vip-diamond-glow animate-vip-shimmer',
      icon: Zap,
      label: 'Basic'
    };
  }
  
  // Boost - pink diamond
  return {
    bg: 'bg-gradient-to-r from-pink-500/20 via-purple-400/20 to-pink-500/20 bg-[length:200%_100%]',
    border: 'border-pink-500/50',
    text: 'text-pink-600 dark:text-pink-400',
    iconColor: 'text-pink-500',
    animation: 'animate-vip-gold-glow animate-vip-shimmer',
    icon: Diamond,
    label: 'Boost'
  };
};

const PrimeBadge = React.forwardRef<HTMLDivElement, PrimeBadgeProps>(
  ({ size = 'md', showIcon = true, showText = true, primeType = 'boost', className, ...props }, ref) => {
    const styles = getPrimeStyles(primeType);
    const IconComponent = styles.icon;
    
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
          <IconComponent className={cn(iconSizeClasses[size], styles.iconColor, 'animate-pulse')} />
        )}
        {showText && styles.label}
      </Badge>
    );
  }
);

PrimeBadge.displayName = 'PrimeBadge';

export { PrimeBadge, getPrimeStyles };
export type { PrimeType };