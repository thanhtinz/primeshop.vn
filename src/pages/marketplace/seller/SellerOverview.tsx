import { Link, useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, ShoppingCart, Wallet, TrendingUp, AlertCircle,
  Plus, ArrowRight, Zap, BarChart3, MessagesSquare, Palette,
  Image, FileText, ClipboardList
} from 'lucide-react';
import { useMySellerProducts } from '@/hooks/useMarketplace';
import { useSellerDesignOrders } from '@/hooks/useDesignServices';
import { SellerAvailabilityToggle } from '@/components/design/SellerAvailabilityToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCompactNumber } from '@/lib/utils';

// Game Account Shop Overview
function GameAccountOverview({ seller, orders, formatPrice }: any) {
  const { data: products = [] } = useMySellerProducts();
  const { t } = useLanguage();

  const pendingOrders = orders?.filter((o: any) => o.status === 'paid') || [];
  const availableProducts = products.filter((p: any) => p.status === 'available').length;

  const quickActions = [
    { icon: Plus, label: t('sellerAddProduct'), path: '/seller/products', color: 'bg-primary' },
    { icon: Zap, label: t('sellerCreateFlashSale'), path: '/seller/flash-sale', color: 'bg-primary' },
    { icon: MessagesSquare, label: t('sellerViewMessages'), path: '/seller/chat', color: 'bg-primary' },
    { icon: BarChart3, label: t('sellerViewStats'), path: '/seller/stats', color: 'bg-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {t('sellerHello')}, {seller?.shop_name}! 👋
              </h2>
              <p className="text-muted-foreground">
                {t('sellerTodayOverview')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/seller/products">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('sellerAddProduct')}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert for pending orders */}
      {pendingOrders.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{pendingOrders.length} {t('sellerPendingOrders')}</p>
              <p className="text-sm text-muted-foreground">{t('sellerDeliverSoon')}</p>
            </div>
            <Link to="/seller/orders">
              <Button variant="outline" size="sm" className="shrink-0">
                {t('sellerViewNow')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerBalance')}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCompactNumber(seller?.balance || 0)}
                </p>
                {(seller?.locked_balance || 0) > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    {t('sellerHeldBalance')}: {formatCompactNumber(seller.locked_balance)}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerTotalRevenue')}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCompactNumber(seller?.total_revenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerProductsCount')}</p>
                <p className="text-2xl font-bold mt-1">{availableProducts}</p>
                <p className="text-xs text-muted-foreground">/ {products.length} {t('sellerTotal')}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerSold')}</p>
                <p className="text-2xl font-bold mt-1">{seller?.total_sales || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('sellerQuickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders Preview */}
      {orders && orders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('sellerRecentOrders')}</CardTitle>
            <Link to="/seller/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('sellerViewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.product?.title?.slice(0, 30)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatPrice(order.amount)}</p>
                    <Badge variant={
                      order.status === 'paid' ? 'default' :
                      order.status === 'completed' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {order.status === 'paid' ? t('sellerWaitingDelivery') :
                       order.status === 'delivered' ? t('sellerDelivered') :
                       order.status === 'completed' ? t('sellerCompleted') : order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Design Shop Overview
function DesignShopOverview({ seller, formatPrice }: any) {
  const { t } = useLanguage();
  const { data: designOrders = [] } = useSellerDesignOrders(seller?.id);

  const pendingOrders = designOrders.filter((o: any) => o.status === 'pending' || o.status === 'in_progress');
  const completedOrders = designOrders.filter((o: any) => o.status === 'completed');

  const quickActions = [
    { icon: Palette, label: 'Quản lý dịch vụ', path: '/seller/design-services' },
    { icon: ClipboardList, label: 'Đơn hàng thiết kế', path: '/seller/design-orders' },
    { icon: MessagesSquare, label: t('sellerViewMessages'), path: '/seller/chat' },
    { icon: FileText, label: t('sellerPosts'), path: '/seller/posts' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-background border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                  <Palette className="h-3 w-3 mr-1" />
                  Shop Thiết kế
                </Badge>
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {t('sellerHello')}, {seller?.shop_name}! 🎨
              </h2>
              <p className="text-muted-foreground">
                Tổng quan hoạt động thiết kế của bạn
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/seller/design-services">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dịch vụ
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Availability Toggle */}
      <SellerAvailabilityToggle
        sellerId={seller.id}
        currentStatus={seller.availability_status || 'available'}
        currentReason={seller.availability_reason}
        currentUntil={seller.availability_until}
      />

      {/* Alert for pending design orders */}
      {pendingOrders.length > 0 && (
        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
              <Image className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{pendingOrders.length} đơn thiết kế đang chờ</p>
              <p className="text-sm text-muted-foreground">Hãy hoàn thành đơn hàng cho khách</p>
            </div>
            <Link to="/seller/design-orders">
              <Button variant="outline" size="sm" className="shrink-0 border-purple-500/50 text-purple-600 hover:bg-purple-500/10">
                Xem ngay
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerBalance')}</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCompactNumber(seller?.balance || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('sellerTotalRevenue')}</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCompactNumber(seller?.total_revenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đơn đang làm</p>
                <p className="text-2xl font-bold mt-1">{pendingOrders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                <p className="text-2xl font-bold mt-1">{completedOrders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('sellerQuickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex-col gap-2 hover:border-purple-500/50 hover:bg-purple-500/5"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <action.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Design Orders Preview */}
      {designOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Đơn thiết kế gần đây</CardTitle>
            <Link to="/seller/design-orders">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('sellerViewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {designOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.service?.title?.slice(0, 30) || 'Dịch vụ thiết kế'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatPrice(order.total_price || 0)}</p>
                    <Badge variant={
                      order.status === 'pending' ? 'default' :
                      order.status === 'in_progress' ? 'secondary' :
                      order.status === 'completed' ? 'outline' : 'destructive'
                    } className="text-xs">
                      {order.status === 'pending' ? 'Chờ xử lý' :
                       order.status === 'in_progress' ? 'Đang làm' :
                       order.status === 'completed' ? 'Hoàn thành' : 
                       order.status === 'cancelled' ? 'Đã hủy' : order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SellerOverview() {
  const { seller, orders, formatPrice } = useOutletContext<any>();

  if (!seller) return null;

  // Render different overview based on shop type
  if (seller.shop_type === 'design') {
    return <DesignShopOverview seller={seller} formatPrice={formatPrice} />;
  }

  return <GameAccountOverview seller={seller} orders={orders} formatPrice={formatPrice} />;
}