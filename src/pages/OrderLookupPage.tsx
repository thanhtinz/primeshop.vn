import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, XCircle, Truck, Loader2, X, ChevronLeft, ChevronRight, SlidersHorizontal, Calendar, LogIn, FileText, CreditCard, Gamepad2, Image, Crown, Star, ExternalLink } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrdersByEmail } from '@/hooks/useOrders';
import { useBuyerDesignOrders } from '@/hooks/useDesignServices';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFormat } from '@/hooks/useDateFormat';

type OrderStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_FAILED' | 'CANCELLED' | 'PROCESSING' | 'WAITING_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'REFUNDED' | 'EXPIRED';
type OrderType = 'topup' | 'game' | 'design' | 'premium' | 'prime_boost' | 'account' | 'game_topup';

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
  delivery_content?: string | null;
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

const OrderLookupPage = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const { formatDate, formatDateTime, locale } = useDateFormat();
  
  // Fetch all order types using hooks
  const { data: topupOrders, isLoading: loadingTopup } = useOrdersByEmail(profile?.email || '');
  const { data: gameOrders, isLoading: loadingGame } = useBuyerGameOrders(user?.id);
  const { data: designOrders, isLoading: loadingDesign } = useBuyerDesignOrders();
  const { data: premiumOrders, isLoading: loadingPremium } = useBuyerPremiumOrders(user?.id);

  const isLoading = loadingTopup || loadingGame || loadingDesign || loadingPremium;
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
    DRAFT: { label: t('draft'), variant: 'secondary', icon: Clock },
    PENDING_PAYMENT: { label: t('pendingPayment'), variant: 'outline', icon: Clock },
    PAID: { label: t('paid'), variant: 'default', icon: CheckCircle },
    PAYMENT_FAILED: { label: t('paymentFailed'), variant: 'destructive', icon: XCircle },
    CANCELLED: { label: t('cancelled'), variant: 'destructive', icon: XCircle },
    PROCESSING: { label: t('processingStatus'), variant: 'outline', icon: Clock },
    WAITING_DELIVERY: { label: t('waitingDelivery'), variant: 'outline', icon: Truck },
    DELIVERED: { label: t('delivered'), variant: 'default', icon: CheckCircle },
    COMPLETED: { label: t('completed'), variant: 'default', icon: CheckCircle },
    REFUNDED: { label: t('refunded'), variant: 'secondary', icon: XCircle },
    EXPIRED: { label: t('expired'), variant: 'destructive', icon: XCircle },
  };

  // Type badge configuration (same as SettingsOrdersPage)
  const getTypeBadge = (type: OrderType) => {
    const typeMap: Record<OrderType, { icon: React.ReactNode; label: string; className: string }> = {
      topup: { 
        icon: <CreditCard className="h-3 w-3" />, 
        label: 'Nạp game', 
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
      },
      game_topup: { 
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
    const info = typeMap[type] || typeMap.premium;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${info.className}`}>
        {info.icon}
        {info.label}
      </span>
    );
  };

  // Merge all orders into a unified list (same logic as SettingsOrdersPage)
  const allOrders = useMemo(() => {
    const orders: UnifiedOrder[] = [];

    // Orders from products (topup, premium, account, design)
    topupOrders?.forEach((order: any) => {
      const snapshot = order.product_snapshot;
      const productName = snapshot?.product?.name || t('product');
      const packageName = snapshot?.selectedPackage?.name;
      const style = snapshot?.product?.style || 'topup';
      
      // Map style to order type
      let orderType: OrderType = 'topup';
      if (style === 'premium') orderType = 'premium';
      else if (style === 'game_topup') orderType = 'game_topup';
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
        delivery_content: order.delivery_content,
      });
    });

    // Game account orders
    gameOrders?.forEach((order: any) => {
      orders.push({
        id: order.id,
        type: 'game',
        orderNumber: order.order_number || `#${order.id.slice(0, 8)}`,
        title: order.product?.title || t('product'),
        subtitle: `Shop: ${order.seller?.shop_name || 'N/A'}`,
        status: order.status,
        amount: order.amount || 0,
        createdAt: order.created_at,
        detailLink: `/order/${order.id}`,
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
      });
    });

    // Sort by createdAt descending
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [topupOrders, gameOrders, designOrders, premiumOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOrder, dateFrom, dateTo]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...allOrders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.title?.toLowerCase().includes(query) ||
        order.subtitle?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(order => new Date(order.createdAt) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.createdAt) <= endOfDay);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [allOrders, searchQuery, statusFilter, sortOrder, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFiltersCount = [
    statusFilter !== 'all',
    dateFrom !== undefined,
    dateTo !== undefined,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOrder('newest');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  // Require login
  if (!user) {
    return (
      <Layout>
        <div className="container py-6 md:py-10">
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">{t('loginToContinue')}</h1>
              <p className="text-muted-foreground mb-6">
                {t('pleaseLoginToViewOrders')}
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full h-12">
                <LogIn className="h-5 w-5 mr-2" />
                {t('login')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('yourOrders')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('viewAllYourOrders')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('ordersOf')}</p>
                <p className="font-semibold text-foreground">{profile?.email}</p>
              </div>
            </div>

              {/* Filter Section */}
              {allOrders.length > 0 && (
                <div className="space-y-3">
                  {/* Search and Filter Toggle */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('searchOrderProduct')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={showFilters ? "secondary" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative"
                      >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        {t('filters')}
                        {activeFiltersCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {activeFiltersCount}
                          </Badge>
                        )}
                      </Button>
                      <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder={t('sort')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">{t('sortNewest')}</SelectItem>
                          <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
                          <SelectItem value="highest">{t('highestPrice')}</SelectItem>
                          <SelectItem value="lowest">{t('lowestPrice')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t('status')}</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('allStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('allStatus')}</SelectItem>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t('fromDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateFrom ? formatDate(dateFrom) : t('selectDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t('toDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateTo ? formatDate(dateTo) : t('selectDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                          <X className="h-4 w-4 mr-1" />
                          {t('clearFilters')}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Results Count */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {t('showingOrders')} {paginatedOrders.length} / {filteredOrders.length} {t('ofOrders')}
                      {filteredOrders.length !== allOrders.length && ` (${allOrders.length} ${t('totalOrders')})`}
                    </span>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paginatedOrders.length > 0 ? (
                <div className="space-y-4">
                  {paginatedOrders.map(order => {
                    const status = statusConfig[order.status as OrderStatus] || statusConfig.COMPLETED;
                    const StatusIcon = status.icon;
                    
                    return (
                      <div
                        key={`${order.type}-${order.id}`}
                        className="rounded-xl border border-border bg-card p-4 md:p-6 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getTypeBadge(order.type)}
                              <p className="font-mono text-xs text-muted-foreground">
                                {order.orderNumber}
                              </p>
                              <Badge variant={status.variant} className="text-[10px]">
                                {status.label}
                              </Badge>
                            </div>
                            <h3 className="mt-1 font-semibold text-foreground line-clamp-1">
                              {order.title}
                            </h3>
                            {order.subtitle && (
                              <p className="text-sm text-muted-foreground">
                                {order.subtitle}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(order.createdAt)}
                              {order.expiresAt && (
                                <> → {formatDate(order.expiresAt)}</>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary text-lg">{formatPrice(order.amount)}</p>
                          </div>
                        </div>
                        {order.delivery_content && (
                          <div className="mt-4 rounded-lg bg-green-500/10 p-4 border border-green-500/20">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('deliveryContent')}</p>
                            <p className="mt-1 font-mono text-sm break-all">{order.delivery_content}</p>
                          </div>
                        )}

                        {/* Detail Button */}
                        {order.detailLink && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <Link to={order.detailLink}>
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t('viewDetailedInvoice')}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 5) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, array) => (
                            <span key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            </span>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : allOrders.length > 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('noOrdersMatchFilter')}</p>
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    {t('clearFilters')}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('noOrdersFound')}</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderLookupPage;