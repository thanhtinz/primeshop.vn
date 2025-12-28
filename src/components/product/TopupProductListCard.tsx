import * as React from 'react';
import { Link } from 'react-router-dom';
import { Star, Truck, Zap, Package } from 'lucide-react';
import { useProductRatingStats } from '@/hooks/useReviews';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TopupProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    tags?: string[];
    images?: { id: string; image_url: string; is_primary: boolean; sort_order: number }[];
  };
  priceRange?: { min: number; max: number };
}

// Hook to get sold count for a product
const useProductSoldCount = (productId: string) => {
  return useQuery({
    queryKey: ['product-sold-count', productId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['DELIVERED', 'COMPLETED'])
        .contains('product_snapshot', { product: { id: productId } });
      
      if (error) return 0;
      return count || 0;
    },
  });
};

export const TopupProductCard = React.forwardRef<HTMLAnchorElement, TopupProductCardProps>(
  ({ product, priceRange }, ref) => {
    const { formatPrice } = useCurrency();
    const { data: ratingStats } = useProductRatingStats(product.id);
    const { data: soldCount = 0 } = useProductSoldCount(product.id);

    const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
      || product.images?.[0]?.image_url 
      || product.image_url;

    const rating = Math.round(ratingStats?.average || 0);
    const reviewCount = ratingStats?.count || 0;

    const formatSoldCount = (count: number) => {
      if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
      return count.toString();
    };

    const hasGiaoNhanh = product.tags?.includes('giao_nhanh');
    const hasDatHang = product.tags?.includes('dat_hang');

    return (
      <Link
        ref={ref}
        to={`/product/${product.slug}`}
        className="flex gap-3 md:gap-4 p-2.5 md:p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg active:scale-[0.99] group"
      >
        {/* Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-yellow-500/20">
              <span className="text-xl md:text-2xl">🎮</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
          <div>
            <h3 className="font-semibold text-xs sm:text-sm md:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            
            {priceRange && (
              <p className="text-primary font-medium text-xs md:text-sm mt-0.5 md:mt-1">
                {formatPrice(priceRange.min)} ~ {formatPrice(priceRange.max)}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5">
              {hasGiaoNhanh && (
                <span className="inline-flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full">
                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span className="hidden sm:inline">Giao hàng ngay lập tức</span>
                  <span className="sm:hidden">Giao ngay</span>
                </span>
              )}
              {hasDatHang && (
                <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-blue-500">
                  <Package className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>Đặt hàng</span>
                </span>
              )}
              {!hasGiaoNhanh && !hasDatHang && (
                <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-emerald-500">
                  <Truck className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>Order</span>
                </span>
              )}
            </div>
          </div>

          {/* Rating & Sold */}
          <div className="flex items-center justify-between mt-1.5 md:mt-2">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
                  />
                ))}
              </div>
              {reviewCount > 0 && (
                <span className="text-[10px] md:text-xs text-muted-foreground">({reviewCount})</span>
              )}
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground">
              Đã bán {formatSoldCount(soldCount)}
            </span>
          </div>
        </div>
      </Link>
    );
  }
);

TopupProductCard.displayName = 'TopupProductCard';
