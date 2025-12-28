import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Package, DollarSign, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { subDays, startOfDay } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDesignStats() {
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const [days, setDays] = useState('30');

  const { data: dailyStats } = useQuery({
    queryKey: ['admin-design-daily-stats', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(days)));
      const { data, error } = await supabase
        .from('design_admin_stats')
        .select('*')
        .gte('stat_date', startDate.toISOString())
        .order('stat_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-design-orders-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select('id, status, amount, created_at, escrow_status');
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ['admin-design-services-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_services')
        .select('id, is_active, price, total_orders, completed_orders');
      if (error) throw error;
      return data;
    },
  });

  const { data: sellers } = useQuery({
    queryKey: ['admin-design-sellers-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_services')
        .select('seller_id')
        .eq('is_active', true);
      if (error) throw error;
      // Count unique sellers
      const uniqueSellers = new Set(data?.map(s => s.seller_id));
      return uniqueSellers.size;
    },
  });

  // Calculate stats
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
  const disputedOrders = orders?.filter(o => o.status === 'disputed').length || 0;
  const totalRevenue = orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const totalServices = services?.length || 0;
  const activeServices = services?.filter(s => s.is_active).length || 0;

  // Chart data
  const chartData = dailyStats?.map(stat => ({
    date: formatDate(stat.stat_date, 'dd/MM'),
    revenue: stat.total_revenue || 0,
    orders: stat.total_orders || 0,
    disputes: stat.disputes_opened || 0,
    fees: stat.platform_fees || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Thống kê Thiết kế</h1>
            <p className="text-muted-foreground">Tổng quan về dịch vụ thiết kế</p>
          </div>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 ngày</SelectItem>
            <SelectItem value="30">30 ngày</SelectItem>
            <SelectItem value="90">90 ngày</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu</p>
                <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn</p>
                <p className="text-xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-xl font-bold">{completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Tranh chấp</p>
                <p className="text-xl font-bold">{disputedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ</p>
                <p className="text-xl font-bold">{activeServices}/{totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="text-xl font-bold">{sellers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu" strokeWidth={2} />
                <Line type="monotone" dataKey="fees" stroke="#6366f1" name="Phí platform" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#3b82f6" name="Đơn hàng" />
                <Bar dataKey="disputes" fill="#ef4444" name="Tranh chấp" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Tỷ lệ hoàn thành</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%` }}
              />
            </div>
            <span className="font-bold text-lg">
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedOrders} đơn hoàn thành / {totalOrders} tổng đơn
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
