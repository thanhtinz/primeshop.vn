import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, ExternalLink, Loader2, Package, Search, X, RotateCcw, MessageCircle, Shield, Hash, Server, Link2, Layers, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSmmOrders, useSmmApiCall, useUpdateSmmOrder } from '@/hooks/useSmm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDateFormat } from '@/hooks/useDateFormat';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const SmmOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice, convertToVND } = useCurrency();
  const { formatDateTime } = useDateFormat();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  
  const { data: userOrders = [], refetch: refetchOrders } = useSmmOrders(user?.id);
  const apiCall = useSmmApiCall();
  const updateOrder = useUpdateSmmOrder();

  // Realtime subscription for order status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('smm-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'smm_orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('SMM order updated:', payload);
          refetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchOrders]);

  const filteredOrders = userOrders.filter(order => {
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const orderStats = {
    total: userOrders.length,
    completed: userOrders.filter(o => o.status === 'Completed').length,
    processing: userOrders.filter(o => ['Processing', 'In progress'].includes(o.status || '')).length,
    pending: userOrders.filter(o => o.status === 'Pending').length,
    canceled: userOrders.filter(o => o.status === 'Canceled').length,
    refunded: userOrders.filter(o => o.status === 'Refunded').length,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: t('smmStatusPending') },
      'Processing': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: t('smmStatusProcessing') },
      'In progress': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: t('smmStatusInProgress') },
      'Completed': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: t('smmStatusCompleted') },
      'Partial': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: t('smmStatusPartial') },
      'Canceled': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: t('smmStatusCanceled') },
      'Refunded': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', label: t('smmStatusRefunded') },
    };
    const config = statusConfig[status] || { color: 'bg-muted text-muted-foreground', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleRefreshStatus = async (orderId: string, externalOrderId: number | null) => {
    if (!externalOrderId) {
      toast.error(t('smmNoExternalOrderId'));
      return;
    }

    setRefreshingId(orderId);
    try {
      const result = await apiCall.mutateAsync({
        action: 'status',
        order: externalOrderId,
      });

      await updateOrder.mutateAsync({
        id: orderId,
        status: result.status,
        start_count: result.start_count,
        remains: result.remains,
      });

      toast.success(t('smmStatusUpdated'));
      refetchOrders();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRequestRefill = async (orderId: string, externalOrderId: number | null) => {
    if (!externalOrderId) {
      toast.error(t('smmNoExternalOrderId'));
      return;
    }

    try {
      const result = await apiCall.mutateAsync({
        action: 'refill',
        order: externalOrderId,
      });

      await updateOrder.mutateAsync({
        id: orderId,
        refill_id: result.refill,
        refill_status: 'Pending',
      });

      toast.success(t('smmRefillSent'));
      refetchOrders();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter;

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground mb-4">{t('smmPleaseLoginToViewOrders')}</p>
          <Button onClick={() => navigate('/auth')}>{t('login')}</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('smmOrders')}</h1>
          <p className="text-sm text-muted-foreground">{t('smmOrdersDesc')}</p>
        </div>

        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Card className="p-3">
                <div className="text-2xl font-bold">{orderStats.total}</div>
                <div className="text-xs text-muted-foreground">{t('smmTotalOrders')}</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                <div className="text-xs text-muted-foreground">{t('smmCompleted')}</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
                <div className="text-xs text-muted-foreground">{t('smmProcessing')}</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                <div className="text-xs text-muted-foreground">{t('smmPending')}</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-red-600">{orderStats.canceled}</div>
                <div className="text-xs text-muted-foreground">{t('smmCanceled')}</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-gray-600">{orderStats.refunded}</div>
                <div className="text-xs text-muted-foreground">{t('smmRefunded')}</div>
              </Card>
            </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('smmSearchOrders')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('smmFilterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('smmAllStatus')}</SelectItem>
                <SelectItem value="Pending">{t('smmStatusPending')}</SelectItem>
                <SelectItem value="Processing">{t('smmStatusProcessing')}</SelectItem>
                <SelectItem value="In progress">{t('smmStatusInProgress')}</SelectItem>
                <SelectItem value="Completed">{t('smmStatusCompleted')}</SelectItem>
                <SelectItem value="Partial">{t('smmStatusPartial')}</SelectItem>
                <SelectItem value="Canceled">{t('smmStatusCanceled')}</SelectItem>
                <SelectItem value="Refunded">{t('smmStatusRefunded')}</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Orders Table - Desktop */}
        <div className="hidden md:block">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">{t('smmService')}</TableHead>
                  <TableHead className="text-right">{t('smmAmount')}</TableHead>
                  <TableHead className="text-right">{t('smmQuantity')}</TableHead>
                  <TableHead className="text-right">{t('smmIncreased')}</TableHead>
                  <TableHead>{t('smmCreatedAt')}</TableHead>
                  <TableHead>{t('smmCompletedAt')}</TableHead>
                  <TableHead>{t('smmStatus')}</TableHead>
                  <TableHead className="text-right">{t('smmActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {order.order_number}
                        </div>
                        <div className="font-medium text-sm truncate max-w-[260px] flex items-center gap-1">
                          <Server className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          {order.service?.name || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {order.service?.service_type?.platform?.name && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {order.service.service_type.platform.name}
                            </span>
                          )}
                          {order.service?.service_type?.name && (
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {order.service.service_type.name}
                            </span>
                          )}
                        </div>
                        <a 
                          href={order.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[260px] mt-1"
                        >
                          <Link2 className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                          {order.link}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(convertToVND(order.charge))}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {order.remains !== null ? `+${(order.quantity - order.remains).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at, 'HH:mm dd/MM/yy')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.completed_at 
                        ? formatDateTime(order.completed_at, 'HH:mm dd/MM/yy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(order.status || 'Pending')}
                        {order.refill_status && (
                          <Badge variant="outline" className="text-xs w-fit">
                            {t('smmRefill')}: {order.refill_status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshStatus(order.id, order.external_order_id)}
                          disabled={refreshingId === order.id}
                          title={t('smmRefresh')}
                        >
                          {refreshingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        {['Completed', 'Partial'].includes(order.status || '') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/smm/order?service=${order.service_id}&link=${encodeURIComponent(order.link)}&quantity=${order.quantity}`)}
                              title={t('smmReorder')}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/support')}
                              title={t('smmSupportOrder')}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            {order.service?.has_refill && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRequestRefill(order.id, order.external_order_id)}
                                title={t('smmWarranty')}
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">{t('smmNoOrders')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Orders Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {order.order_number}
                  </div>
                  <div className="font-medium text-sm truncate max-w-[200px] flex items-center gap-1">
                    <Server className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {order.service?.name || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {order.service?.service_type?.platform?.name && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {order.service.service_type.platform.name}
                      </span>
                    )}
                    {order.service?.service_type?.name && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {order.service.service_type.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(order.status || 'Pending')}
                  {order.refill_status && (
                    <Badge variant="outline" className="text-xs">
                      Refill: {order.refill_status}
                    </Badge>
                  )}
                </div>
              </div>
              
              <a 
                href={order.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 truncate mb-3"
              >
                <Link2 className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                {order.link}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">{t('smmAmount')}:</span>
                  <div className="font-medium">{formatPrice(convertToVND(order.charge))}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmQuantity')}:</span>
                  <div className="font-medium">{order.quantity.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmIncreased')}:</span>
                  <div className="font-medium text-green-600">
                    {order.remains !== null ? `+${(order.quantity - order.remains).toLocaleString()}` : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmCreatedAt')}:</span>
                  <div className="font-medium text-xs">
                    {formatDateTime(order.created_at, 'HH:mm dd/MM/yy')}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('smmCompletedAt')}:</span>
                  <div className="font-medium text-xs">
                    {order.completed_at 
                      ? formatDateTime(order.completed_at, 'HH:mm dd/MM/yy')
                      : '-'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshStatus(order.id, order.external_order_id)}
                  disabled={refreshingId === order.id}
                >
                  {refreshingId === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  {t('smmRefresh')}
                </Button>
                {['Completed', 'Partial'].includes(order.status || '') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/smm/order?service=${order.service_id}&link=${encodeURIComponent(order.link)}&quantity=${order.quantity}`)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      {t('smmReorder')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/support')}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {t('smmSupportOrder')}
                    </Button>
                    {order.service?.has_refill && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestRefill(order.id, order.external_order_id)}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {t('smmWarranty')}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('smmNoOrders')}</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default SmmOrdersPage;
