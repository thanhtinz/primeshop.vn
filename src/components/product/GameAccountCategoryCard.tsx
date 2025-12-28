import * as React from 'react';
import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DbCategory } from '@/hooks/useCategories';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { animate } from 'animejs';
import { cn } from '@/lib/utils';

interface GameAccountCategoryCardProps {
  category: DbCategory;
  productCount: number;
  colorIndex?: number;
}

// Soft pastel colors for category backgrounds
const CATEGORY_COLORS = [
  'bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50',
  'bg-pink-50 border-pink-100 dark:bg-pink-950/30 dark:border-pink-900/50',
  'bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/50',
  'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900/50',
  'bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50',
  'bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50',
  'bg-cyan-50 border-cyan-100 dark:bg-cyan-950/30 dark:border-cyan-900/50',
  'bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50',
];

const TEXT_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-pink-600 dark:text-pink-400',
  'text-green-600 dark:text-green-400',
  'text-yellow-600 dark:text-yellow-400',
  'text-purple-600 dark:text-purple-400',
  'text-orange-600 dark:text-orange-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-rose-600 dark:text-rose-400',
];

export const GameAccountCategoryCard = React.forwardRef<
  HTMLAnchorElement,
  GameAccountCategoryCardProps
>(({ category, productCount, colorIndex = 0 }, ref) => {
  const { t, language } = useLanguage();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const combinedRef = (ref as React.RefObject<HTMLAnchorElement>) || cardRef;
  
  const bgColor = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
  const textColor = TEXT_COLORS[colorIndex % TEXT_COLORS.length];

  const handleMouseEnter = useCallback(() => {
    const card = combinedRef.current;
    const image = imageRef.current;
    const arrow = arrowRef.current;

    if (card) {
      animate(card, {
        scale: 1.03,
        translateY: -4,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }

    if (image) {
      animate(image, {
        scale: 1.1,
        rotate: [0, 5, -5, 0],
        duration: 400,
        easing: 'easeOutElastic(1, .6)',
      });
    }

    if (arrow) {
      animate(arrow, {
        translateX: [0, 4],
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
  }, [combinedRef]);

  const handleMouseLeave = useCallback(() => {
    const card = combinedRef.current;
    const image = imageRef.current;
    const arrow = arrowRef.current;

    if (card) {
      animate(card, {
        scale: 1,
        translateY: 0,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }

    if (image) {
      animate(image, {
        scale: 1,
        rotate: 0,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }

    if (arrow) {
      animate(arrow, {
        translateX: 0,
        duration: 300,
        easing: 'easeOutExpo',
      });
    }
  }, [combinedRef]);

  return (
    <Link
      ref={combinedRef}
      to={`/category/${category.slug}`}
      className={cn(
        'group flex flex-col items-center p-3 md:p-4 rounded-xl border transition-shadow will-change-transform',
        bgColor
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Category Image */}
      {category.image_url ? (
        <img
          ref={imageRef}
          src={category.image_url}
          alt={category.name}
          className="w-12 h-12 md:w-16 md:h-16 object-contain mb-1.5 md:mb-2 will-change-transform"
        />
      ) : (
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-background/50 flex items-center justify-center mb-1.5 md:mb-2">
          <span className="text-xl md:text-2xl">🎮</span>
        </div>
      )}

      {/* Category Name */}
      <h3 className={cn('font-semibold text-xs md:text-sm text-center line-clamp-2', textColor)}>
        {language === 'en' && category.name_en ? category.name_en : category.name}
      </h3>

      {/* Product Count */}
      <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
        {t('available')}: <span className="font-semibold text-foreground">{productCount}</span>
      </p>

      {/* View All Link */}
      <div 
        ref={arrowRef}
        className="flex items-center gap-1 mt-1.5 md:mt-2 text-[10px] md:text-xs text-muted-foreground group-hover:text-foreground transition-colors will-change-transform"
      >
        <span>{t('viewAll')}</span>
        <ArrowRight className="h-2.5 w-2.5 md:h-3 md:w-3" />
      </div>
    </Link>
  );
});

GameAccountCategoryCard.displayName = 'GameAccountCategoryCard';
