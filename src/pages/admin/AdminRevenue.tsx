import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar, Download, Loader2 } from 'lucide-react';
import { exportToExcel, formatOrdersForExport } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminRevenue = () => {
  const { data: orders, isLoading } = useOrders();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const { formatPrice } = useCurrency();

  const paidStatuses = ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED'];

  const stats = useMemo(() => {
    if (!orders) return null;


    const paidOrders = orders.filter(o => paidStatuses.includes(o.status));
    const today = new Date();
    const yesterday = subDays(today, 1);
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);

    const todayRevenue = paidOrders
      .filter(o => new Date(o.created_at) >= startOfDay(today))
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const yesterdayRevenue = paidOrders
      .filter(o => {
        const d = new Date(o.created_at);
        return d >= startOfDay(yesterday) && d < startOfDay(today);
      })
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const last7DaysRevenue = paidOrders
      .filter(o => new Date(o.created_at) >= last7Days)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const last30DaysRevenue = paidOrders
      .filter(o => new Date(o.created_at) >= last30Days)
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    const growthPercent = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : 0;

    return {
      todayRevenue,
      yesterdayRevenue,
      last7DaysRevenue,
      last30DaysRevenue,
      totalRevenue,
      growthPercent: Number(growthPercent),
      totalOrders: paidOrders.length,
      averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    if (!orders) return [];

    const paidOrders = orders.filter(o => paidStatuses.includes(o.status));
    const today = new Date();

    let intervals: Date[] = [];
    let formatString = 'dd/MM';

    switch (timeRange) {
      case '7d':
        intervals = eachDayOfInterval({ start: subDays(today, 6), end: today });
        formatString = 'dd/MM';
        break;
      case '30d':
        intervals = eachDayOfInterval({ start: subDays(today, 29), end: today });
        formatString = 'dd/MM';
        break;
      case '90d':
        intervals = eachWeekOfInterval({ start: subDays(today, 89), end: today });
        formatString = "'Tuần' w";
        break;
      case '12m':
        intervals = eachMonthOfInterval({ start: subMonths(today, 11), end: today });
        formatString = 'MM/yyyy';
        break;
    }

    return intervals.map(date => {
      let start: Date, end: Date;

      if (timeRange === '90d') {
        start = startOfWeek(date, { locale: vi });
        end = endOfWeek(date, { locale: vi });
      } else if (timeRange === '12m') {
        start = startOfMonth(date);
        end = endOfMonth(date);
      } else {
        start = startOfDay(date);
        end = endOfDay(date);
      }

      const periodOrders = paidOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && orderDate <= end;
      });

      const revenue = periodOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const orderCount = periodOrders.length;

      return {
        date: format(date, formatString, { locale: vi }),
        revenue,
        orders: orderCount,
      };
    });
  }, [orders, timeRange]);

  const statusDistribution = useMemo(() => {
    if (!orders) return [];

    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      'PENDING_PAYMENT': 'Chờ TT',
      'PAID': 'Đã TT',
      'PROCESSING': 'Đang XL',
      'WAITING_DELIVERY': 'Chờ giao',
      'DELIVERED': 'Đã giao',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'REFUNDED': 'Hoàn tiền',
    };

    return Object.entries(statusCounts)
      .filter(([status]) => statusLabels[status])
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
      }));
  }, [orders]);

  const handleExport = () => {
    if (!orders) return;
    try {
      const paidOrders = orders.filter(o => paidStatuses.includes(o.status));
      exportToExcel(formatOrdersForExport(paidOrders), `doanh-thu-${format(new Date(), 'dd-MM-yyyy')}`);
      toast.success('Đã xuất báo cáo');
    } catch (error) {
      toast.error('Lỗi khi xuất báo cáo');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Thống kê doanh thu</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hôm nay</p>
                <p className="text-xl font-bold">{formatPrice(stats?.todayRevenue || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {(stats?.growthPercent || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${(stats?.growthPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats?.growthPercent}% so với hôm qua
                  </span>
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">7 ngày qua</p>
                <p className="text-xl font-bold">{formatPrice(stats?.last7DaysRevenue || 0)}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30 ngày qua</p>
                <p className="text-xl font-bold">{formatPrice(stats?.last30DaysRevenue || 0)}</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.totalOrders} đơn | TB: {formatPrice(stats?.averageOrderValue || 0)}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <div className="flex flex-wrap gap-3">
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="7d">7 ngày</SelectItem>
            <SelectItem value="30d">30 ngày</SelectItem>
            <SelectItem value="90d">90 ngày</SelectItem>
            <SelectItem value="12m">12 tháng</SelectItem>
          </SelectContent>
        </Select>

        <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="line">Biểu đồ đường</SelectItem>
            <SelectItem value="bar">Biểu đồ cột</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo thời gian</CardTitle>
          <CardDescription>
            {timeRange === '7d' && '7 ngày gần nhất'}
            {timeRange === '30d' && '30 ngày gần nhất'}
            {timeRange === '90d' && '90 ngày gần nhất (theo tuần)'}
            {timeRange === '12m' && '12 tháng gần nhất'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Order Count Chart & Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Số đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value, 'Đơn hàng']} />
                  <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRevenue;
