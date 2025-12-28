import { useEffect, useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartAnimationProps {
  show: boolean;
  onComplete: () => void;
}

export const CartAnimation = ({ show, onComplete }: CartAnimationProps) => {
  const [phase, setPhase] = useState<'flying' | 'success' | 'hidden'>('hidden');

  useEffect(() => {
    if (show) {
      setPhase('flying');
      const successTimer = setTimeout(() => setPhase('success'), 400);
      const hideTimer = setTimeout(() => {
        setPhase('hidden');
        onComplete();
      }, 1200);
      return () => {
        clearTimeout(successTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Flying cart icon */}
      <div
        className={cn(
          "absolute transition-all duration-400 ease-out",
          phase === 'flying' && "animate-[flyToCart_0.4s_ease-out_forwards]",
        )}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
          phase === 'flying' ? "bg-primary" : "bg-green-500",
          "transition-colors duration-200"
        )}>
          {phase === 'flying' ? (
            <ShoppingCart className="w-6 h-6 text-primary-foreground animate-bounce" />
          ) : (
            <Check className="w-6 h-6 text-white animate-scale-in" />
          )}
        </div>
      </div>

      {/* Success message */}
      {phase === 'success' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 animate-fade-in">
          <div className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            Đã thêm vào giỏ hàng!
          </div>
        </div>
      )}
    </div>
  );
};

// Hook to trigger cart animation
import { createContext, useContext, useCallback } from 'react';

interface CartAnimationContextType {
  triggerAnimation: () => void;
}

const CartAnimationContext = createContext<CartAnimationContextType | null>(null);

export const useCartAnimation = () => {
  const context = useContext(CartAnimationContext);
  if (!context) {
    // Return no-op if not wrapped in provider
    return { triggerAnimation: () => {} };
  }
  return context;
};

export { CartAnimationContext };
