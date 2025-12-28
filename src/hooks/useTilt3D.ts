import { useRef, useCallback } from 'react';

interface UseTilt3DOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glareEnable?: boolean;
  glareMaxOpacity?: number;
}

export const useTilt3D = (options: UseTilt3DOptions = {}) => {
  const {
    maxTilt = 5,
    perspective = 1000,
    scale = 1.01,
    speed = 300,
    glareEnable = false,
    glareMaxOpacity = 0.1,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    element.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;

    // Glare effect
    if (glareEnable && glareRef.current) {
      const glareAngle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
      const glareOpacity = Math.min(
        Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / Math.max(centerX, centerY) * glareMaxOpacity,
        glareMaxOpacity
      );
      glareRef.current.style.background = `linear-gradient(${glareAngle}deg, rgba(255,255,255,${glareOpacity}) 0%, rgba(255,255,255,0) 80%)`;
    }
  }, [maxTilt, perspective, scale, speed, glareEnable, glareMaxOpacity]);

  const handleMouseLeave = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    
    if (glareRef.current) {
      glareRef.current.style.background = 'transparent';
    }
  }, [perspective]);

  return {
    elementRef,
    glareRef,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
};
