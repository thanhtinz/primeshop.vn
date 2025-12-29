import { useState, useEffect, forwardRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BackToTop = forwardRef<HTMLButtonElement, {}>((props, ref) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0 || !isFinite(docHeight)) {
      setScrollProgress(0);
      setIsVisible(false);
      return;
    }

    const progress = (scrollTop / docHeight) * 100;
    const safeProgress = Math.max(0, Math.min(100, isFinite(progress) ? progress : 0));
    
    setScrollProgress(safeProgress);
    setIsVisible(scrollTop > 100);
  }, []);

  useEffect(() => {
    // Throttle scroll handler for performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateProgress();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [calculateProgress]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Circle SVG parameters
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeOffset = isFinite(scrollProgress) ? scrollProgress : 0;
  const strokeDashoffset = circumference - (safeOffset / 100) * circumference;
  const isComplete = scrollProgress >= 99;

  if (!isVisible) return null;

  return (
    <button
      ref={ref}
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-12 w-12 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'bg-card/90 backdrop-blur-sm shadow-lg border border-border',
        'hover:scale-110 active:scale-95 cursor-pointer'
      )}
      aria-label="Back to top"
      {...props}
    >
      {/* Progress circle */}
      <svg
        className={cn(
          'absolute inset-0 -rotate-90 transition-opacity duration-300',
          isComplete ? 'opacity-0' : 'opacity-100'
        )}
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isFinite(strokeDashoffset) ? strokeDashoffset : circumference}
          className="text-primary transition-all duration-150 ease-out"
        />
      </svg>

      {/* Arrow icon */}
      <ArrowUp 
        className={cn(
          'h-5 w-5 transition-all duration-300 text-foreground',
          isComplete 
            ? 'opacity-100 scale-100' 
            : 'opacity-70 scale-90'
        )} 
      />
    </button>
  );
});

BackToTop.displayName = 'BackToTop';
