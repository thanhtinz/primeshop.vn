import { forwardRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveAuctions } from '@/hooks/useAuctions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Gavel, Clock, ArrowRight, Flame, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const AuctionBanner = forwardRef<HTMLDivElement, {}>(function AuctionBanner(_, ref) {
  const { data: auctions, isLoading } = useActiveAuctions();
  const { formatPrice } = useCurrency();

  if (isLoading || !auctions || auctions.length === 0) return null;

  // Get featured auctions (ending soon or hot)
  const endingSoon = auctions.filter(a => 
    new Date(a.end_time).getTime() - Date.now() < 1000 * 60 * 60 * 2 // 2 hours
  );
  const hotAuctions = auctions.filter(a => (a.bid_count || 0) >= 3);
  const featuredAuctions = [...new Map([...endingSoon, ...hotAuctions].map(a => [a.id, a])).values()].slice(0, 3);

  if (featuredAuctions.length === 0) {
    // Show general auction banner if no hot/ending soon
    return (
      <div className="container mb-4">
        <Link to="/shops/auctions">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Đấu giá đang diễn ra</h3>
                  <p className="text-sm text-white/80">{auctions.length} phiên đấu giá đang chờ bạn tham gia</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="gap-1 whitespace-nowrap">
                Xem ngay <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="container mb-4">
      <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-amber-500" />
            <h3 className="font-bold">Đấu giá nổi bật</h3>
            <Badge variant="secondary" className="text-amber-600 bg-amber-500/10">
              {auctions.length} phiên
            </Badge>
          </div>
          <Link to="/shops/auctions" className="text-sm text-primary hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featuredAuctions.map(auction => (
            <AuctionMiniCard key={auction.id} auction={auction} formatPrice={formatPrice} />
          ))}
        </div>
      </div>
    </div>
  );
});

function AuctionMiniCard({ auction, formatPrice }: { auction: any; formatPrice: (n: number) => string }) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const endTime = new Date(auction.end_time).getTime();
      const now = Date.now();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Kết thúc');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [auction.end_time]);

  const isEnding = new Date(auction.end_time).getTime() - Date.now() < 1000 * 60 * 60; // 1 hour
  const isHot = (auction.bid_count || 0) >= 3;

  return (
    <Link 
      to={`/shops/auction/${auction.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg bg-card border hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        <img 
          src={auction.image_url || auction.product?.images?.[0] || '/placeholder.svg'} 
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {auction.title}
        </h4>
        <p className="text-primary font-bold text-sm">
          {formatPrice(auction.current_price || auction.starting_price)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className={`flex items-center gap-1 ${isEnding ? 'text-red-500' : ''}`}>
            <Clock className="h-3 w-3" />
            {timeLeft}
          </span>
          {isHot && (
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="h-3 w-3" />
              Hot
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {auction.bid_count || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}