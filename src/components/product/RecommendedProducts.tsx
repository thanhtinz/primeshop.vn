import { Link } from 'react-router-dom';
import { ProductWithRelations, useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { GameAccountCard } from './GameAccountCard';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecommendedProductsProps {
  currentProductId: string;
  categoryId?: string | null;
  style?: 'premium' | 'game_account' | 'game_topup';
  limit?: number;
}

export function RecommendedProducts({ 
  currentProductId, 
  categoryId, 
  style = 'premium',
  limit = 4 
}: RecommendedProductsProps) {
  const { data: products } = useProducts();
  const { t } = useLanguage();

  // Filter products: same category AND same style, exclude current product
  const sameCategoryProducts = products
    ?.filter(p => 
      p.id !== currentProductId && 
      (p.style || 'premium') === style &&
      categoryId && p.category_id === categoryId
    )
    .slice(0, limit) || [];

  // If not enough from same category, fill with other products of same style only
  const recommendedProducts = [...sameCategoryProducts];
  if (recommendedProducts.length < limit) {
    const sameStyleProducts = products
      ?.filter(p => 
        p.id !== currentProductId && 
        (p.style || 'premium') === style &&
        !recommendedProducts.find(rp => rp.id === p.id)
      )
      .slice(0, limit - recommendedProducts.length) || [];
    recommendedProducts.push(...sameStyleProducts);
  }

  if (recommendedProducts.length === 0) return null;

  return (
    <div className="bg-background mt-2 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{t('recommendedProducts')}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {recommendedProducts.map((product) => (
          (product.style || 'premium') === 'game_account' ? (
            <GameAccountCard key={product.id} product={product} />
          ) : (
            <ProductCard key={product.id} product={product} />
          )
        ))}
      </div>
    </div>
  );
}