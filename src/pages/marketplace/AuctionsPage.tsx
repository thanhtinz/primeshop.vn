import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useActiveAuctions, AuctionType } from '@/hooks/useAuctions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  Gavel, Clock, Timer, Users, TrendingDown, Eye, EyeOff, 
  Search, Flame, Zap, Trophy, Loader2, ArrowRight, Store
} from 'lucide-react';
import { motion } from 'framer-motion';

const AuctionTypeLabel: Record<AuctionType, { label: string; icon: React.ReactNode; color: string }> = {
  time_based: { label: 'Thời gian', icon: <Clock className="h-3 w-3" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  buy_now: { label: 'Mua ngay', icon: <Zap className="h-3 w-3" />, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  dutch: { label: 'Giảm dần', icon: <TrendingDown className="h-3 w-3" />, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  sealed: { label: 'Đấu kín', icon: <EyeOff className="h-3 w-3" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' }
};

const AuctionCard = ({ auction, index }: { auction: any; index: number }) => {
  const { formatPrice } = useCurrency();
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const endTime = new Date(auction.end_time).getTime();
      const now = Date.now();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Đã kết thúc');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.end_time]);

  const typeConfig = AuctionTypeLabel[auction.auction_type as AuctionType] || AuctionTypeLabel.time_based;
  const isEnding = new Date(auction.end_time).getTime() - Date.now() < 1000 * 60 * 30; // 30 min
  const isHot = (auction.bid_count || 0) >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/shops/auction/${auction.id}`}>
        <Card className="group overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/30">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img 
              src={auction.image_url || auction.product?.images?.[0] || '/placeholder.svg'} 
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Type badge */}
            <Badge className={`absolute top-2 left-2 ${typeConfig.color} gap-1 text-[10px]`}>
              {typeConfig.icon}
              {typeConfig.label}
            </Badge>
            
            {/* Timer */}
            <div className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
              isEnding ? 'bg-red-500 text-white animate-pulse' : 'bg-background/90 text-foreground border'
            }`}>
              <Timer className="h-3 w-3 inline mr-1" />
              {timeLeft}
            </div>
            
            {/* Hot badge */}
            {isHot && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                <Flame className="h-3 w-3" />
                HOT
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[2.5rem]">
              {auction.title}
            </h3>
            
            <div className="space-y-2">
              {/* Current price */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Giá hiện tại</span>
                <span className="font-bold text-primary text-base">{formatPrice(auction.current_price || auction.starting_price)}</span>
              </div>
              
              {/* Buy now price */}
              {auction.buy_now_price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mua ngay</span>
                  <span className="font-medium text-green-600">{formatPrice(auction.buy_now_price)}</span>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {auction.bid_count || 0} lượt đấu giá
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {auction.view_count || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

const AuctionsPage = () => {
  const { data: auctions, isLoading, error } = useActiveAuctions();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('ending_soon');

  const filteredAuctions = auctions?.filter(auction => {
    const matchSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || auction.auction_type === typeFilter;
    return matchSearch && matchType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'ending_soon':
        return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
      case 'most_bids':
        return (b.bid_count || 0) - (a.bid_count || 0);
      case 'price_low':
        return (a.current_price || a.starting_price) - (b.current_price || b.starting_price);
      case 'price_high':
        return (b.current_price || b.starting_price) - (a.current_price || a.starting_price);
      default:
        return 0;
    }
  }) || [];

  const endingSoon = auctions?.filter(a => 
    new Date(a.end_time).getTime() - Date.now() < 1000 * 60 * 60 // 1 hour
  ) || [];

  const hotAuctions = auctions?.filter(a => (a.bid_count || 0) >= 5) || [];

  return (
    <Layout>
      {/* Hero Header */}
      <div className="border-b bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background">
        <div className="container py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Gavel className="h-3 w-3 mr-1" />
              Marketplace Auction
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Đấu giá <span className="text-amber-500">trực tuyến</span>
            </h1>
            <p className="text-muted-foreground mb-6">
              Tham gia các phiên đấu giá hấp dẫn với cơ hội sở hữu tài khoản game giá tốt
            </p>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm phiên đấu giá..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="time_based">Thời gian</SelectItem>
                  <SelectItem value="buy_now">Mua ngay</SelectItem>
                  <SelectItem value="dutch">Giảm dần</SelectItem>
                  <SelectItem value="sealed">Đấu kín</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ending_soon">Sắp kết thúc</SelectItem>
                  <SelectItem value="most_bids">Nhiều lượt nhất</SelectItem>
                  <SelectItem value="price_low">Giá thấp</SelectItem>
                  <SelectItem value="price_high">Giá cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: 'Đang diễn ra', value: auctions?.length || 0, icon: <Gavel className="h-4 w-4" />, color: 'text-amber-600' },
              { label: 'Sắp kết thúc', value: endingSoon.length, icon: <Timer className="h-4 w-4" />, color: 'text-red-600' },
              { label: 'Đang hot', value: hotAuctions.length, icon: <Flame className="h-4 w-4" />, color: 'text-orange-600' },
              { label: 'Hôm nay', value: auctions?.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length || 0, icon: <Trophy className="h-4 w-4" />, color: 'text-green-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-background/60 backdrop-blur-sm rounded-xl p-3 border">
                <div className="flex items-center gap-3">
                  <div className={`${stat.color}`}>{stat.icon}</div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="container py-6">
        {/* Ending soon section */}
        {endingSoon.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="h-5 w-5 text-red-500" />
              <h2 className="font-bold text-lg">Sắp kết thúc</h2>
              <Badge variant="destructive" className="text-[10px]">
                {endingSoon.length} phiên
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {endingSoon.slice(0, 5).map((auction, i) => (
                <AuctionCard key={auction.id} auction={auction} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* All auctions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Tất cả phiên đấu giá</h2>
            <span className="text-sm text-muted-foreground">{filteredAuctions.length} phiên</span>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Đang tải phiên đấu giá...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Gavel className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Có lỗi xảy ra</h3>
              <p className="text-muted-foreground mb-4">Không thể tải danh sách đấu giá</p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          ) : filteredAuctions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAuctions.map((auction, i) => (
                <AuctionCard key={auction.id} auction={auction} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Gavel className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Không có phiên đấu giá nào</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' 
                  : 'Hiện tại chưa có phiên đấu giá nào đang diễn ra'}
              </p>
              <Link to="/shops">
                <Button variant="outline" className="gap-2">
                  <Store className="h-4 w-4" />
                  Khám phá cửa hàng
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuctionsPage;