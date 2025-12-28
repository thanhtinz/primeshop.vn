import { ReactNode, forwardRef, useCallback } from 'react';
import { useTilt3D } from '@/hooks/useTilt3D';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glareEnable?: boolean;
  disabled?: boolean;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(({
  children,
  className,
  maxTilt = 8,
  scale = 1.02,
  glareEnable = true,
  disabled = false,
}, ref) => {
  const { elementRef, glareRef, handlers } = useTilt3D({
    maxTilt: disabled ? 0 : maxTilt,
    scale: disabled ? 1 : scale,
    glareEnable: disabled ? false : glareEnable,
  });

  // Prevent tilt effect from blocking clicks
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Allow click to propagate naturally
    // Don't prevent default or stop propagation
  }, []);

  return (
    <div
      ref={(node) => {
        // Handle both refs
        (elementRef as any).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      {...(disabled ? {} : handlers)}
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {glareEnable && !disabled && (
        <div
          ref={glareRef}
          className="absolute inset-0 pointer-events-none rounded-inherit"
          style={{ borderRadius: 'inherit' }}
        />
      )}
    </div>
  );
});

TiltCard.displayName = 'TiltCard';
