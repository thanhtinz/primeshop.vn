import * as React from 'react';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { animate, stagger } from 'animejs';

interface AnimatedListProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'stagger' | 'cascade' | 'wave' | 'random';
  staggerDelay?: number;
  duration?: number;
  triggerOnMount?: boolean;
}

const AnimatedList = React.forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ className, animation = 'stagger', staggerDelay = 60, duration = 600, triggerOnMount = true, children, ...props }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || listRef;
    const hasAnimated = useRef(false);

    useEffect(() => {
      if (!triggerOnMount || hasAnimated.current || !combinedRef.current) return;
      hasAnimated.current = true;

      const items = combinedRef.current.querySelectorAll('.animated-list-item');
      if (items.length === 0) return;

      // Set initial state
      items.forEach((item) => {
        (item as HTMLElement).style.opacity = '0';
      });

      const animations: Record<string, Parameters<typeof animate>[1]> = {
        stagger: {
          opacity: [0, 1],
          translateY: [30, 0],
          duration,
          delay: stagger(staggerDelay, { start: 100 }),
          easing: 'easeOutExpo',
        },
        cascade: {
          opacity: [0, 1],
          translateX: [-30, 0],
          translateY: [10, 0],
          duration,
          delay: stagger(staggerDelay, { start: 100, from: 'first' }),
          easing: 'easeOutExpo',
        },
        wave: {
          opacity: [0, 1],
          translateY: [40, 0],
          scale: [0.9, 1],
          duration,
          delay: stagger(staggerDelay, { start: 50, from: 'center' }),
          easing: 'easeOutElastic(1, .6)',
        },
        random: {
          opacity: [0, 1],
          translateY: [20, 0],
          rotate: [() => Math.random() * 10 - 5, 0],
          duration,
          delay: stagger(staggerDelay, { start: 50, from: 'random' }),
          easing: 'easeOutExpo',
        },
      };

      animate(items, animations[animation]);
    }, [animation, staggerDelay, duration, triggerOnMount, combinedRef]);

    return (
      <div ref={combinedRef} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);
AnimatedList.displayName = 'AnimatedList';

interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('animated-list-item', className)} {...props}>
        {children}
      </div>
    );
  }
);
AnimatedListItem.displayName = 'AnimatedListItem';

// Scroll-triggered animated section
interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'zoomIn';
  duration?: number;
  delay?: number;
  threshold?: number;
}

const AnimatedSection = React.forwardRef<HTMLDivElement, AnimatedSectionProps>(
  ({ className, animation = 'fadeUp', duration = 700, delay = 0, threshold = 0.1, children, ...props }, ref) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || sectionRef;
    const hasAnimated = useRef(false);

    useEffect(() => {
      if (!combinedRef.current) return;

      const el = combinedRef.current;
      el.style.opacity = '0';

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated.current) {
              hasAnimated.current = true;

              const animations: Record<string, Parameters<typeof animate>[1]> = {
                fadeUp: {
                  opacity: [0, 1],
                  translateY: [50, 0],
                  duration,
                  delay,
                  easing: 'easeOutExpo',
                },
                fadeIn: {
                  opacity: [0, 1],
                  duration,
                  delay,
                  easing: 'easeOutExpo',
                },
                slideLeft: {
                  opacity: [0, 1],
                  translateX: [100, 0],
                  duration,
                  delay,
                  easing: 'easeOutExpo',
                },
                slideRight: {
                  opacity: [0, 1],
                  translateX: [-100, 0],
                  duration,
                  delay,
                  easing: 'easeOutExpo',
                },
                zoomIn: {
                  opacity: [0, 1],
                  scale: [0.8, 1],
                  duration,
                  delay,
                  easing: 'easeOutBack',
                },
              };

              animate(el, animations[animation]);
            }
          });
        },
        { threshold }
      );

      observer.observe(el);

      return () => observer.disconnect();
    }, [animation, duration, delay, threshold, combinedRef]);

    return (
      <div ref={combinedRef} className={cn('will-change-transform', className)} {...props}>
        {children}
      </div>
    );
  }
);
AnimatedSection.displayName = 'AnimatedSection';

export { AnimatedList, AnimatedListItem, AnimatedSection };
