import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useOrdersByEmail } from '@/hooks/useOrders';
import { useBuyerDesignOrders } from '@/hooks/useDesignServices';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useDateFormat } from '@/hooks/useDateFormat';
import { ShoppingBag, Loader2, ExternalLink, ChevronLeft, ChevronRight, Package, Gamepad2, CreditCard, Crown, Image, Star } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContext {
  t: (key: string) => string;
}

const ITEMS_PER_PAGE = 10;

// Hook for buyer's game account orders
const useBuyerGameOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['buyer-game-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(id, title, images, category_id, price),
          seller:sellers(shop_name, shop_slug, shop_avatar_url)
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook for buyer's premium subscriptions
const useBuyerPremiumOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['buyer-premium-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('prime_boost_subscriptions')
        .select(`
          *,
          plan:prime_boost_plans(name, name_en, price, days)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

type OrderType = 'topup' | 'game' | 'design' | 'premium' | 'prime_boost' | 'account';

interface UnifiedOrder {
  id: string;
  type: OrderType;
  orderNumber: string;
  title: string;
  subtitle?: string;
  status: string;
  amount: number;
  createdAt: string;
  detailLink?: string;
  expiresAt?: string;
  raw: any;
}

export default function SettingsOrdersPage() {
  const { t } = useOutletContext<SettingsContext>();
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const { formatDateTime, formatDate } = useDateFormat();
  
  // Fetch all order types
  const { data: topupOrders, isLoading: loadingTopup } = useOrdersByEmail(profile?.email || '');
  const { data: gameOrders, isLoading: loadingGame } = useBuyerGameOrders(user?.id);
  const { data: designOrders, isLoading: loadingDesign } = useBuyerDesignOrders();
  const { data: premiumOrders, isLoading: loadingPremium } = useBuyerPremiumOrders(user?.id);

  const isLoading = loadingTopup || loadingGame || loadingDesign || loadingPremium;

  // Merge all orders into a unified list
  const allOrders = useMemo(() => {
    const orders: UnifiedOrder[] = [];

    // Orders from products (topup, premium, account, design)
    topupOrders?.forEach((order: any) => {
      const snapshot = order.product_snapshot;
      const productName = snapshot?.product?.name || 'Sản phẩm';
      const packageName = snapshot?.selectedPackage?.name;
      const style = snapshot?.product?.style || 'topup';
      
      // Map style to order type
      let orderType: OrderType = 'topup';
      if (style === 'premium') orderType = 'premium';
      else if (style === 'account') orderType = 'account';
      else if (style === 'design') orderType = 'design';
      
      orders.push({
        id: order.id,
        type: orderType,
        orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
        title: productName,
        subtitle: packageName ? `Gói: ${packageName}` : undefined,
        status: order.status,
        amount: order.total_amount || 0,
        createdAt: order.created_at,
        detailLink: `/invoice/${order.order_number}`,
        raw: order,
      });
    });

    // Game account orders
    gameOrders?.forEach((order: any) => {
      orders.push({
        id: order.id,
        type: 'game',
        orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
        title: order.product?.title || 'Sản phẩm',
        subtitle: `Shop: ${order.seller?.shop_name || 'N/A'}`,
        status: order.status,
        amount: order.amount || 0,
        createdAt: order.created_at,
        detailLink: `/order/${order.id}`,
        raw: order,
      });
    });

    // Design orders
    designOrders?.forEach((order: any) => {
      orders.push({
        id: order.id,
        type: 'design',
        orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
        title: order.service?.name || 'Dịch vụ thiết kế',
        subtitle: `Shop: ${order.seller?.shop_name || 'N/A'}`,
        status: order.status,
        amount: order.amount || 0,
        createdAt: order.created_at,
        detailLink: `/design/order/${order.id}`,
        raw: order,
      });
    });

    // Prime Boost subscriptions
    premiumOrders?.forEach((order: any) => {
      const isActive = order.is_active && new Date(order.expires_at) > new Date();
      orders.push({
        id: order.id,
        type: 'prime_boost',
        orderNumber: `#${order.id.slice(0, 8)}`,
        title: order.plan?.name || 'Gói Prime Boost',
        subtitle: `Thời hạn: ${order.plan?.days || 0} ngày`,
        status: isActive ? 'active' : 'expired',
        amount: order.amount_paid || 0,
        createdAt: order.created_at,
        expiresAt: order.expires_at,
        raw: order,
      });
    });

    // Sort by created_at descending
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [topupOrders, gameOrders, designOrders, premiumOrders]);

  // Pagination
  const totalPages = Math.ceil(allOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    return allOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [allOrders, currentPage]);

  const getTypeBadge = (type: OrderType) => {
    const typeMap: Record<OrderType, { icon: React.ReactNode; label: string; className: string }> = {
      topup: { 
        icon: <CreditCard className="h-3 w-3" />, 
        label: 'Nạp game', 
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
      },
      game: { 
        icon: <Gamepad2 className="h-3 w-3" />, 
        label: 'Mua Acc', 
        className: 'bg-green-500/10 text-green-500 border-green-500/20' 
      },
      account: { 
        icon: <Gamepad2 className="h-3 w-3" />, 
        label: 'Bán Acc', 
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
      },
      design: { 
        icon: <Image className="h-3 w-3" />, 
        label: 'Thiết kế', 
        className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
      },
      premium: { 
        icon: <Crown className="h-3 w-3" />, 
        label: 'Premium', 
        className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
      },
      prime_boost: { 
        icon: <Star className="h-3 w-3" />, 
        label: 'Prime Boost', 
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
      },
    };
    const info = typeMap[type];
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${info.className}`}>
        {info.icon}
        {info.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      COMPLETED: { variant: 'default', label: 'Hoàn thành' },
      PAID: { variant: 'default', label: 'Đã thanh toán' },
      PENDING: { variant: 'secondary', label: 'Chờ xử lý' },
      CANCELLED: { variant: 'destructive', label: 'Đã hủy' },
      REFUNDED: { variant: 'outline', label: 'Đã hoàn tiền' },
      EXPIRED: { variant: 'destructive', label: 'Hết hạn' },
      completed: { variant: 'default', label: 'Hoàn thành' },
      pending: { variant: 'secondary', label: 'Chờ xử lý' },
      processing: { variant: 'secondary', label: 'Đang xử lý' },
      delivered: { variant: 'default', label: 'Đã giao' },
      cancelled: { variant: 'destructive', label: 'Đã hủy' },
      disputed: { variant: 'destructive', label: 'Tranh chấp' },
      in_progress: { variant: 'secondary', label: 'Đang thực hiện' },
      revision: { variant: 'outline', label: 'Chỉnh sửa' },
      active: { variant: 'default', label: 'Đang hoạt động' },
      expired: { variant: 'secondary', label: 'Hết hạn' },
    };
    return statusMap[status] || statusMap[status?.toUpperCase()] || { variant: 'secondary' as const, label: status };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          {t('myOrders')}
        </CardTitle>
        <CardDescription>
          Xem lịch sử tất cả đơn hàng của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allOrders.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                
                return (
                  <div key={`${order.type}-${order.id}`} className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTypeBadge(order.type)}
                          <p className="font-mono text-xs text-muted-foreground">
                            {order.orderNumber}
                          </p>
                          <Badge variant={statusInfo.variant} className="text-[10px]">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mt-1 truncate">{order.title}</p>
                        {order.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{order.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(order.createdAt)}
                          {order.expiresAt && (
                            <> → {formatDate(order.expiresAt)}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-sm">{formatPrice(order.amount)}</p>
                        {order.detailLink && (
                          <Link to={order.detailLink}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs mt-1 px-2">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Chi tiết
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có đơn hàng nào</p>
            <Link to="/products">
              <Button variant="outline" size="sm" className="mt-3">
                Mua sắm ngay
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}