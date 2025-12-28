import { useState, useCallback, ReactNode } from 'react';
import { CartAnimation, CartAnimationContext } from './CartAnimation';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export const CartAnimationProvider = ({ children }: { children: ReactNode }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const { playNotificationSound } = useNotificationSound();

  const triggerAnimation = useCallback(() => {
    setShowAnimation(true);
    playNotificationSound();
  }, [playNotificationSound]);

  const handleComplete = useCallback(() => {
    setShowAnimation(false);
  }, []);

  return (
    <CartAnimationContext.Provider value={{ triggerAnimation }}>
      {children}
      <CartAnimation show={showAnimation} onComplete={handleComplete} />
    </CartAnimationContext.Provider>
  );
};
