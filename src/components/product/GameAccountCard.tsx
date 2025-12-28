import { Link, useNavigate } from 'react-router-dom';
import { ProductWithRelations } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Clock, Coins, Store, LogIn, Pin, Package, BadgeCheck } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Seller, SellerProduct } from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerBadge } from '@/components/ui/partner-badge';

interface GameAccountCardProps {
  product: ProductWithRelations;
  // For marketplace products
  seller?: Seller | null;
  isMarketplace?: boolean;
  marketplaceProductId?: string;
  marketplaceCategory?: string;
  isBoosted?: boolean;
  // Flash sale info
  flashSale?: {
    discountPercent: number;
    originalPrice: number;
    salePrice: number;
  } | null;
  // Combo info
  inCombo?: boolean;
  comboDiscount?: number;
}

export function GameAccountCard({ product, seller, isMarketplace, marketplaceProductId, marketplaceCategory, isBoosted, flashSale, inCombo, comboDiscount }: GameAccountCardProps) {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatRelative } = useDateFormat();
  const primaryImage = product.images?.find(img => img.is_primary)?.image_url
    || product.images?.[0]?.image_url 
    || product.image_url;

  const accountInfo = product.account_info as Record<string, unknown> | unknown[] | null;

  // Helper function to safely render values
  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  // Helper to render account info properly (handles both array and object formats)
  const renderAccountInfo = () => {
    if (!accountInfo) return null;
    
    // Handle array format: [{name: "Rank", value: "Diamond"}, ...]
    if (Array.isArray(accountInfo)) {
      return accountInfo.map((item: any, idx) => {
        if (typeof item === 'object' && item?.name && item?.value !== undefined) {
          return (
            <div key={idx} className="flex justify-between">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium text-foreground">{String(item.value)}</span>
            </div>
          );
        }
        return null;
      });
    }
    
    // Handle object format with nested {name, value} or simple key-value
    return Object.entries(accountInfo).map(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'name' in (value as object) && 'value' in (value as object)) {
        const nested = value as { name: string; value: unknown };
        return (
          <div key={key} className="flex justify-between">
            <span className="text-muted-foreground">{nested.name}</span>
            <span className="font-medium text-foreground">{renderValue(nested.value)}</span>
          </div>
        );
      }
      // Simple key-value structure
      return (
        <div key={key} className="flex justify-between">
          <span className="text-muted-foreground">{key}</span>
          <span className="font-medium text-foreground">{renderValue(value)}</span>
        </div>
      );
    });
  };

  // Determine the link destination
  const linkTo = isMarketplace && marketplaceProductId && seller?.shop_slug
    ? `/shops/${seller.shop_slug}/product/${marketplaceCategory ? `${marketplaceCategory}_` : ''}${marketplaceProductId.split('-')[0]}` 
    : `/product/${product.slug}`;

  return (
    <Link
      to={linkTo}
      className="group block rounded-xl bg-card border border-border overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* Header with ID and badges */}
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden bg-secondary/50">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <span className="text-muted-foreground/50 text-4xl font-bold">?</span>
            </div>
          )}
        </div>
        {/* Product ID Badge */}
        <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs px-2 py-1 font-mono">
          #{isMarketplace && marketplaceProductId ? marketplaceProductId.slice(0, 6).toUpperCase() : product.slug.toUpperCase()}
        </Badge>
        {isBoosted && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] gap-1">
            <Pin className="h-3 w-3" />
            TOP
          </Badge>
        )}
        {product.is_featured && !isBoosted && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
            HOT
          </Badge>
        )}
        {flashSale && (
          <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px]">
            -{flashSale.discountPercent}%
          </Badge>
        )}
        {inCombo && !flashSale && (
          <Badge className="absolute bottom-2 left-2 bg-purple-500 text-white text-[10px] gap-0.5">
            <Package className="h-3 w-3" />
            Combo {comboDiscount ? `-${comboDiscount}%` : ''}
          </Badge>
        )}
        {isMarketplace && (
          <Badge className="absolute bottom-2 right-2 bg-amber-500 text-white text-[10px]">
            Chợ
          </Badge>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2">
        {/* Shop info for marketplace products */}
        {isMarketplace && seller && (
          <div 
            className="flex items-center gap-2 p-2 -mx-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/shops/${seller.shop_slug}`);
            }}
          >
            {seller.shop_avatar_url ? (
              <img 
                src={seller.shop_avatar_url} 
                alt={seller.shop_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-3 w-3 text-primary" />
              </div>
            )}
            <span className="text-xs font-medium text-foreground truncate flex-1 flex items-center gap-1">
              {seller.shop_name}
              {seller.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />
              )}
              {seller.is_partner && (
                <PartnerBadge size="sm" className="shrink-0" />
              )}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Xem shop →
            </span>
          </div>
        )}

        {/* Time info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelative(product.created_at)}</span>
          </div>
        </div>

        {/* Account details table */}
        {accountInfo && (Array.isArray(accountInfo) ? accountInfo.length > 0 : Object.keys(accountInfo).length > 0) && (
          <div className="space-y-1 text-xs">
            {renderAccountInfo()}
          </div>
        )}

        {/* Price / Login prompt */}
        <div className="pt-2 border-t border-border">
          {user ? (
            flashSale ? (
              <div className="flex flex-col items-center gap-0.5 bg-red-500/10 rounded-lg py-2">
                <span className="text-xs text-muted-foreground line-through">{formatPrice(flashSale.originalPrice)}</span>
                <div className="flex items-center gap-1.5 text-red-500">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold">{formatPrice(flashSale.salePrice)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 bg-foreground text-background rounded-lg py-2">
                <Coins className="h-4 w-4" />
                <span className="font-bold">
                  {product.price ? formatPrice(product.price) : 'Liên hệ'}
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center gap-1.5 bg-muted text-muted-foreground rounded-lg py-2">
              <LogIn className="h-4 w-4" />
              <span className="font-medium text-sm">Đăng nhập để xem giá</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
