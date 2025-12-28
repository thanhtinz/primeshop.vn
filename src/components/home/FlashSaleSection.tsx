import { Link } from 'react-router-dom';
import { useActiveFlashSale, useFlashSaleItems } from '@/hooks/useFlashSales';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function FlashSaleSection() {
  const { t } = useLanguage();
  const { data: flashSale } = useActiveFlashSale();
  const { data: items, isLoading } = useFlashSaleItems(flashSale?.id);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!flashSale?.end_date) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(flashSale.end_date).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale?.end_date]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (!flashSale || isLoading) return null;
  if (!items || items.length === 0) return null;

  // Only show first 4 items on homepage
  const displayItems = items.slice(0, 4);

  return (
    <section className="py-6 md:py-10">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-xl font-bold">Flash Sale</h2>
                <Badge variant="destructive" className="text-[10px] md:text-xs animate-pulse">
                  HOT
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <span>{t('endsIn')}:</span>
                <span className="font-mono font-bold text-red-500">
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
          <Link to="/flash-sale" className="flex items-center gap-1 text-xs md:text-sm text-red-500 hover:underline">
            {t('viewAll')} <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {displayItems.map((item) => {
            const soldPercent = item.quantity_limit 
              ? Math.min((item.quantity_sold / item.quantity_limit) * 100, 100)
              : 0;
            const isSoldOut = item.quantity_limit !== null && item.quantity_sold >= item.quantity_limit;
            const remaining = item.quantity_limit ? item.quantity_limit - item.quantity_sold : null;

            return (
              <Link 
                key={item.id} 
                to={`/product/${item.product?.slug}`}
                className={cn("group", isSoldOut && "pointer-events-none")}
              >
                <Card className={cn(
                  "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-red-200 dark:border-red-900/50",
                  !isSoldOut && "animate-flash-sale-glow",
                  isSoldOut && "opacity-60"
                )}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.package?.image_url || item.product?.image_url || '/placeholder.svg'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Discount Badge */}
                    <Badge 
                      className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-red-500 text-white font-bold text-xs md:text-sm px-1.5 md:px-2"
                    >
                      -{item.discount_percent}%
                    </Badge>

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-sm md:text-base">{t('soldOut').toUpperCase()}</span>
                      </div>
                    )}

                    {/* Flash Icon */}
                    <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-yellow-400 text-yellow-900 p-1 md:p-1.5 rounded-full">
                      <Flame className="h-3 w-3 md:h-4 md:w-4" />
                    </div>
                  </div>

                  <CardContent className="p-2 md:p-3">
                    <h3 className="font-medium text-xs md:text-sm line-clamp-1 mb-1">
                      {item.product?.name}
                    </h3>
                    {item.package && (
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 mb-1.5">
                        {item.package.name}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-red-500 font-bold text-sm md:text-base">
                          {formatPrice(item.sale_price)}
                        </span>
                        <span className="text-muted-foreground line-through text-[10px] md:text-xs">
                          {formatPrice(item.original_price)}
                        </span>
                      </div>

                      {/* Stock Progress Bar */}
                      {item.quantity_limit && (
                        <div className="space-y-0.5">
                          <div className="relative h-2 md:h-2.5 rounded-full bg-red-100 dark:bg-red-900/30 overflow-hidden">
                            <div 
                              className={cn(
                                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                                soldPercent >= 80 ? "bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" : "bg-gradient-to-r from-red-400 to-orange-400"
                              )}
                              style={{ width: `${soldPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] md:text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5 text-red-500" />
                              {t('sold')} {item.quantity_sold}
                            </span>
                            {remaining !== null && remaining <= 5 && remaining > 0 && (
                              <span className="text-red-500 font-semibold animate-pulse">
                                {t('remaining')} {remaining}!
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        {items.length > 4 && (
          <div className="mt-4 text-center">
            <Link to="/flash-sale">
              <Button variant="outline" className="border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                {t('viewAll')} {items.length} {t('products').toLowerCase()}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
