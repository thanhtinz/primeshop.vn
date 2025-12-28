import { useRef, useCallback, forwardRef, ReactNode, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { cn } from '@/lib/utils';

interface AnimeCardProps {
  children: ReactNode;
  className?: string;
  animation?: 'pop' | 'glow' | 'shake' | 'jelly' | 'pulse' | 'bounce' | 'tilt' | 'float' | 'magnetic';
  delay?: number;
  enterAnimation?: boolean;
}

export const AnimeCard = forwardRef<HTMLDivElement, AnimeCardProps>(
  ({ children, className, animation = 'pop', delay = 0, enterAnimation = false }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement) => {
      cardRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    // Entry animation on mount
    useEffect(() => {
      if (enterAnimation && cardRef.current) {
        animate(cardRef.current, {
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.95, 1],
          duration: 600,
          delay: delay,
          easing: 'easeOutQuart',
        });
      }
    }, [enterAnimation, delay]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      switch (animation) {
        case 'pop':
          animate(cardRef.current, {
            scale: [1, 1.04],
            boxShadow: ['0 4px 6px rgba(0,0,0,0.1)', '0 20px 40px rgba(var(--primary-rgb, 59,130,246),0.2)'],
            duration: 300,
            easing: 'easeOutCubic',
          });
          break;
        case 'glow':
          animate(cardRef.current, {
            boxShadow: ['0 0 0 rgba(var(--primary-rgb, 59,130,246),0)', '0 0 30px rgba(var(--primary-rgb, 59,130,246),0.5), 0 0 60px rgba(var(--primary-rgb, 59,130,246),0.2)'],
            duration: 400,
            easing: 'easeOutQuad',
          });
          break;
        case 'shake':
          animate(cardRef.current, {
            translateX: [0, -4, 4, -4, 4, 0],
            duration: 400,
            easing: 'easeInOutSine',
          });
          break;
        case 'jelly':
          animate(cardRef.current, {
            scaleX: [1, 1.08, 0.92, 1.04, 1],
            scaleY: [1, 0.92, 1.08, 0.96, 1],
            duration: 500,
            easing: 'easeOutElastic(1, .4)',
          });
          break;
        case 'pulse':
          animate(cardRef.current, {
            scale: [1, 1.03, 0.98, 1.02, 1],
            boxShadow: ['0 4px 6px rgba(0,0,0,0.1)', '0 8px 20px rgba(var(--primary-rgb, 59,130,246),0.15)'],
            duration: 400,
            easing: 'easeInOutQuad',
          });
          break;
        case 'bounce':
          animate(cardRef.current, {
            translateY: [0, -12, 0, -6, 0],
            duration: 500,
            easing: 'easeOutBounce',
          });
          break;
        case 'tilt':
          const rotateX = (y / rect.height) * -10;
          const rotateY = (x / rect.width) * 10;
          animate(cardRef.current, {
            rotateX: rotateX,
            rotateY: rotateY,
            scale: 1.02,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            duration: 300,
            easing: 'easeOutQuad',
          });
          break;
        case 'float':
          animate(cardRef.current, {
            translateY: -8,
            boxShadow: ['0 4px 6px rgba(0,0,0,0.1)', '0 25px 50px rgba(0,0,0,0.15)'],
            duration: 400,
            easing: 'easeOutCubic',
          });
          break;
        case 'magnetic':
          animate(cardRef.current, {
            translateX: x * 0.1,
            translateY: y * 0.1,
            scale: 1.02,
            duration: 200,
            easing: 'easeOutQuad',
          });
          break;
      }
    }, [animation]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || (animation !== 'tilt' && animation !== 'magnetic')) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      if (animation === 'tilt') {
        const rotateX = (y / rect.height) * -10;
        const rotateY = (x / rect.width) * 10;
        animate(cardRef.current, {
          rotateX: rotateX,
          rotateY: rotateY,
          duration: 100,
          easing: 'linear',
        });
      } else if (animation === 'magnetic') {
        animate(cardRef.current, {
          translateX: x * 0.15,
          translateY: y * 0.15,
          duration: 100,
          easing: 'linear',
        });
      }
    }, [animation]);

    const handleMouseLeave = useCallback(() => {
      if (!cardRef.current) return;
      
      animate(cardRef.current, {
        scale: 1,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        translateY: 0,
        translateX: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 300,
        easing: 'easeOutCubic',
      });
    }, []);

    return (
      <div
        ref={combinedRef}
        className={cn('transition-colors will-change-transform cursor-pointer', className)}
        style={{ 
          transformStyle: 'preserve-3d',
          opacity: enterAnimation ? 0 : 1,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    );
  }
);

AnimeCard.displayName = 'AnimeCard';

// Stagger animation for lists
export function useStaggerAnimation(containerRef: React.RefObject<HTMLElement>, selector: string = '.anime-stagger-item') {
  useEffect(() => {
    if (!containerRef.current) return;
    
    const items = containerRef.current.querySelectorAll(selector);
    if (items.length === 0) return;
    
    animate(items, {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.9, 1],
      delay: stagger(80, { start: 100 }),
      duration: 600,
      easing: 'easeOutQuart',
    });
  }, [containerRef, selector]);
}

// Number counter animation
export function useCounterAnimation(
  ref: React.RefObject<HTMLElement>,
  endValue: number,
  options?: { duration?: number; decimals?: number; delay?: number }
) {
  useEffect(() => {
    if (!ref.current) return;
    
    const { duration = 2000, decimals = 0, delay = 0 } = options || {};
    const element = ref.current;
    
    setTimeout(() => {
      const obj = { value: 0 };
      animate(obj, {
        value: endValue,
        duration: duration,
        easing: 'easeOutExpo',
        update: () => {
          element.textContent = obj.value.toFixed(decimals);
        }
      });
    }, delay);
  }, [ref, endValue, options]);
}

// Scroll reveal animation hook
export function useScrollReveal(options?: { threshold?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const { threshold = 0.1, delay = 0 } = options || {};
    const element = ref.current;
    
    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(element, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              delay: delay,
              easing: 'easeOutQuart',
            });
            observer.unobserve(element);
          }
        });
      },
      { threshold }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [options]);
  
  return ref;
}

// Button ripple effect
export function createRippleEffect(e: React.MouseEvent<HTMLButtonElement>) {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    pointer-events: none;
    width: 0;
    height: 0;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%);
  `;
  
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);
  
  animate(ripple, {
    width: [0, rect.width * 2.5],
    height: [0, rect.width * 2.5],
    opacity: [0.6, 0],
    duration: 600,
    easing: 'easeOutQuad',
    complete: () => ripple.remove(),
  });
}

// Text reveal animation
export function useTextReveal(ref: React.RefObject<HTMLElement>, options?: { delay?: number }) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const text = element.textContent || '';
    element.innerHTML = '';
    
    // Wrap each character in a span
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      element.appendChild(span);
    });
    
    const chars = element.querySelectorAll('span');
    
    animate(chars, {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(30, { start: options?.delay || 0 }),
      duration: 400,
      easing: 'easeOutQuad',
    });
  }, [ref, options]);
}
