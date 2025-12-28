import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Hook to animate page elements on mount
 */
export function usePageEnterAnimation(options?: {
  selector?: string;
  staggerDelay?: number;
  duration?: number;
  translateY?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const selector = options?.selector || '.animate-enter';
    const elements = containerRef.current.querySelectorAll(selector);
    
    if (elements.length === 0) return;

    animate(elements, {
      opacity: [0, 1],
      translateY: [options?.translateY ?? 30, 0],
      duration: options?.duration ?? 600,
      delay: stagger(options?.staggerDelay ?? 80, { start: 100 }),
      easing: 'easeOutExpo',
    });
  }, [options?.selector, options?.staggerDelay, options?.duration, options?.translateY]);

  return containerRef;
}

/**
 * Hook to animate a single element on mount
 */
export function useEnterAnimation(options?: {
  animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleIn' | 'bounceIn';
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !ref.current) return;
    hasAnimated.current = true;

    const el = ref.current;
    const animation = options?.animation ?? 'fadeUp';
    const duration = options?.duration ?? 600;
    const delay = options?.delay ?? 0;

    const animations: Record<string, Parameters<typeof animate>[1]> = {
      fadeUp: {
        opacity: [0, 1],
        translateY: [30, 0],
        duration,
        delay,
        easing: 'easeOutExpo',
      },
      fadeDown: {
        opacity: [0, 1],
        translateY: [-30, 0],
        duration,
        delay,
        easing: 'easeOutExpo',
      },
      fadeLeft: {
        opacity: [0, 1],
        translateX: [30, 0],
        duration,
        delay,
        easing: 'easeOutExpo',
      },
      fadeRight: {
        opacity: [0, 1],
        translateX: [-30, 0],
        duration,
        delay,
        easing: 'easeOutExpo',
      },
      scaleIn: {
        opacity: [0, 1],
        scale: [0.9, 1],
        duration,
        delay,
        easing: 'easeOutBack',
      },
      bounceIn: {
        opacity: [0, 1],
        scale: [0.3, 1],
        duration,
        delay,
        easing: 'easeOutElastic(1, .5)',
      },
    };

    animate(el, animations[animation]);
  }, [options?.animation, options?.duration, options?.delay]);

  return ref;
}

/**
 * Hook to animate numbers counting up
 */
export function useCountUp(options: {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !ref.current) return;
    hasAnimated.current = true;

    const el = ref.current;
    const obj = { value: options.start ?? 0 };

    animate(obj, {
      value: options.end,
      duration: options.duration ?? 2000,
      delay: options.delay ?? 0,
      easing: 'easeOutExpo',
      onUpdate: () => {
        if (el) {
          el.textContent = options.decimals 
            ? obj.value.toFixed(options.decimals)
            : Math.round(obj.value).toString();
        }
      },
    });
  }, [options.end, options.start, options.duration, options.delay, options.decimals]);

  return ref;
}

/**
 * Hook for scroll-triggered stagger animation
 */
export function useScrollStagger(options?: {
  selector?: string;
  staggerDelay?: number;
  threshold?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            const selector = options?.selector || '.stagger-item';
            const elements = containerRef.current?.querySelectorAll(selector);
            
            if (elements && elements.length > 0) {
              animate(elements, {
                opacity: [0, 1],
                translateY: [40, 0],
                scale: [0.95, 1],
                duration: 700,
                delay: stagger(options?.staggerDelay ?? 60, { start: 50 }),
                easing: 'easeOutExpo',
              });
            }
          }
        });
      },
      { threshold: options?.threshold ?? 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [options?.selector, options?.staggerDelay, options?.threshold]);

  return containerRef;
}
