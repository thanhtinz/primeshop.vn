import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useActiveFlashSale, useFlashSaleItems } from '@/hooks/useFlashSales';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Clock, ShoppingCart, Flame, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const FlashSalePage = () => {
  const { data: flashSale, isLoading: loadingSale } = useActiveFlashSale();
  const { data: items, isLoading: loadingItems } = useFlashSaleItems(flashSale?.id);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!flashSale?.end_date) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(flashSale.end_date).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
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

  const isLoading = loadingSale || loadingItems;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-background dark:from-red-950/20">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-red-600 to-orange-500 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>

          <div className="container mx-auto px-4 py-8 sm:py-12 relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-2 animate-pulse">
                <Zap className="h-8 w-8 sm:h-10 sm:w-10" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">FLASH SALE</h1>
                <Zap className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              
              {flashSale && (
                <>
                  <p className="text-lg sm:text-xl opacity-90">{flashSale.name}</p>
                  {flashSale.description && (
                    <p className="text-sm sm:text-base opacity-75 max-w-2xl">{flashSale.description}</p>
                  )}
                </>
              )}

              {/* Countdown Timer */}
              {flashSale && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm sm:text-base font-medium">Kết thúc sau:</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4">
                    {[
                      { value: timeLeft.days, label: 'Ngày' },
                      { value: timeLeft.hours, label: 'Giờ' },
                      { value: timeLeft.minutes, label: 'Phút' },
                      { value: timeLeft.seconds, label: 'Giây' },
                    ].map((item, index) => (
                      <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px]">
                        <div className="text-2xl sm:text-3xl font-bold">{String(item.value).padStart(2, '0')}</div>
                        <div className="text-xs sm:text-sm opacity-75">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flash Sale Banner */}
        {flashSale?.banner_url && (
          <div className="container mx-auto px-4 -mt-4 relative z-10">
            <img 
              src={flashSale.banner_url} 
              alt={flashSale.name}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !flashSale ? (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Không có Flash Sale</h2>
              <p className="text-muted-foreground mb-6">Hiện tại chưa có chương trình Flash Sale nào đang diễn ra</p>
              <Link to="/">
                <Button>Quay về trang chủ</Button>
              </Link>
            </div>
          ) : items && items.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Flame className="h-6 w-6 text-red-500" />
                <h2 className="text-xl sm:text-2xl font-bold">Sản phẩm đang giảm giá</h2>
                <Badge variant="destructive" className="ml-2">{items.length} sản phẩm</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {items.map((item) => {
                  const soldPercent = item.quantity_limit 
                    ? (item.quantity_sold / item.quantity_limit) * 100 
                    : 0;
                  const isSoldOut = item.quantity_limit !== null && item.quantity_sold >= item.quantity_limit;

                  return (
                    <Link 
                      key={item.id} 
                      to={`/product/${item.product?.slug}`}
                      className={cn("group", isSoldOut && "pointer-events-none")}
                    >
                      <Card className={cn(
                        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
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
                            className="absolute top-2 left-2 bg-red-500 text-white font-bold text-sm sm:text-base px-2 sm:px-3"
                          >
                            -{item.discount_percent}%
                          </Badge>

                          {/* Sold Out Overlay */}
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">HẾT HÀNG</span>
                            </div>
                          )}

                          {/* Flash Icon */}
                          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full">
                            <Zap className="h-4 w-4" />
                          </div>
                        </div>

                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-1">
                            {item.product?.name}
                            {item.package && (
                              <span className="text-muted-foreground"> - {item.package.name}</span>
                            )}
                          </h3>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-red-500 font-bold text-base sm:text-lg">
                                {formatPrice(item.sale_price)}
                              </span>
                              <span className="text-muted-foreground line-through text-xs sm:text-sm">
                                {formatPrice(item.original_price)}
                              </span>
                            </div>

                            {/* Stock Progress */}
                            {item.quantity_limit && (
                              <div className="space-y-1">
                                <Progress 
                                  value={soldPercent} 
                                  className="h-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Đã bán: {item.quantity_sold}</span>
                                  <span>Còn: {item.quantity_limit - item.quantity_sold}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <Button 
                            size="sm" 
                            className="w-full mt-3 bg-red-500 hover:bg-red-600"
                            disabled={isSoldOut}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isSoldOut ? 'Hết hàng' : 'Mua ngay'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Chưa có sản phẩm</h2>
              <p className="text-muted-foreground">Flash Sale này chưa có sản phẩm nào</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FlashSalePage;