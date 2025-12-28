import React, { useState, useMemo } from 'react';
import { useOrders, useUpdateOrder, DbOrder } from '@/hooks/useOrders';
import { useOrderStatusHistory } from '@/hooks/useOrderStatusHistory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, Package, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, MoreVertical, Download, FileSpreadsheet, History } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToExcel, formatOrdersForExport } from '@/lib/exportUtils';

const statusOptions = [
  { value: 'DRAFT', label: 'Nháp', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { value: 'PAYMENT_FAILED', label: 'Thanh toán thất bại', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { value: 'PROCESSING', label: 'Đang xử lý', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'WAITING_DELIVERY', label: 'Chờ giao hàng', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'DELIVERED', label: 'Đã giao', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'EXPIRED', label: 'Hết hạn', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
];

const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const { data: orders, isLoading, refetch } = useOrders();
  const updateOrder = useUpdateOrder();
  const { formatDate, formatDateTime } = useDateFormat();
  
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [deliveryContent, setDeliveryContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  
  // Status change with note
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ orderId: string; newStatus: string; oldStatus: string } | null>(null);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  
  // Fetch status history when order is selected
  const { data: statusHistory } = useOrderStatusHistory(detailDialogOpen ? selectedOrder?.id || null : null);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' || 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const openStatusChangeDialog = (orderId: string, newStatus: string, oldStatus: string) => {
    setPendingStatusChange({ orderId, newStatus, oldStatus });
    setStatusChangeNote('');
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!pendingStatusChange) return;
    try {
      await updateOrder.mutateAsync({ 
        id: pendingStatusChange.orderId, 
        status: pendingStatusChange.newStatus 
      });
      
      // Log status change with note
      await supabase.from('order_status_history').insert({
        order_id: pendingStatusChange.orderId,
        old_status: pendingStatusChange.oldStatus,
        new_status: pendingStatusChange.newStatus,
        note: statusChangeNote.trim() || null,
        changed_by: (await supabase.auth.getUser()).data.user?.id || null,
      });
      
      toast.success('Đã cập nhật trạng thái đơn hàng');
      setStatusChangeDialogOpen(false);
      setPendingStatusChange(null);
      setStatusChangeNote('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeliverySubmit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder.mutateAsync({ 
        id: selectedOrder.id, 
        delivery_content: deliveryContent,
        status: 'DELIVERED' 
      });
      toast.success('Đã cập nhật nội dung giao hàng');
      setDeliveryDialogOpen(false);
      setSelectedOrder(null);
      setDeliveryContent('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option?.color || 'bg-gray-100'}`}>
        {option?.label || status}
      </span>
    );
  };

  const openDetailDialog = (order: DbOrder) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const openDeliveryDialog = (order: DbOrder) => {
    setSelectedOrder(order);
    setDeliveryContent(order.delivery_content || '');
    setDeliveryDialogOpen(true);
  };

  // Stats
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, paid: 0, delivered: 0 };
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING_PAYMENT').length,
      paid: orders.filter(o => o.status === 'PAID').length,
      delivered: orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    try {
      exportToCSV(formatOrdersForExport(filteredOrders), `don-hang-${formatDate(new Date(), 'dd-MM-yyyy')}`);
      toast.success('Đã xuất file CSV');
    } catch (error) {
      toast.error('Lỗi khi xuất file');
    }
  };

  const handleExportExcel = () => {
    if (!orders || orders.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    try {
      exportToExcel(formatOrdersForExport(filteredOrders), `don-hang-${formatDate(new Date(), 'dd-MM-yyyy')}`, 'Đơn hàng');
      toast.success('Đã xuất file Excel');
    } catch (error) {
      toast.error('Lỗi khi xuất file');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Quản lý đơn hàng</h1>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover">
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" /> Xuất CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Xuất Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Tổng đơn</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Chờ TT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Đã TT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-teal-600">{stats.delivered}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Đã giao</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2 sm:hidden" />
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders - Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {paginatedOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-mono text-sm font-medium">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDetailDialog(order)}>
                      <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeliveryDialog(order)}>
                      <Package className="h-4 w-4 mr-2" /> Nội dung giao hàng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium">{Number(order.total_amount).toLocaleString()}đ</p>
                  {order.discount_amount > 0 && (
                    <p className="text-xs text-green-600">-{Number(order.discount_amount).toLocaleString()}đ</p>
                  )}
                </div>
                <Select 
                  value={order.status} 
                  onValueChange={(value) => openStatusChangeDialog(order.id, value, order.status)}
                >
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${option.color}`}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(order.created_at)}
              </p>
            </CardContent>
          </Card>
        ))}
        {paginatedOrders.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Không tìm thấy đơn hàng phù hợp'
                : 'Chưa có đơn hàng nào'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Orders Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Mã đơn</th>
                  <th className="text-left p-4 font-medium">Khách hàng</th>
                  <th className="text-left p-4 font-medium">Tổng tiền</th>
                  <th className="text-left p-4 font-medium">Trạng thái</th>
                  <th className="text-left p-4 font-medium">Ngày tạo</th>
                  <th className="text-right p-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-4 font-medium font-mono text-sm">
                      {order.order_number}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customer_email}</p>
                        {order.customer_name && (
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{Number(order.total_amount).toLocaleString()}đ</p>
                        {order.discount_amount > 0 && (
                          <p className="text-xs text-green-600">
                            -{Number(order.discount_amount).toLocaleString()}đ
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => openStatusChangeDialog(order.id, value, order.status)}
                      >
                        <SelectTrigger className="w-44 h-8">
                          <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${option.color}`}>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDetailDialog(order)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeliveryDialog(order)}
                          title="Nội dung giao hàng"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Không tìm thấy đơn hàng phù hợp'
                        : 'Chưa có đơn hàng nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} / {filteredOrders.length} đơn hàng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{selectedOrder.customer_email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Họ tên</Label>
                  <p className="font-medium">{selectedOrder.customer_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Số điện thoại</Label>
                  <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Trạng thái</Label>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Tổng tiền</Label>
                  <p className="font-medium">{Number(selectedOrder.total_amount).toLocaleString()}đ</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Giảm giá</Label>
                  <p className="font-medium text-green-600">
                    -{Number(selectedOrder.discount_amount).toLocaleString()}đ
                  </p>
                </div>
              </div>
              
              {selectedOrder.voucher_code && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Mã voucher</Label>
                  <Badge variant="secondary">{selectedOrder.voucher_code}</Badge>
                </div>
              )}

              {selectedOrder.referral_code && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Mã giới thiệu</Label>
                  <Badge variant="outline">{selectedOrder.referral_code}</Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Sản phẩm đã mua</Label>
                {(() => {
                  const snapshot = selectedOrder.product_snapshot as any;
                  const product = snapshot?.product;
                  const selectedPackage = snapshot?.selectedPackage;
                  const customFieldValues = snapshot?.customFieldValues;
                  const quantity = snapshot?.quantity || 1;
                  
                  if (!product) {
                    return (
                      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                        Không có thông tin sản phẩm
                      </div>
                    );
                  }

                  const productImage = product.image_url || product.images?.[0]?.image_url || product.images?.[0];

                  return (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      {/* Product Info */}
                      <div className="flex gap-3">
                        {productImage && (
                          <img 
                            src={productImage} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          {selectedPackage && (
                            <p className="text-sm text-muted-foreground">
                              Gói: {selectedPackage.name} - {Number(selectedPackage.price).toLocaleString()}đ
                            </p>
                          )}
                          {quantity > 1 && (
                            <p className="text-sm text-muted-foreground">Số lượng: {quantity}</p>
                          )}
                        </div>
                      </div>

                      {/* Custom Fields */}
                      {customFieldValues && Object.keys(customFieldValues).length > 0 && (
                        <div className="border-t pt-3 space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Thông tin bổ sung:</p>
                          {Object.entries(customFieldValues).map(([fieldName, value]) => (
                            <div key={fieldName} className="flex gap-2 text-sm">
                              <span className="text-muted-foreground">{fieldName}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {selectedOrder.delivery_content && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Nội dung giao hàng</Label>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <pre className="text-sm whitespace-pre-wrap">{selectedOrder.delivery_content}</pre>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Ghi chú</Label>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status History */}
              {statusHistory && statusHistory.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Lịch sử trạng thái ({statusHistory.length})
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                    {statusHistory.map((history) => {
                      const oldStatus = statusOptions.find(s => s.value === history.old_status);
                      const newStatus = statusOptions.find(s => s.value === history.new_status);
                      return (
                        <div key={history.id} className="p-2.5 bg-background rounded-lg border space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${oldStatus?.color || 'bg-gray-100'}`}>
                                {oldStatus?.label || history.old_status || 'Mới'}
                              </span>
                              <span className="text-muted-foreground text-xs">→</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${newStatus?.color || 'bg-gray-100'}`}>
                                {newStatus?.label || history.new_status}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDateTime(history.changed_at)}
                            </span>
                          </div>
                          {history.note && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <span className="font-medium">Ghi chú:</span> {history.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Ngày tạo: {formatDateTime(selectedOrder.created_at, 'dd/MM/yyyy HH:mm:ss')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nội dung giao hàng - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nội dung giao cho khách (license key, link download, v.v.)</Label>
              <Textarea
                value={deliveryContent}
                onChange={(e) => setDeliveryContent(e.target.value)}
                rows={6}
                placeholder="Nhập nội dung giao hàng..."
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDeliverySubmit} 
                disabled={updateOrder.isPending}
                className="flex-1"
              >
                Lưu & Đánh dấu đã giao
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeliveryDialogOpen(false)}
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thay đổi trạng thái đơn hàng</DialogTitle>
          </DialogHeader>
          {pendingStatusChange && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Từ:</span>
                {getStatusBadge(pendingStatusChange.oldStatus)}
                <span className="text-muted-foreground">→</span>
                {getStatusBadge(pendingStatusChange.newStatus)}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-note">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="status-note"
                  placeholder="Nhập lý do thay đổi trạng thái..."
                  value={statusChangeNote}
                  onChange={(e) => setStatusChangeNote(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleStatusChange}
                  disabled={updateOrder.isPending}
                  className="flex-1"
                >
                  Xác nhận
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStatusChangeDialogOpen(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
