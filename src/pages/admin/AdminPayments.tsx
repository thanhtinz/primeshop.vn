import React, { useState, useEffect, useMemo } from 'react';
import { usePayments, useUpdatePayment, useUpdateOrder } from '@/hooks/useOrders';
import { useSiteSettings, useUpdateMultipleSiteSettings } from '@/hooks/useSiteSettings';
import { processAutoDelivery } from '@/hooks/useAutoDelivery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';
import { CreditCard, Settings, Eye, RefreshCw, Search, Loader2, DollarSign, Undo2, Calendar, Download, History, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { exportToExcel, exportToCSV } from '@/lib/exportUtils';

const statusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  refunded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const formatPrice = (price: number, currency: string = 'VND') => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const AdminPayments = () => {
  const { data: payments, isLoading: paymentsLoading, refetch } = usePayments();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSettings = useUpdateMultipleSiteSettings();
  const updatePayment = useUpdatePayment();
  const updateOrder = useUpdateOrder();
  const { formatDate, formatDateTime } = useDateFormat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [processingTopup, setProcessingTopup] = useState<string | null>(null);
  
  // Date filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  const [payosConfig, setPayosConfig] = useState({
    payos_client_id: '',
    payos_api_key: '',
    payos_checksum_key: '',
  });
  
  const [paypalConfig, setPaypalConfig] = useState({
    paypal_enabled: false,
    paypal_mode: 'sandbox',
    paypal_client_id: '',
    paypal_client_secret: '',
  });

  useEffect(() => {
    if (settings) {
      setPayosConfig({
        payos_client_id: settings.payos_client_id || '',
        payos_api_key: settings.payos_api_key || '',
        payos_checksum_key: settings.payos_checksum_key || '',
      });
      setPaypalConfig({
        paypal_enabled: settings.paypal_enabled || false,
        paypal_mode: settings.paypal_mode || 'sandbox',
        paypal_client_id: settings.paypal_client_id || '',
        paypal_client_secret: settings.paypal_client_secret || '',
      });
    }
  }, [settings]);

  const handleSavePayosConfig = async () => {
    try {
      await updateSettings.mutateAsync(payosConfig);
      toast.success('Đã lưu cấu hình PayOS');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

  const handleSavePaypalConfig = async () => {
    try {
      await updateSettings.mutateAsync(paypalConfig);
      toast.success('Đã lưu cấu hình PayPal');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string, payment?: any) => {
    try {
      await updatePayment.mutateAsync({ id: paymentId, status: newStatus });
      
      if (newStatus === 'completed' && payment?.order?.id) {
        const orderId = payment.order.id;
        await updateOrder.mutateAsync({ id: orderId, status: 'PAID' });
        
        const snapshot = payment.order.product_snapshot as any;
        const product = snapshot?.product;
        const style = product?.style;
        
        if ((style === 'game_topup' && product?.external_api === 'naperis') || style === 'game_account') {
          setProcessingTopup(paymentId);
          toast.info('Đang xử lý giao hàng tự động...');
          
          const result = await processAutoDelivery(orderId);
          
          if (result.success) {
            toast.success('Giao hàng tự động thành công!');
          } else {
            toast.error(`Lỗi giao hàng: ${result.message}. Vui lòng xử lý thủ công.`);
          }
          
          setProcessingTopup(null);
        } else {
          await updateOrder.mutateAsync({ id: orderId, status: 'PROCESSING' });
        }
        
        refetch();
      }
      
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      setProcessingTopup(null);
    }
  };

  // Filter payments with date range
  const filterPaymentsByDate = (paymentsList: any[]) => {
    return paymentsList?.filter((payment: any) => {
      const matchesSearch = 
        payment.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.order?.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesProvider = providerFilter === 'all' || payment.payment_provider === providerFilter;
      
      // Date range filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const paymentDate = parseISO(payment.created_at);
        if (dateFrom && dateTo) {
          matchesDate = isWithinInterval(paymentDate, {
            start: startOfDay(dateFrom),
            end: endOfDay(dateTo)
          });
        } else if (dateFrom) {
          matchesDate = paymentDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          matchesDate = paymentDate <= endOfDay(dateTo);
        }
      }
      
      return matchesSearch && matchesStatus && matchesProvider && matchesDate;
    });
  };

  const filteredPayments = filterPaymentsByDate(payments || []);
  const payosPayments = filteredPayments?.filter((p: any) => p.payment_provider === 'payos');
  const paypalPayments = filteredPayments?.filter((p: any) => p.payment_provider === 'paypal');
  const refundedPayments = filteredPayments?.filter((p: any) => p.status === 'refunded');

  // Export functions
  const handleExportExcel = (paymentsList: any[], filename: string, currency: string) => {
    const exportData = paymentsList.map((p: any) => ({
      'Mã thanh toán': p.payment_id || '-',
      'Đơn hàng': p.order?.order_number || '-',
      'Khách hàng': p.order?.customer_email || '-',
      'Tên KH': p.order?.customer_name || '-',
      'Số tiền': p.amount,
      'Tiền tệ': currency,
      'Trạng thái': statusLabels[p.status] || p.status,
      'Nhà cung cấp': p.payment_provider?.toUpperCase(),
      'Ngày tạo': formatDateTime(p.created_at, 'dd/MM/yyyy HH:mm:ss'),
      'Ngày cập nhật': formatDateTime(p.updated_at, 'dd/MM/yyyy HH:mm:ss'),
    }));
    exportToExcel(exportData, filename, 'Thanh toán');
    toast.success('Đã xuất file Excel');
  };

  const handleExportCSV = (paymentsList: any[], filename: string, currency: string) => {
    const exportData = paymentsList.map((p: any) => ({
      'Mã thanh toán': p.payment_id || '-',
      'Đơn hàng': p.order?.order_number || '-',
      'Khách hàng': p.order?.customer_email || '-',
      'Số tiền': p.amount,
      'Tiền tệ': currency,
      'Trạng thái': statusLabels[p.status] || p.status,
      'Ngày tạo': formatDateTime(p.created_at, 'dd/MM/yyyy HH:mm:ss'),
    }));
    exportToCSV(exportData, filename);
    toast.success('Đã xuất file CSV');
  };

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const DateFilterSection = () => (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Calendar className="h-4 w-4" />
            {dateFrom ? formatDate(dateFrom) : 'Từ ngày'}
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
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Calendar className="h-4 w-4" />
            {dateTo ? formatDate(dateTo) : 'Đến ngày'}
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
      
      {(dateFrom || dateTo) && (
        <Button variant="ghost" size="sm" onClick={clearDateFilters}>
          Xóa lọc
        </Button>
      )}
    </div>
  );

  const PaymentList = ({ paymentsList, currency = 'VND' }: { paymentsList: any[], currency?: string }) => (
    <>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {paymentsList?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có dữ liệu thanh toán
            </CardContent>
          </Card>
        ) : (
          paymentsList?.map((payment: any) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium">{payment.order?.order_number || '-'}</p>
                    <p className="text-sm text-muted-foreground truncate">{payment.order?.customer_email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">{formatPrice(payment.amount, currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </p>
                  </div>
                  <Select
                    value={payment.status}
                    onValueChange={(value) => handleUpdateStatus(payment.id, value, payment)}
                    disabled={processingTopup === payment.id}
                  >
                    <SelectTrigger className="w-32 h-8">
                      {processingTopup === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SelectValue>
                          <Badge className={`${statusColors[payment.status] || ''} text-xs`}>
                            {statusLabels[payment.status] || payment.status}
                          </Badge>
                        </SelectValue>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ thanh toán</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="failed">Thất bại</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                      <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã thanh toán</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không có dữ liệu thanh toán
                  </TableCell>
                </TableRow>
              ) : (
                paymentsList?.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.payment_id || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{payment.order?.order_number}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{payment.order?.customer_name || 'N/A'}</div>
                        <div className="text-muted-foreground">{payment.order?.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(payment.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status] || ''}>
                        {statusLabels[payment.status] || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={payment.status}
                          onValueChange={(value) => handleUpdateStatus(payment.id, value, payment)}
                          disabled={processingTopup === payment.id}
                        >
                          <SelectTrigger className="w-32">
                            {processingTopup === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Chờ thanh toán</SelectItem>
                            <SelectItem value="processing">Đang xử lý</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="failed">Thất bại</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                            <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  if (paymentsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Quản lý thanh toán</h1>
      </div>

      <Tabs defaultValue="payos" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="payos" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">PayOS</span>
            <span className="sm:hidden text-xs">PayOS</span>
          </TabsTrigger>
          <TabsTrigger value="paypal" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">PayPal</span>
            <span className="sm:hidden text-xs">PayPal</span>
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Hoàn tiền</span>
            <span className="sm:hidden text-xs">Hoàn</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Cấu hình</span>
            <span className="sm:hidden text-xs">Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        {/* PayOS Payments Tab */}
        <TabsContent value="payos" className="space-y-4">
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DateFilterSection />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportExcel(payosPayments || [], 'payos-payments', 'VND')}
                    disabled={!payosPayments?.length}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportCSV(payosPayments || [], 'payos-payments', 'VND')}
                    disabled={!payosPayments?.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <PaymentList paymentsList={payosPayments || []} currency="VND" />
        </TabsContent>

        {/* PayPal Payments Tab */}
        <TabsContent value="paypal" className="space-y-4">
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm PayPal ID, đơn hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DateFilterSection />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportExcel(paypalPayments || [], 'paypal-payments', 'USD')}
                    disabled={!paypalPayments?.length}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportCSV(paypalPayments || [], 'paypal-payments', 'USD')}
                    disabled={!paypalPayments?.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <PaymentList paymentsList={paypalPayments || []} currency="USD" />
        </TabsContent>

        {/* Refund History Tab */}
        <TabsContent value="refunds" className="space-y-4 mt-4">
          {/* Refund Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-purple-500/20">
                  <Undo2 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
                  <p className="text-xl font-bold">{refundedPayments?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-red-500/20">
                  <CreditCard className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hoàn VND</p>
                  <p className="text-lg font-bold text-red-400">
                    {formatPrice(
                      refundedPayments?.filter((p: any) => p.payment_provider !== 'paypal')
                        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
                      'VND'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-orange-500/20">
                  <DollarSign className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hoàn USD</p>
                  <p className="text-lg font-bold text-orange-400">
                    {formatPrice(
                      refundedPayments?.filter((p: any) => p.payment_provider === 'paypal')
                        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
                      'USD'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm mã, đơn hàng, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9">
                    <SelectValue placeholder="Cổng TT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="payos">PayOS</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="balance">Số dư</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DateFilterSection />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => handleExportExcel(refundedPayments || [], 'refund-history', 'VND')}
                  disabled={!refundedPayments?.length}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {!refundedPayments?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-muted">
                      <Undo2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Chưa có giao dịch hoàn tiền</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              refundedPayments.map((payment: any) => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-xs font-medium">
                          {payment.payment_provider}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(payment.updated_at)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{payment.order?.order_number || '-'}</p>
                          <p className="text-xs text-muted-foreground truncate">{payment.order?.customer_email}</p>
                        </div>
                        <p className="font-semibold text-red-500 shrink-0">
                          -{formatPrice(payment.amount, payment.payment_provider === 'paypal' ? 'USD' : 'VND')}
                        </p>
                      </div>
                      {payment.payment_data?.refund_reason && (
                        <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          <span className="font-medium">Lý do:</span> {payment.payment_data.refund_reason}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Mã thanh toán</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Cổng TT</TableHead>
                    <TableHead>Ngày hoàn</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!refundedPayments?.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-3 rounded-full bg-muted">
                            <Undo2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Chưa có giao dịch hoàn tiền</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    refundedPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.payment_id || '-'}</TableCell>
                        <TableCell className="font-medium">{payment.order?.order_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{payment.order?.customer_name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{payment.order?.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-red-500">
                          -{formatPrice(payment.amount, payment.payment_provider === 'paypal' ? 'USD' : 'VND')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {payment.payment_provider}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(payment.updated_at)}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {payment.payment_data?.refund_reason || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          {/* PayOS Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cấu hình PayOS (VND)
              </CardTitle>
              <CardDescription>
                Cấu hình kết nối với PayOS cho thanh toán VND. Lấy thông tin từ{' '}
                <a href="https://payos.vn" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  PayOS Dashboard
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payos_client_id">Client ID</Label>
                  <Input
                    id="payos_client_id"
                    value={payosConfig.payos_client_id}
                    onChange={(e) => setPayosConfig({ ...payosConfig, payos_client_id: e.target.value })}
                    placeholder="Nhập Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payos_api_key">API Key</Label>
                  <Input
                    id="payos_api_key"
                    type="password"
                    value={payosConfig.payos_api_key}
                    onChange={(e) => setPayosConfig({ ...payosConfig, payos_api_key: e.target.value })}
                    placeholder="Nhập API Key"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payos_checksum_key">Checksum Key</Label>
                <Input
                  id="payos_checksum_key"
                  type="password"
                  value={payosConfig.payos_checksum_key}
                  onChange={(e) => setPayosConfig({ ...payosConfig, payos_checksum_key: e.target.value })}
                  placeholder="Nhập Checksum Key"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Webhook URL:</p>
                <code className="text-xs break-all">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deposit-webhook`}
                </code>
              </div>
              <Button 
                onClick={handleSavePayosConfig} 
                disabled={updateSettings.isPending}
                className="w-full sm:w-auto"
              >
                {updateSettings.isPending ? 'Đang lưu...' : 'Lưu cấu hình PayOS'}
              </Button>
            </CardContent>
          </Card>

          {/* PayPal Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cấu hình PayPal (USD)
              </CardTitle>
              <CardDescription>
                Cấu hình kết nối với PayPal cho thanh toán USD. Lấy thông tin từ{' '}
                <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  PayPal Developer Dashboard
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paypal_enabled"
                  checked={paypalConfig.paypal_enabled}
                  onChange={(e) => setPaypalConfig({ ...paypalConfig, paypal_enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="paypal_enabled">Bật thanh toán PayPal</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paypal_mode">Môi trường</Label>
                <Select 
                  value={paypalConfig.paypal_mode} 
                  onValueChange={(value) => setPaypalConfig({ ...paypalConfig, paypal_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                    <SelectItem value="live">Live (Production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paypal_client_id">Client ID</Label>
                  <Input
                    id="paypal_client_id"
                    value={paypalConfig.paypal_client_id}
                    onChange={(e) => setPaypalConfig({ ...paypalConfig, paypal_client_id: e.target.value })}
                    placeholder="Nhập PayPal Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal_client_secret">Client Secret</Label>
                  <Input
                    id="paypal_client_secret"
                    type="password"
                    value={paypalConfig.paypal_client_secret}
                    onChange={(e) => setPaypalConfig({ ...paypalConfig, paypal_client_secret: e.target.value })}
                    placeholder="Nhập PayPal Client Secret"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">Webhook URL (cấu hình trong PayPal):</p>
                <code className="text-xs break-all block">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-webhook`}
                </code>
                <p className="text-muted-foreground text-xs">
                  Webhook Events cần bật: PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.REFUNDED, PAYMENT.CAPTURE.DENIED
                </p>
              </div>

              <Button 
                onClick={handleSavePaypalConfig} 
                disabled={updateSettings.isPending}
                className="w-full sm:w-auto"
              >
                {updateSettings.isPending ? 'Đang lưu...' : 'Lưu cấu hình PayPal'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Detail Dialog */}
      <PaymentDetailDialog 
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onRefundSuccess={() => {
          setSelectedPayment(null);
          refetch();
        }}
      />
    </div>
  );
};

// Separate component for payment detail dialog with refund functionality
const PaymentDetailDialog = ({ 
  payment, 
  onClose, 
  onRefundSuccess 
}: { 
  payment: any; 
  onClose: () => void; 
  onRefundSuccess: () => void;
}) => {
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const { formatDateTime } = useDateFormat();

  const handleRefund = async () => {
    if (!payment) return;
    
    setIsRefunding(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentId: payment.id,
          reason: refundReason
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message || 'Hoàn tiền thành công');
        onRefundSuccess();
      } else {
        toast.error(data.message || 'Lỗi hoàn tiền');
      }
    } catch (err: any) {
      console.error('Refund error:', err);
      toast.error(err.message || 'Lỗi xử lý hoàn tiền');
    } finally {
      setIsRefunding(false);
      setShowRefundConfirm(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={!!payment} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết thanh toán</DialogTitle>
        </DialogHeader>
        
        {!showRefundConfirm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Mã thanh toán</Label>
                <p className="font-mono">{payment.payment_id || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Đơn hàng</Label>
                <p className="font-medium">{payment.order?.order_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Số tiền</Label>
                <p className="font-semibold text-lg">
                  {formatPrice(
                    payment.amount, 
                    payment.payment_provider === 'paypal' ? 'USD' : 'VND'
                  )}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Trạng thái</Label>
                <Badge className={statusColors[payment.status] || ''}>
                  {statusLabels[payment.status] || payment.status}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Nhà cung cấp</Label>
                <p className="uppercase font-medium">{payment.payment_provider}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ngày tạo</Label>
                <p>{formatDateTime(payment.created_at, 'dd/MM/yyyy HH:mm:ss')}</p>
              </div>
            </div>
            {payment.payment_url && (
              <div>
                <Label className="text-muted-foreground">Link thanh toán</Label>
                <a 
                  href={payment.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {payment.payment_url}
                </a>
              </div>
            )}
            {payment.payment_data && (
              <div>
                <Label className="text-muted-foreground">Dữ liệu thanh toán</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                  {JSON.stringify(payment.payment_data, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Refund button - only show for completed payments */}
            {payment.status === 'completed' && (
              <DialogFooter>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowRefundConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Hoàn tiền
                </Button>
              </DialogFooter>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="font-medium text-destructive mb-2">Xác nhận hoàn tiền</p>
              <p className="text-sm text-muted-foreground">
                Bạn sắp hoàn tiền {formatPrice(payment.amount, payment.payment_provider === 'paypal' ? 'USD' : 'VND')} cho đơn hàng {payment.order?.order_number}.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Lý do hoàn tiền (không bắt buộc)</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Nhập lý do hoàn tiền..."
                rows={3}
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRefundConfirm(false)}
                disabled={isRefunding}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRefund}
                disabled={isRefunding}
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Undo2 className="h-4 w-4 mr-2" />
                    Xác nhận hoàn tiền
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminPayments;
