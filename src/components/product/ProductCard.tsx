import { Link } from 'react-router-dom';
import { ProductWithRelations } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  // Get primary image from images array or fallback to image_url
  const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
    || product.images?.[0]?.image_url 
    || product.image_url;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/50">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <Sparkles className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          {product.is_featured && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-semibold">
              HOT
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        {product.category && (
          <span className="text-[10px] font-medium text-primary uppercase tracking-wide mb-1">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {product.short_description}
          </p>
        )}
      </div>
    </Link>
  );
}
