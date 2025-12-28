import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Layout } from '@/components/layout/Layout';
import { useAuction, useAuctionBids, usePlaceBid, useBuyNow, useWatchAuction, useIsWatching, AuctionType } from '@/hooks/useAuctions';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Gavel, Clock, Timer, Users, TrendingDown, Eye, EyeOff, Bell, BellOff,
  Zap, ArrowUp, Store, MessageCircle, Shield, Loader2, ChevronLeft, Heart
} from 'lucide-react';

const AuctionTypeConfig: Record<AuctionType, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  time_based: { 
    label: 'Đấu giá thời gian', 
    icon: <Clock className="h-4 w-4" />, 
    color: 'bg-blue-500/10 text-blue-600',
    description: 'Người ra giá cao nhất khi hết thời gian sẽ thắng'
  },
  buy_now: { 
    label: 'Đấu giá + Mua ngay', 
    icon: <Zap className="h-4 w-4" />, 
    color: 'bg-green-500/10 text-green-600',
    description: 'Có thể đấu giá hoặc mua ngay với giá cố định'
  },
  dutch: { 
    label: 'Đấu giá giảm dần', 
    icon: <TrendingDown className="h-4 w-4" />, 
    color: 'bg-orange-500/10 text-orange-600',
    description: 'Giá sẽ giảm dần theo thời gian, người mua đầu tiên thắng'
  },
  sealed: { 
    label: 'Đấu giá kín', 
    icon: <EyeOff className="h-4 w-4" />, 
    color: 'bg-purple-500/10 text-purple-600',
    description: 'Không ai thấy giá đấu của người khác'
  }
};

const AuctionDetailPage = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { data: auction, isLoading } = useAuction(auctionId || '');
  const { data: bids } = useAuctionBids(auctionId || '');
  const { data: isWatching } = useIsWatching(auctionId || '');
  const { mutate: placeBid, isPending: isBidding } = usePlaceBid();
  const { mutate: buyNow, isPending: isBuying } = useBuyNow();
  const { mutate: watchAuction } = useWatchAuction();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { data: categories = [] } = useMarketplaceCategories();
  
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showBuyNowDialog, setShowBuyNowDialog] = useState(false);

  useEffect(() => {
    if (!auction) return;
    
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
      
      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const handlePlaceBid = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    
    const minBid = (auction?.current_price || auction?.starting_price || 0) + (auction?.min_bid_increment || 10000);
    if (amount < minBid) {
      toast.error(`Giá tối thiểu là ${formatPrice(minBid)}`);
      return;
    }
    
    placeBid({ auctionId: auctionId!, amount });
    setShowBidDialog(false);
    setBidAmount('');
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    
    buyNow({ auctionId: auctionId!, price: auction!.buy_now_price! });
    setShowBuyNowDialog(false);
  };

  const handleWatch = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    watchAuction({ auctionId: auctionId!, watch: !isWatching });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!auction) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <Gavel className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy đấu giá</h1>
          <p className="text-muted-foreground mb-4">Phiên đấu giá này không tồn tại hoặc đã bị xóa</p>
          <Button asChild>
            <Link to="/shops/auctions">Quay lại</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const typeConfig = AuctionTypeConfig[auction.auction_type as AuctionType];
  const isEnded = auction.status === 'ended' || auction.status === 'sold' || new Date(auction.end_time) < new Date();
  const isNotStarted = new Date(auction.start_time) > new Date();
  const canBid = !isEnded && !isNotStarted;
  const minBid = (auction.current_price || auction.starting_price) + auction.min_bid_increment;

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link to="/shops/auctions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" />
          Quay lại đấu giá
        </Link>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: Image */}
          <div className="md:col-span-2">
            <Card className="overflow-hidden sticky top-4">
              <div className="aspect-square bg-muted">
                <img 
                  src={auction.image_url || auction.product?.images?.[0] || '/placeholder.svg'}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Seller info */}
              {auction.seller && (
                <CardContent className="p-4 border-t">
                  <Link 
                    to={`/shops/${auction.seller.shop_slug || auction.seller_id}`} 
                    className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      {auction.seller.shop_avatar_url ? (
                        <AvatarImage src={auction.seller.shop_avatar_url} alt={auction.seller.shop_name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {auction.seller.shop_name?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{auction.seller.shop_name}</p>
                      {auction.seller.rating_average ? (
                        <p className="text-xs text-muted-foreground">
                          ⭐ {auction.seller.rating_average.toFixed(1)} ({auction.seller.rating_count || 0} đánh giá)
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Xem shop</p>
                      )}
                    </div>
                    <Store className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right: Details */}
          <div className="md:col-span-3 space-y-4">
            {/* Type & Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${typeConfig.color} border-0 gap-1`}>
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              {isEnded ? (
                <Badge variant="secondary">Đã kết thúc</Badge>
              ) : isNotStarted ? (
                <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  <Clock className="h-3 w-3" />
                  Chưa bắt đầu
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Timer className="h-3 w-3" />
                  {timeLeft}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold">{auction.title}</h1>

            {/* Price card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Giá hiện tại</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(auction.current_price || auction.starting_price)}
                  </span>
                </div>
                
                {auction.buy_now_price && !isEnded && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mua ngay</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatPrice(auction.buy_now_price)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {auction.bid_count} lượt đấu giá
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {auction.view_count} lượt xem
                  </span>
                </div>

                {isNotStarted && (
                  <div className="text-center py-2">
                    <p className="text-sm text-yellow-600">
                      Phiên đấu giá sẽ bắt đầu lúc {new Date(auction.start_time).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}

                {canBid && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 gap-2" 
                      size="lg"
                      onClick={() => setShowBidDialog(true)}
                    >
                      <Gavel className="h-4 w-4" />
                      Đặt giá
                    </Button>
                    
                    {auction.buy_now_price && (
                      <Button 
                        variant="secondary" 
                        className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white"
                        size="lg"
                        onClick={() => setShowBuyNowDialog(true)}
                      >
                        <Zap className="h-4 w-4" />
                        Mua ngay
                      </Button>
                    )}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={handleWatch}
                >
                  {isWatching ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  {isWatching ? 'Bỏ theo dõi' : 'Theo dõi'}
                </Button>
              </CardContent>
            </Card>

            {/* Type description */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    {typeConfig.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{typeConfig.label}</h3>
                    <p className="text-sm text-muted-foreground">{typeConfig.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product info */}
            {auction.product && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Thông tin sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Tên sản phẩm</span>
                    <span className="text-sm font-medium">{auction.product.title}</span>
                  </div>
                  
                  {auction.product.category && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">Danh mục</span>
                      <Badge variant="outline">
                        {categories.find(c => c.slug === auction.product?.category)?.name || auction.product.category}
                      </Badge>
                    </div>
                  )}
                  
                  {auction.product.price && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">Giá gốc</span>
                      <span className="text-sm font-medium line-through text-muted-foreground">
                        {formatPrice(auction.product.price)}
                      </span>
                    </div>
                  )}
                  
                  {/* Account Info Fields */}
                  {auction.product.account_info && auction.product.account_info.length > 0 && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chi tiết tài khoản</p>
                      <div className="grid grid-cols-2 gap-2">
                        {auction.product.account_info.map((info, idx) => (
                          <div key={idx} className="bg-muted/50 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground uppercase">{info.name}</p>
                            <p className="text-sm font-medium truncate">{info.value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {auction.product.description && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Mô tả</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {auction.product.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Auction Description */}
            {auction.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Mô tả đấu giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{auction.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Bid history */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lịch sử đấu giá ({bids?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bids && bids.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bids.map((bid, index) => (
                      <div key={bid.id} className={`flex items-center justify-between p-2 rounded-lg ${index === 0 ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={bid.bidder?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">{bid.bidder?.full_name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {auction.auction_type === 'sealed' && bid.bidder_id !== user?.id 
                                ? '***' 
                                : bid.bidder?.full_name || bid.bidder?.username || 'Ẩn danh'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(bid.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${index === 0 ? 'text-primary' : ''}`}>
                            {auction.auction_type === 'sealed' && bid.bidder_id !== user?.id 
                              ? '***' 
                              : formatPrice(bid.amount)}
                          </p>
                          {bid.is_winning && <Badge variant="outline" className="text-[10px]">Đang dẫn đầu</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có lượt đấu giá nào</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bid Dialog */}
        <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Đặt giá
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
                <p className="text-xl font-bold">{formatPrice(auction.current_price || auction.starting_price)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Giá tối thiểu tiếp theo</p>
                <p className="text-lg font-semibold text-primary">{formatPrice(minBid)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Giá của bạn</label>
                <Input 
                  type="number"
                  placeholder={`Nhập từ ${formatPrice(minBid)}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBidDialog(false)}>Hủy</Button>
              <Button onClick={handlePlaceBid} disabled={isBidding}>
                {isBidding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Xác nhận đặt giá
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Buy Now Dialog */}
        <Dialog open={showBuyNowDialog} onOpenChange={setShowBuyNowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Mua ngay
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>Bạn sẽ mua sản phẩm này với giá:</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(auction.buy_now_price!)}</p>
              <p className="text-sm text-muted-foreground">
                Sau khi xác nhận, bạn sẽ trở thành người chiến thắng ngay lập tức.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBuyNowDialog(false)}>Hủy</Button>
              <Button onClick={handleBuyNow} disabled={isBuying} className="bg-green-500 hover:bg-green-600">
                {isBuying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Xác nhận mua
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AuctionDetailPage;
