import { useOutletContext, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWishlist, useRemoveFromWishlist, useToggleWishlistNotification } from '@/hooks/useWishlist';
import { Heart, Loader2, Trash2, Bell, BellOff } from 'lucide-react';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsWishlistPage() {
  const { t } = useOutletContext<SettingsContext>();
  const { formatPrice } = useCurrency();
  const { data: wishlist, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const toggleNotification = useToggleWishlistNotification();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          {t('myWishlist')}
        </CardTitle>
        <CardDescription>{t('wishlistDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <div className="space-y-3">
            {wishlist.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <Link to={`/product/${item.product?.slug}`} className="shrink-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product?.slug}`}>
                    <h4 className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                      {item.product?.name}
                    </h4>
                  </Link>
                  {item.product?.price && (
                    <p className="text-primary font-semibold text-sm mt-0.5">
                      {formatPrice(item.product.price)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      id={`notify-${item.id}`}
                      checked={item.notify_on_sale}
                      onCheckedChange={(checked) =>
                        toggleNotification.mutate({
                          productId: item.product_id,
                          notifyOnSale: checked,
                        })
                      }
                      disabled={toggleNotification.isPending}
                    />
                    <Label htmlFor={`notify-${item.id}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                      {item.notify_on_sale ? (
                        <>
                          <Bell className="w-3 h-3" />
                          {t('notifyOnDiscount')}
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3 h-3" />
                          {t('turnOffNotifications')}
                        </>
                      )}
                    </Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => removeFromWishlist.mutate(item.product_id)}
                  disabled={removeFromWishlist.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">{t('noWishlistYet')}</p>
            <Link to="/products">
              <Button variant="outline" size="sm" className="mt-3">
                {t('exploreProducts')}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
