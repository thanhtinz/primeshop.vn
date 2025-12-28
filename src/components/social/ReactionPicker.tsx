import React, { useRef, useEffect, useCallback } from 'react';
import { animate, stagger } from 'animejs';
import { cn } from '@/lib/utils';

export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export const REACTION_EMOJIS: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  like: { emoji: '👍', label: 'Thích', color: 'text-blue-500' },
  love: { emoji: '❤️', label: 'Yêu thích', color: 'text-red-500' },
  care: { emoji: '🥰', label: 'Thương thương', color: 'text-yellow-500' },
  haha: { emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  wow: { emoji: '😮', label: 'Wow', color: 'text-yellow-500' },
  sad: { emoji: '😢', label: 'Buồn', color: 'text-yellow-500' },
  angry: { emoji: '😠', label: 'Phẫn nộ', color: 'text-orange-500' },
};

interface ReactionPickerProps {
  isOpen: boolean;
  onSelect: (type: ReactionType) => void;
  currentReaction?: ReactionType | null;
}

export function ReactionPicker({ isOpen, onSelect, currentReaction }: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Animate container in
      animate(containerRef.current, {
        opacity: [0, 1],
        scale: [0.8, 1],
        translateY: [10, 0],
        duration: 200,
        easing: 'easeOutQuart',
      });
      
      // Stagger animate buttons
      const buttons = buttonsRef.current.filter(Boolean);
      animate(buttons, {
        scale: [0, 1.2, 1],
        opacity: [0, 1],
        delay: stagger(40, { start: 50 }),
        duration: 300,
        easing: 'easeOutBack',
      });
    }
  }, [isOpen]);

  const handleHover = useCallback((index: number, isEntering: boolean) => {
    const button = buttonsRef.current[index];
    if (!button) return;
    
    if (isEntering) {
      animate(button, {
        scale: 1.4,
        translateY: -8,
        duration: 150,
        easing: 'easeOutQuad',
      });
    } else {
      animate(button, {
        scale: 1,
        translateY: 0,
        duration: 150,
        easing: 'easeOutQuad',
      });
    }
  }, []);

  const handleClick = useCallback((type: ReactionType, index: number) => {
    const button = buttonsRef.current[index];
    if (button) {
      animate(button, {
        scale: [1.4, 0.8, 1.2],
        duration: 200,
        easing: 'easeOutQuad',
        complete: () => onSelect(type),
      });
    } else {
      onSelect(type);
    }
  }, [onSelect]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 z-50"
      style={{ opacity: 0 }}
    >
      <div className="flex items-center gap-1 bg-card rounded-full shadow-xl border p-1.5">
        {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type, index) => (
          <button
            key={type}
            ref={(el) => (buttonsRef.current[index] = el)}
            onMouseEnter={() => handleHover(index, true)}
            onMouseLeave={() => handleHover(index, false)}
            onClick={() => handleClick(type, index)}
            className={cn(
              "text-2xl p-1 rounded-full transition-colors hover:bg-muted/50",
              currentReaction === type && "bg-muted"
            )}
            style={{ opacity: 0, transform: 'scale(0)' }}
            title={REACTION_EMOJIS[type].label}
          >
            {REACTION_EMOJIS[type].emoji}
          </button>
        ))}
      </div>
    </div>
  );
}