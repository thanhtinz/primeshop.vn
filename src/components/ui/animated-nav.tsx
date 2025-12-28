import * as React from 'react';
import { useRef, useCallback } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { animate } from 'animejs';

interface AnimatedNavLinkProps extends LinkProps {
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export const AnimatedNavLink = React.forwardRef<HTMLAnchorElement, AnimatedNavLinkProps>(
  ({ isActive, children, className, activeClassName, to, ...props }, ref) => {
    const linkRef = useRef<HTMLAnchorElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLAnchorElement>) || linkRef;

    const handleMouseEnter = useCallback(() => {
      const el = combinedRef.current;
      if (!el) return;

      animate(el, {
        scale: 1.05,
        duration: 200,
        easing: 'easeOutExpo',
      });
    }, [combinedRef]);

    const handleMouseLeave = useCallback(() => {
      const el = combinedRef.current;
      if (!el) return;

      animate(el, {
        scale: 1,
        duration: 200,
        easing: 'easeOutExpo',
      });
    }, [combinedRef]);

    return (
      <Link
        ref={combinedRef}
        to={to}
        className={cn(
          'inline-flex items-center gap-1 transition-colors will-change-transform',
          className,
          isActive && activeClassName
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Link>
    );
  }
);
AnimatedNavLink.displayName = 'AnimatedNavLink';

// Animated icon with hover effect
interface AnimatedIconProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'bounce' | 'spin' | 'pulse' | 'shake' | 'jelly';
  trigger?: 'hover' | 'click' | 'auto';
  children: React.ReactNode;
}

export const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ animation = 'bounce', trigger = 'hover', children, className, onClick, ...props }, ref) => {
    const iconRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || iconRef;

    const triggerAnimation = useCallback(() => {
      const el = combinedRef.current;
      if (!el) return;

      const animations: Record<string, Parameters<typeof animate>[1]> = {
        bounce: {
          translateY: [0, -8, 0],
          duration: 500,
          easing: 'easeOutBounce',
        },
        spin: {
          rotate: [0, 360],
          duration: 600,
          easing: 'easeOutExpo',
        },
        pulse: {
          scale: [1, 1.2, 1],
          duration: 400,
          easing: 'easeOutExpo',
        },
        shake: {
          translateX: [0, -5, 5, -5, 5, 0],
          duration: 400,
          easing: 'easeInOutSine',
        },
        jelly: {
          scaleX: [1, 1.15, 0.85, 1.05, 0.97, 1],
          scaleY: [1, 0.85, 1.15, 0.95, 1.03, 1],
          duration: 500,
          easing: 'easeOutElastic(1, .5)',
        },
      };

      animate(el, animations[animation]);
    }, [animation, combinedRef]);

    const handleMouseEnter = trigger === 'hover' ? triggerAnimation : undefined;
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (trigger === 'click') triggerAnimation();
      onClick?.(e);
    }, [trigger, triggerAnimation, onClick]);

    React.useEffect(() => {
      if (trigger === 'auto') {
        const interval = setInterval(triggerAnimation, 3000);
        return () => clearInterval(interval);
      }
    }, [trigger, triggerAnimation]);

    return (
      <div
        ref={combinedRef}
        className={cn('inline-flex will-change-transform', className)}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AnimatedIcon.displayName = 'AnimatedIcon';

// Animated badge with attention-grabbing effect
interface AnimatedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pulse' | 'bounce' | 'glow' | 'shake';
  children: React.ReactNode;
}

export const AnimatedBadge = React.forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ variant = 'pulse', children, className, ...props }, ref) => {
    const badgeRef = useRef<HTMLSpanElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLSpanElement>) || badgeRef;

    React.useEffect(() => {
      const el = combinedRef.current;
      if (!el) return;

      let anim: ReturnType<typeof animate>;

      if (variant === 'pulse') {
        anim = animate(el, {
          scale: [1, 1.1, 1],
          duration: 1500,
          loop: true,
          easing: 'easeInOutSine',
        });
      } else if (variant === 'bounce') {
        anim = animate(el, {
          translateY: [0, -3, 0],
          duration: 1000,
          loop: true,
          easing: 'easeInOutSine',
        });
      } else if (variant === 'glow') {
        anim = animate(el, {
          boxShadow: [
            '0 0 0px currentColor',
            '0 0 10px currentColor',
            '0 0 0px currentColor',
          ],
          duration: 1500,
          loop: true,
          easing: 'easeInOutSine',
        });
      } else if (variant === 'shake') {
        anim = animate(el, {
          rotate: [-3, 3, -3],
          duration: 200,
          loop: true,
          direction: 'alternate',
          easing: 'easeInOutSine',
        });
      }

      return () => { if (anim) anim.pause(); };
    }, [variant, combinedRef]);

    return (
      <span
        ref={combinedRef}
        className={cn('inline-flex items-center will-change-transform', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
AnimatedBadge.displayName = 'AnimatedBadge';
