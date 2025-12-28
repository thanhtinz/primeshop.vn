import * as React from 'react';
import { useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { animate } from 'animejs';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'hover' | 'float' | 'glow' | 'tilt' | 'none';
  hoverScale?: number;
  floatDistance?: number;
  glowColor?: string;
  delay?: number;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, animation = 'hover', hoverScale = 1.02, floatDistance = 5, glowColor, delay = 0, children, ...props }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || cardRef;

    // Float animation on mount
    useEffect(() => {
      if (animation !== 'float' || !combinedRef.current) return;

      const el = combinedRef.current;
      const anim = animate(el, {
        translateY: [-floatDistance, floatDistance],
        duration: 3000,
        delay,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine',
      });

      return () => { anim.pause(); };
    }, [animation, floatDistance, delay, combinedRef]);

    // Glow animation on mount
    useEffect(() => {
      if (animation !== 'glow' || !combinedRef.current) return;

      const el = combinedRef.current;
      const color = glowColor || 'hsl(var(--primary) / 0.3)';
      
      const anim = animate(el, {
        boxShadow: [
          `0 0 0px ${color}`,
          `0 0 20px ${color}`,
          `0 0 0px ${color}`,
        ],
        duration: 2000,
        delay,
        loop: true,
        easing: 'easeInOutSine',
      });

      return () => { anim.pause(); };
    }, [animation, glowColor, delay, combinedRef]);

    const handleMouseEnter = useCallback(() => {
      if (animation !== 'hover' && animation !== 'tilt') return;
      const el = combinedRef.current;
      if (!el) return;

      animate(el, {
        scale: hoverScale,
        translateY: -4,
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
        duration: 300,
        easing: 'easeOutExpo',
      });
    }, [animation, hoverScale, combinedRef]);

    const handleMouseLeave = useCallback(() => {
      if (animation !== 'hover' && animation !== 'tilt') return;
      const el = combinedRef.current;
      if (!el) return;

      animate(el, {
        scale: 1,
        translateY: 0,
        rotateX: 0,
        rotateY: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        duration: 300,
        easing: 'easeOutExpo',
      });
    }, [animation, combinedRef]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (animation !== 'tilt') return;
      const el = combinedRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`;
    }, [animation, hoverScale, combinedRef]);

    return (
      <div
        ref={combinedRef}
        className={cn(
          'rounded-xl bg-card border border-border transition-colors',
          animation !== 'none' && 'will-change-transform',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={animation === 'tilt' ? handleMouseMove : undefined}
        style={{ transformStyle: 'preserve-3d' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// Animated text with typing effect
interface AnimatedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  animation?: 'typing' | 'fadeWords' | 'slideUp';
  duration?: number;
  delay?: number;
}

const AnimatedText = React.forwardRef<HTMLSpanElement, AnimatedTextProps>(
  ({ className, text, animation = 'typing', duration = 50, delay = 0, ...props }, ref) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLSpanElement>) || textRef;

    useEffect(() => {
      const el = combinedRef.current;
      if (!el) return;

      if (animation === 'typing') {
        el.innerHTML = '';
        const chars = text.split('');
        chars.forEach((char, i) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.opacity = '0';
          el.appendChild(span);
        });

        animate(el.querySelectorAll('span'), {
          opacity: [0, 1],
          duration: 20,
          delay: (_, i) => delay + i * duration,
          easing: 'linear',
        });
      } else if (animation === 'fadeWords') {
        el.innerHTML = '';
        const words = text.split(' ');
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.textContent = word + (i < words.length - 1 ? ' ' : '');
          span.style.opacity = '0';
          span.style.display = 'inline-block';
          el.appendChild(span);
        });

        animate(el.querySelectorAll('span'), {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          delay: (_, i) => delay + i * 100,
          easing: 'easeOutExpo',
        });
      } else if (animation === 'slideUp') {
        el.innerHTML = '';
        const chars = text.split('');
        chars.forEach((char) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          el.appendChild(span);
        });

        animate(el.querySelectorAll('span'), {
          opacity: [0, 1],
          translateY: ['100%', '0%'],
          duration: 600,
          delay: (_, i) => delay + i * 30,
          easing: 'easeOutExpo',
        });
      }
    }, [text, animation, duration, delay, combinedRef]);

    return <span ref={combinedRef} className={cn('inline-block', className)} {...props} />;
  }
);
AnimatedText.displayName = 'AnimatedText';

// Counter animation
interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter = React.forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  ({ className, value, duration = 2000, delay = 0, prefix = '', suffix = '', decimals = 0, ...props }, ref) => {
    const counterRef = useRef<HTMLSpanElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLSpanElement>) || counterRef;

    useEffect(() => {
      const el = combinedRef.current;
      if (!el) return;

      const obj = { value: 0 };
      
      animate(obj, {
        value: value,
        duration,
        delay,
        easing: 'easeOutExpo',
        onUpdate: () => {
          if (el) {
            const formatted = decimals > 0 
              ? obj.value.toFixed(decimals)
              : Math.round(obj.value).toLocaleString();
            el.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
      });
    }, [value, duration, delay, prefix, suffix, decimals, combinedRef]);

    return (
      <span ref={combinedRef} className={cn('tabular-nums', className)} {...props}>
        {prefix}0{suffix}
      </span>
    );
  }
);
AnimatedCounter.displayName = 'AnimatedCounter';

export { AnimatedCard, AnimatedText, AnimatedCounter };
