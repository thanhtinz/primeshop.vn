import * as React from 'react';
import { useRef, useCallback } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { animate } from 'animejs';

const animatedButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:shadow-lg',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        glow: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
      animation: {
        none: '',
        scale: '',
        bounce: '',
        jelly: '',
        pulse: '',
        ripple: 'relative overflow-hidden',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'scale',
    },
  }
);

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof animatedButtonVariants> {
  asChild?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant, size, animation, asChild = false, onMouseEnter, onMouseLeave, onClick, children, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef;

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const el = combinedRef.current;
      if (!el) return;

      if (animation === 'scale' || animation === 'bounce' || animation === 'jelly' || animation === 'pulse') {
        animate(el, {
          scale: 1.03,
          translateY: -2,
          duration: 200,
          easing: 'easeOutExpo',
        });
      }

      if (animation === 'pulse') {
        animate(el, {
          boxShadow: ['0 0 0px rgba(var(--primary), 0)', '0 0 20px rgba(var(--primary), 0.4)'],
          duration: 300,
          easing: 'easeOutExpo',
        });
      }

      onMouseEnter?.(e);
    }, [animation, onMouseEnter, combinedRef]);

    const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const el = combinedRef.current;
      if (!el) return;

      animate(el, {
        scale: 1,
        translateY: 0,
        boxShadow: '0 0 0px rgba(var(--primary), 0)',
        duration: 200,
        easing: 'easeOutExpo',
      });

      onMouseLeave?.(e);
    }, [onMouseLeave, combinedRef]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const el = combinedRef.current;
      if (!el) {
        onClick?.(e);
        return;
      }

      if (animation === 'scale') {
        animate(el, {
          scale: [1, 0.95, 1.02, 1],
          duration: 300,
          easing: 'easeOutExpo',
        });
      } else if (animation === 'bounce') {
        animate(el, {
          translateY: [0, -8, 0],
          duration: 400,
          easing: 'easeOutBounce',
        });
      } else if (animation === 'jelly') {
        animate(el, {
          scaleX: [1, 1.15, 0.85, 1.05, 0.97, 1],
          scaleY: [1, 0.85, 1.15, 0.95, 1.03, 1],
          duration: 500,
          easing: 'easeOutElastic(1, .5)',
        });
      } else if (animation === 'ripple' && rippleRef.current) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        rippleRef.current.style.left = `${x}px`;
        rippleRef.current.style.top = `${y}px`;
        
        animate(rippleRef.current, {
          scale: [0, 4],
          opacity: [0.5, 0],
          duration: 600,
          easing: 'easeOutExpo',
        });
      }

      onClick?.(e);
    }, [animation, onClick, combinedRef]);

    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(animatedButtonVariants({ variant, size, animation, className }))}
        ref={combinedRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {children}
        {animation === 'ripple' && (
          <span
            ref={rippleRef}
            className="absolute w-4 h-4 bg-white/30 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ transform: 'scale(0)' }}
          />
        )}
      </Comp>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton, animatedButtonVariants };
