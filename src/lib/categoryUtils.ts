import { DbCategory } from '@/hooks/useCategories';

/**
 * Get category name based on current language
 * Falls back to Vietnamese name if English name is not available
 */
export const getCategoryDisplayName = (
  category: DbCategory | { name: string; name_en?: string | null },
  language: string
): string => {
  if (language === 'en' && category.name_en) {
    return category.name_en;
  }
  return category.name;
};
