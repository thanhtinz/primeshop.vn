import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useActiveCombos, SellerCombo } from '@/hooks/useSellerCombos';
import { Package, Percent, ShoppingBag } from 'lucide-react';

interface ShopCombosSectionProps {
  sellerId: string;
  shopSlug: string;
}

export function ShopCombosSection({ sellerId, shopSlug }: ShopCombosSectionProps) {
  const { data: combos = [] } = useActiveCombos(sellerId);
  const { formatPrice } = useCurrency();

  const activeCombos = combos.filter(c => 
    c.is_active && c.items && c.items.length > 1 && 
    c.items.every(item => item.product?.status === 'available')
  );

  if (activeCombos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-semibold">Combo tiết kiệm</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeCombos.map(combo => {
          const totalPrice = combo.items?.reduce((sum, item) => sum + (item.product?.price || 0), 0) || 0;
          const discountedPrice = totalPrice * (1 - combo.discount_percent / 100);
          const savings = totalPrice - discountedPrice;
          
          return (
            <Card key={combo.id} className="overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{combo.name}</h3>
                    {combo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{combo.description}</p>
                    )}
                  </div>
                  <Badge className="bg-purple-500 text-white shrink-0">
                    -{combo.discount_percent}%
                  </Badge>
                </div>
                
                {/* Product thumbnails */}
                <div className="flex -space-x-2 mb-3">
                  {combo.items?.slice(0, 4).map((item, idx) => (
                    <div 
                      key={item.id}
                      className="w-12 h-12 rounded-lg border-2 border-background overflow-hidden bg-muted"
                      style={{ zIndex: 4 - idx }}
                    >
                      {item.product?.images?.[0] ? (
                        <img 
                          src={item.product.images[0]} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {combo.items && combo.items.length > 4 && (
                    <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{combo.items.length - 4}
                    </div>
                  )}
                </div>
                
                {/* Pricing */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground line-through">{formatPrice(totalPrice)}</p>
                    <p className="text-lg font-bold text-purple-600">{formatPrice(discountedPrice)}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Tiết kiệm {formatPrice(savings)}
                  </Badge>
                </div>
                
                {/* Product list */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Bao gồm {combo.items?.length || 0} sản phẩm:</p>
                  <div className="space-y-1">
                    {combo.items?.slice(0, 3).map(item => (
                      <Link 
                        key={item.id}
                        to={`/shops/${shopSlug}/product/${item.product?.id?.split('-')[0]}`}
                        className="text-xs text-foreground hover:text-primary transition-colors line-clamp-1 block"
                      >
                        • {item.product?.title}
                      </Link>
                    ))}
                    {combo.items && combo.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        ... và {combo.items.length - 3} sản phẩm khác
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}