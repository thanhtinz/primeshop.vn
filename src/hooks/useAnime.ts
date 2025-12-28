import { useRef, useCallback, useEffect } from 'react';
import { animate, stagger, type JSAnimation } from 'animejs';

export type AnimeTarget = string | Element | Element[] | NodeList | null;

export interface UseAnimeOptions {
  autoPlay?: boolean;
}

/**
 * Hook to use anime.js animations in React components
 */
export function useAnime() {
  const animationsRef = useRef<JSAnimation[]>([]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      animationsRef.current.forEach(anim => anim.pause());
      animationsRef.current = [];
    };
  }, []);

  const fadeIn = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    delay?: number;
    translateY?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      opacity: [0, 1],
      translateY: [options?.translateY ?? 20, 0],
      duration: options?.duration ?? 600,
      delay: options?.delay ?? 0,
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const fadeOut = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    delay?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      opacity: [1, 0],
      translateY: [0, 20],
      duration: options?.duration ?? 400,
      delay: options?.delay ?? 0,
      ease: 'inExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const scaleIn = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    delay?: number;
    scale?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: [options?.scale ?? 0.8, 1],
      opacity: [0, 1],
      duration: options?.duration ?? 500,
      delay: options?.delay ?? 0,
      ease: 'outBack',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const slideIn = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    delay?: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  }) => {
    if (!target) return null;
    const direction = options?.direction ?? 'up';
    const translateProps: Record<string, [number, number]> = {
      left: { translateX: [-100, 0] },
      right: { translateX: [100, 0] },
      up: { translateY: [50, 0] },
      down: { translateY: [-50, 0] },
    }[direction] as any;

    const anim = animate(target, {
      ...translateProps,
      opacity: [0, 1],
      duration: options?.duration ?? 600,
      delay: options?.delay ?? 0,
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const staggerFadeIn = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    staggerDelay?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: options?.duration ?? 600,
      delay: stagger(options?.staggerDelay ?? 100),
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const pulse = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    scale?: number;
    loop?: boolean;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: [1, options?.scale ?? 1.05, 1],
      duration: options?.duration ?? 800,
      loop: options?.loop ?? true,
      ease: 'inOutSine',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const shake = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    intensity?: number;
  }) => {
    if (!target) return null;
    const intensity = options?.intensity ?? 10;
    const anim = animate(target, {
      translateX: [0, -intensity, intensity, -intensity, intensity, 0],
      duration: options?.duration ?? 500,
      ease: 'inOutSine',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const bounce = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    height?: number;
  }) => {
    if (!target) return null;
    const height = options?.height ?? 20;
    const anim = animate(target, {
      translateY: [0, -height, 0],
      duration: options?.duration ?? 600,
      ease: 'outBounce',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  // Button animations
  const buttonPress = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    scale?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: [1, options?.scale ?? 0.95, 1],
      duration: options?.duration ?? 150,
      ease: 'easeOutQuad',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const buttonHover = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    scale?: number;
    translateY?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: options?.scale ?? 1.02,
      translateY: options?.translateY ?? -2,
      duration: options?.duration ?? 200,
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const buttonLeave = useCallback((target: AnimeTarget, options?: {
    duration?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: 1,
      translateY: 0,
      duration: options?.duration ?? 200,
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const ripple = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    scale?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: [0, options?.scale ?? 2],
      opacity: [0.5, 0],
      duration: options?.duration ?? 600,
      ease: 'outExpo',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const glow = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    intensity?: number;
    loop?: boolean;
  }) => {
    if (!target) return null;
    const intensity = options?.intensity ?? 10;
    const anim = animate(target, {
      boxShadow: [
        `0 0 0px rgba(var(--primary), 0)`,
        `0 0 ${intensity}px rgba(var(--primary), 0.5)`,
        `0 0 0px rgba(var(--primary), 0)`,
      ],
      duration: options?.duration ?? 1500,
      loop: options?.loop ?? true,
      ease: 'inOutSine',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const jelly = useCallback((target: AnimeTarget, options?: {
    duration?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scaleX: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
      scaleY: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
      duration: options?.duration ?? 600,
      ease: 'easeOutElastic',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const pop = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    scale?: number;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      scale: [1, options?.scale ?? 1.2, 1],
      duration: options?.duration ?? 300,
      ease: 'outBack',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const rotate = useCallback((target: AnimeTarget, options?: { 
    duration?: number; 
    degrees?: number;
    loop?: boolean;
  }) => {
    if (!target) return null;
    const anim = animate(target, {
      rotate: [0, options?.degrees ?? 360],
      duration: options?.duration ?? 1000,
      loop: options?.loop ?? false,
      ease: 'linear',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const flip = useCallback((target: AnimeTarget, options?: { 
    duration?: number;
    axis?: 'x' | 'y';
  }) => {
    if (!target) return null;
    const axis = options?.axis ?? 'y';
    const anim = animate(target, {
      [axis === 'x' ? 'rotateX' : 'rotateY']: [0, 180],
      duration: options?.duration ?? 600,
      ease: 'inOutSine',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  const typewriter = useCallback((target: AnimeTarget, options?: {
    duration?: number;
    text?: string;
  }) => {
    if (!target) return null;
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element || !(element instanceof Element)) return null;
    
    const text = options?.text ?? (element as HTMLElement).textContent ?? '';
    const chars = text.split('');
    (element as HTMLElement).textContent = '';
    
    chars.forEach(char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      element.appendChild(span);
    });

    const anim = animate(element.querySelectorAll('span'), {
      opacity: [0, 1],
      duration: 50,
      delay: stagger(options?.duration ? options.duration / chars.length : 50),
      ease: 'linear',
    });
    animationsRef.current.push(anim);
    return anim;
  }, []);

  // Custom animation
  const custom = useCallback((target: AnimeTarget, params: Parameters<typeof animate>[1]) => {
    if (!target) return null;
    const anim = animate(target, params);
    animationsRef.current.push(anim);
    return anim;
  }, []);

  return {
    fadeIn,
    fadeOut,
    scaleIn,
    slideIn,
    staggerFadeIn,
    pulse,
    shake,
    bounce,
    rotate,
    flip,
    typewriter,
    custom,
    // Button animations
    buttonPress,
    buttonHover,
    buttonLeave,
    ripple,
    glow,
    jelly,
    pop,
    stagger,
  };
}

export { animate, stagger };
