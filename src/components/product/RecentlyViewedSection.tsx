import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const RecentlyViewedSection = () => {
  const { items, removeItem, clearAll } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  if (items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Đã xem gần đây</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Xóa tất cả
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="relative flex-shrink-0 w-[180px] group"
              >
                <Link
                  to={item.type === 'marketplace' ? `/shops/product/${item.slug}` : `/product/${item.slug}`}
                  className="block"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                    <img
                      src={item.imageUrl || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium truncate">{item.name}</h3>
                  {item.price && (
                    <p className="text-sm text-primary font-semibold">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(item.productId);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
};
