import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingCart, RefreshCw, Search, ExternalLink, Filter, Trash2, DollarSign, RotateCcw } from 'lucide-react';
import { useSmmOrders, useUpdateSmmOrder, useSmmApiCall, useSmmServices, SmmOrder } from '@/hooks/useSmm';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';

const AdminSmmOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; order: SmmOrder | null }>({ open: false, order: null });
  const [refundReason, setRefundReason] = useState('');
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; order: SmmOrder | null }>({ open: false, order: null });
  const [newStatus, setNewStatus] = useState('');
  
  const { data: orders = [], isLoading, refetch } = useSmmOrders();
  const { data: services = [] } = useSmmServices();
  const updateOrder = useUpdateSmmOrder();
  const apiCall = useSmmApiCall();
  const { convertToVND } = useCurrency();

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.external_order_id?.toString().includes(searchQuery);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesService = !serviceFilter || order.service_id === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  // Calculate stats
  const stats = {
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing' || o.status === 'In progress').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    partial: orders.filter(o => o.status === 'Partial').length,
    canceled: orders.filter(o => o.status === 'Canceled').length,
    refunded: orders.filter(o => o.status === 'Refunded').length,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Chờ xử lý' },
      'Processing': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Đang xử lý' },
      'In progress': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: 'Đang chạy' },
      'Completed': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Hoàn thành' },
      'Partial': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: 'Hoàn thành 1 phần' },
      'Canceled': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Đã hủy' },
      'Refunded': { color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300', label: 'Hoàn tiền' },
    };
    const config = statusConfig[status] || { color: 'bg-muted text-muted-foreground', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleRefreshStatus = async (order: SmmOrder) => {
    if (!order.external_order_id) {
      toast.error('Đơn hàng chưa có ID từ API');
      return;
    }

    try {
      const result = await apiCall.mutateAsync({ 
        action: 'status', 
        order: order.external_order_id 
      });
      
      const newStatus = result.status;
      const remains = result.remains ? parseInt(result.remains) : 0;
      
      // Auto-refund for Partial or Canceled orders
      if ((newStatus === 'Partial' || newStatus === 'Canceled') && 
          order.status !== 'Partial' && order.status !== 'Canceled' && order.status !== 'Refunded') {
        
        // Calculate refund amount based on remains
        let refundRatio = 0;
        if (newStatus === 'Canceled') {
          refundRatio = 1; // Full refund
        } else if (newStatus === 'Partial' && remains > 0 && order.quantity > 0) {
          refundRatio = remains / order.quantity;
        }
        
        if (refundRatio > 0) {
          const refundAmountUSD = order.charge * refundRatio;
          const refundAmountVND = convertToVND(refundAmountUSD);
          
          // Call atomic RPC to refund
          const { data: rpcResult, error: rpcError } = await supabase.rpc('refund_smm_order', {
            p_user_id: order.user_id,
            p_order_id: order.id,
            p_refund_amount_vnd: refundAmountVND,
            p_reason: newStatus === 'Canceled' 
              ? 'Đơn hàng bị hủy - hoàn tiền tự động' 
              : `Đơn hoàn thành một phần (còn ${remains}/${order.quantity}) - hoàn tiền tự động`
          });

          if (!rpcError) {
            const refundResult = rpcResult as { success: boolean };
            if (refundResult.success) {
              await updateOrder.mutateAsync({
                id: order.id,
                status: newStatus,
                start_count: result.start_count ? parseInt(result.start_count) : null,
                remains: remains,
                refund_amount: refundAmountUSD,
                refund_at: new Date().toISOString(),
                refund_reason: `Tự động hoàn ${(refundRatio * 100).toFixed(1)}% cho ${newStatus}`,
              });
              
              toast.success(`Trạng thái: ${newStatus}. Đã tự động hoàn ${(refundRatio * 100).toFixed(1)}% tiền`);
              refetch();
              return;
            }
          }
        }
      }
      
      // Normal status update
      await updateOrder.mutateAsync({
        id: order.id,
        status: newStatus,
        start_count: result.start_count ? parseInt(result.start_count) : null,
        remains: remains,
      });
      
      toast.success(`Đã cập nhật trạng thái: ${newStatus}`);
      refetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleRefillOrder = async (order: SmmOrder) => {
    if (!order.external_order_id) {
      toast.error('Đơn hàng chưa có ID từ API');
      return;
    }

    try {
      const result = await apiCall.mutateAsync({ 
        action: 'refill', 
        order: order.external_order_id 
      });
      
      await updateOrder.mutateAsync({
        id: order.id,
        refill_id: result.refill,
        refill_status: 'Pending',
      });
      
      toast.success(`Đã gửi yêu cầu bảo hành! ID: ${result.refill}`);
      refetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleRefundOrder = async () => {
    if (!refundDialog.order) return;

    const order = refundDialog.order;
    // Convert USD charge to VND for refund
    const refundAmountVND = convertToVND(order.charge);

    try {
      // Call atomic RPC to refund balance to user
      const { data: rpcResult, error: rpcError } = await supabase.rpc('refund_smm_order', {
        p_user_id: order.user_id,
        p_order_id: order.id,
        p_refund_amount_vnd: refundAmountVND,
        p_reason: refundReason || 'Hoàn tiền đơn SMM'
      });

      if (rpcError) throw rpcError;

      const result = rpcResult as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể hoàn tiền');
      }

      // Update order status
      await updateOrder.mutateAsync({
        id: order.id,
        status: 'Refunded',
        refund_amount: order.charge,
        refund_at: new Date().toISOString(),
        refund_reason: refundReason,
      });
      
      toast.success('Đã hoàn tiền đơn hàng vào ví người dùng');
      setRefundDialog({ open: false, order: null });
      setRefundReason('');
      refetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleChangeStatus = async () => {
    if (!statusDialog.order || !newStatus) return;

    try {
      await updateOrder.mutateAsync({
        id: statusDialog.order.id,
        status: newStatus,
      });
      
      toast.success('Đã cập nhật trạng thái');
      setStatusDialog({ open: false, order: null });
      setNewStatus('');
      refetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleBulkRefresh = async () => {
    const ordersToRefresh = selectedOrders.length > 0 
      ? filteredOrders.filter(o => selectedOrders.includes(o.id) && o.external_order_id && !['Completed', 'Canceled', 'Refunded'].includes(o.status))
      : filteredOrders.filter(o => o.external_order_id && !['Completed', 'Canceled', 'Refunded'].includes(o.status));

    if (ordersToRefresh.length === 0) {
      toast.info('Không có đơn cần cập nhật');
      return;
    }

    const orderIds = ordersToRefresh.map(o => o.external_order_id).join(',');
    
    try {
      const result = await apiCall.mutateAsync({ 
        action: 'multi_status', 
        orders: orderIds 
      });
      
      let refundCount = 0;
      for (const order of ordersToRefresh) {
        const statusData = result[order.external_order_id!];
        if (statusData && !statusData.error) {
          const newStatus = statusData.status;
          const remains = statusData.remains ? parseInt(statusData.remains) : 0;
          
          // Auto-refund for Partial or Canceled orders
          if ((newStatus === 'Partial' || newStatus === 'Canceled') && 
              order.status !== 'Partial' && order.status !== 'Canceled' && order.status !== 'Refunded') {
            
            let refundRatio = 0;
            if (newStatus === 'Canceled') {
              refundRatio = 1;
            } else if (newStatus === 'Partial' && remains > 0 && order.quantity > 0) {
              refundRatio = remains / order.quantity;
            }
            
            if (refundRatio > 0) {
              const refundAmountUSD = order.charge * refundRatio;
              const refundAmountVND = convertToVND(refundAmountUSD);
              
              const { data: rpcResult, error: rpcError } = await supabase.rpc('refund_smm_order', {
                p_user_id: order.user_id,
                p_order_id: order.id,
                p_refund_amount_vnd: refundAmountVND,
                p_reason: newStatus === 'Canceled' 
                  ? 'Đơn hàng bị hủy - hoàn tiền tự động' 
                  : `Đơn hoàn thành một phần (còn ${remains}/${order.quantity}) - hoàn tiền tự động`
              });

              if (!rpcError) {
                const refundResult = rpcResult as { success: boolean };
                if (refundResult.success) {
                  await updateOrder.mutateAsync({
                    id: order.id,
                    status: newStatus,
                    start_count: statusData.start_count ? parseInt(statusData.start_count) : null,
                    remains: remains,
                    refund_amount: refundAmountUSD,
                    refund_at: new Date().toISOString(),
                    refund_reason: `Tự động hoàn ${(refundRatio * 100).toFixed(1)}% cho ${newStatus}`,
                  });
                  refundCount++;
                  continue;
                }
              }
            }
          }
          
          // Normal update
          await updateOrder.mutateAsync({
            id: order.id,
            status: newStatus,
            start_count: statusData.start_count ? parseInt(statusData.start_count) : null,
            remains: remains,
          });
        }
      }
      
      if (refundCount > 0) {
        toast.success(`Đã cập nhật ${ordersToRefresh.length} đơn hàng, tự động hoàn tiền ${refundCount} đơn`);
      } else {
        toast.success(`Đã cập nhật ${ordersToRefresh.length} đơn hàng`);
      }
      setSelectedOrders([]);
      refetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <h1 className="text-lg md:text-2xl font-bold">Quản lý đơn hàng SMM</h1>

      {/* Stats Cards */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-4">
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-muted-foreground">{stats.pending}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Chờ xử lý</div>
            </div>
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-purple-600">{stats.processing}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Đang chạy</div>
            </div>
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-orange-600">{stats.partial}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Một phần</div>
            </div>
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Hoàn thành</div>
            </div>
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-pink-600">{stats.refunded}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Hoàn tiền</div>
            </div>
            <div className="text-center p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-red-600">{stats.canceled}</div>
              <div className="text-[10px] md:text-sm text-muted-foreground">Đã hủy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order List */}
      <Card>
        <CardHeader className="p-3 md:pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm md:text-lg">Danh Sách Đơn Hàng</CardTitle>
            <div className="flex gap-2">
              {selectedOrders.length > 0 && (
                <Button size="sm" onClick={handleBulkRefresh} className="h-8">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  ({selectedOrders.length})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-8">
                <Filter className="w-3 h-3 mr-1" />
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {/* Filters */}
          {showFilters && (
            <div className="flex flex-col gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã đơn, link..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={serviceFilter || "all"} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Dịch vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Pending">Chờ xử lý</SelectItem>
                    <SelectItem value="Processing">Đang xử lý</SelectItem>
                    <SelectItem value="In progress">Đang chạy</SelectItem>
                    <SelectItem value="Completed">Hoàn thành</SelectItem>
                    <SelectItem value="Partial">Một phần</SelectItem>
                    <SelectItem value="Canceled">Đã hủy</SelectItem>
                    <SelectItem value="Refunded">Hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Checkbox 
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => handleSelectOrder(order.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs">{order.order_number}</span>
                        <button onClick={() => { setStatusDialog({ open: true, order }); setNewStatus(order.status); }}>
                          {getStatusBadge(order.status)}
                        </button>
                      </div>
                      {order.external_order_id && (
                        <div className="text-[10px] text-muted-foreground">API: #{order.external_order_id}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary text-[10px]">
                      {order.service?.name?.slice(0, 40) || 'N/A'}
                    </Badge>
                  </div>
                  <a 
                    href={order.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                  >
                    <span className="truncate">{order.link}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">SL:</span> {order.quantity.toLocaleString()}
                      {order.remains !== null && <span className="text-muted-foreground"> (Còn: {order.remains})</span>}
                    </div>
                    <div className="font-medium">${order.charge.toFixed(4)}</div>
                  </div>
                  <div className="flex gap-1 mt-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleRefreshStatus(order)}
                      disabled={!order.external_order_id}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    {order.service?.has_refill && order.status === 'Completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleRefillOrder(order)}
                        disabled={!order.external_order_id}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    {order.status !== 'Refunded' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setRefundDialog({ open: true, order })}
                      >
                        <DollarSign className="w-3 h-3 text-pink-600" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Không có đơn hàng nào
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono text-sm">{order.order_number}</div>
                        {order.external_order_id && (
                          <div className="text-xs text-muted-foreground">API: #{order.external_order_id}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <Badge variant="outline" className="bg-primary/10 text-primary truncate">
                          {order.service?.name?.slice(0, 30) || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <a 
                        href={order.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="truncate max-w-[120px]">{order.link}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{order.quantity.toLocaleString()}</div>
                        {order.remains !== null && (
                          <div className="text-xs text-muted-foreground">Còn: {order.remains}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>${order.charge.toFixed(4)}</div>
                        {order.refund_amount > 0 && (
                          <div className="text-xs text-pink-600">Hoàn: ${order.refund_amount.toFixed(4)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => { setStatusDialog({ open: true, order }); setNewStatus(order.status); }}>
                        {getStatusBadge(order.status)}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRefreshStatus(order)}
                          disabled={!order.external_order_id}
                          title="Cập nhật trạng thái"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {order.service?.has_refill && order.status === 'Completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRefillOrder(order)}
                            disabled={!order.external_order_id}
                            title="Bảo hành"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {order.status !== 'Refunded' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setRefundDialog({ open: true, order })}
                            title="Hoàn tiền"
                          >
                            <DollarSign className="w-4 h-4 text-pink-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Không có đơn hàng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => setRefundDialog({ open, order: refundDialog.order })}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hoàn tiền đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Mã đơn: {refundDialog.order?.order_number}</p>
              <p className="text-lg font-bold">Số tiền: ${refundDialog.order?.charge.toFixed(4)}</p>
            </div>
            <div className="space-y-2">
              <Label>Lý do hoàn tiền</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Nhập lý do hoàn tiền..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRefundDialog({ open: false, order: null })}>
                Hủy
              </Button>
              <Button onClick={handleRefundOrder} className="bg-pink-600 hover:bg-pink-700">
                Xác nhận hoàn tiền
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ open, order: statusDialog.order })}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi trạng thái đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trạng thái mới</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Chờ xử lý</SelectItem>
                  <SelectItem value="Processing">Đang xử lý</SelectItem>
                  <SelectItem value="In progress">Đang chạy</SelectItem>
                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                  <SelectItem value="Partial">Một phần</SelectItem>
                  <SelectItem value="Canceled">Đã hủy</SelectItem>
                  <SelectItem value="Refunded">Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStatusDialog({ open: false, order: null })}>
                Hủy
              </Button>
              <Button onClick={handleChangeStatus}>
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSmmOrders;
