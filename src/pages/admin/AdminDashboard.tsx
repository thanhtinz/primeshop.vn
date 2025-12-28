import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrders, usePayments } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useVouchers } from '@/hooks/useVouchers';
import { useReferralCodes, useRewardRequests } from '@/hooks/useReferrals';
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Ticket, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  FolderOpen,
  UserPlus,
  Eye,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useDateFormat } from '@/hooks/useDateFormat';

const AdminDashboard = () => {
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: payments } = usePayments();
  const { data: products } = useProducts(false);
  const { data: vouchers } = useVouchers();
  const { data: referrals } = useReferralCodes();
  const { data: categories } = useCategories(false);
  const { data: rewardRequests } = useRewardRequests();

  // Calculate stats
  const paidOrders = orders?.filter(o => ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status)) || [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingOrders = orders?.filter(o => o.status === 'PENDING_PAYMENT').length || 0;
  const processingOrders = orders?.filter(o => ['PAID', 'PROCESSING', 'WAITING_DELIVERY'].includes(o.status)).length || 0;
  
  // Recent stats (last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentOrders = orders?.filter(o => isAfter(new Date(o.created_at), sevenDaysAgo)) || [];
  const recentRevenue = recentOrders
    .filter(o => ['PAID', 'PROCESSING', 'WAITING_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  
  // Pending items that need attention
  const pendingRewards = rewardRequests?.filter(r => r.status === 'pending').length || 0;
  const activeVouchers = vouchers?.filter(v => v.is_active).length || 0;
  const activeProducts = products?.filter(p => p.is_active).length || 0;

  // Calculate revenue by payment provider
  const completedPayments = payments?.filter((p: any) => p.status === 'completed') || [];
  const payosRevenue = completedPayments
    .filter((p: any) => p.payment_provider === 'payos')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const paypalRevenue = completedPayments
    .filter((p: any) => p.payment_provider === 'paypal')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balanceRevenue = completedPayments
    .filter((p: any) => p.payment_provider === 'balance')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const revenueByProvider = [
    { name: 'PayOS (VND)', value: payosRevenue, color: '#3B82F6' },
    { name: 'PayPal (USD)', value: paypalRevenue, color: '#0070BA' },
    { name: 'Balance', value: balanceRevenue, color: '#10B981' },
  ].filter(item => item.value > 0);

  // Revenue by day for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'dd/MM');
    
    const dayPayments = completedPayments.filter((p: any) => 
      format(new Date(p.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    const payos = dayPayments
      .filter((p: any) => p.payment_provider === 'payos')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const paypal = dayPayments
      .filter((p: any) => p.payment_provider === 'paypal')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const balance = dayPayments
      .filter((p: any) => p.payment_provider === 'balance')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    return { date: dateStr, PayOS: payos, PayPal: paypal, Balance: balance };
  });

  const mainStats = [
    {
      title: 'Tổng doanh thu',
      value: totalRevenue.toLocaleString() + 'đ',
      description: `7 ngày: ${recentRevenue.toLocaleString()}đ`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Đơn hàng',
      value: orders?.length || 0,
      description: `${processingOrders} đang xử lý`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      link: '/admin/orders',
    },
    {
      title: 'Sản phẩm',
      value: `${activeProducts}/${products?.length || 0}`,
      description: 'Đang hoạt động',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      link: '/admin/products',
    },
    {
      title: 'Mã giới thiệu',
      value: referrals?.length || 0,
      description: `${pendingRewards} yêu cầu thưởng`,
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
      link: '/admin/referrals',
    },
  ];

  const quickStats = [
    { title: 'Danh mục', value: categories?.length || 0, icon: FolderOpen, link: '/admin/categories' },
    { title: 'Vouchers', value: `${activeVouchers}/${vouchers?.length || 0}`, icon: Ticket, link: '/admin/vouchers' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_PAYMENT':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'PROCESSING':
      case 'WAITING_DELIVERY':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'Nháp',
      'PENDING_PAYMENT': 'Chờ TT',
      'PAID': 'Đã TT',
      'PROCESSING': 'Đang XL',
      'WAITING_DELIVERY': 'Chờ giao',
      'DELIVERED': 'Đã giao',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'PAYMENT_FAILED': 'TT thất bại',
    };
    return labels[status] || status;
  };

  const recentOrdersList = orders?.slice(0, 8) || [];

  if (ordersLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cập nhật: {format(new Date(), 'HH:mm dd/MM/yyyy')}
        </p>
      </div>
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {mainStats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
              </div>
              {stat.link && (
                <Link to={stat.link} className="absolute inset-0" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(pendingOrders > 0 || pendingRewards > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingOrders > 0 && (
            <Link to="/admin/orders?status=PENDING_PAYMENT">
              <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50 hover:bg-yellow-100/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {pendingOrders} đơn chờ thanh toán
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Cần theo dõi
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-yellow-600" />
                </CardContent>
              </Card>
            </Link>
          )}
          {pendingRewards > 0 && (
            <Link to="/admin/referrals">
              <Card className="border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-950/50 hover:bg-pink-100/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium text-pink-800 dark:text-pink-200">
                        {pendingRewards} yêu cầu nhận thưởng
                      </p>
                      <p className="text-xs text-pink-700 dark:text-pink-300">
                        Cần duyệt
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-pink-600" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base md:text-lg">Đơn hàng gần đây</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {recentOrdersList.length > 0 
                ? `${recentOrdersList.length} đơn hàng mới nhất` 
                : 'Chưa có đơn hàng'}
            </CardDescription>
          </div>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="h-8">
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Xem tất cả</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {recentOrdersList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Chưa có đơn hàng nào</p>
          ) : (
            <div className="divide-y">
              {recentOrdersList.map((order) => (
                <Link 
                  key={order.id} 
                  to="/admin/orders"
                  className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(order.status)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-none">
                        {order.customer_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-sm">{Number(order.total_amount).toLocaleString()}đ</p>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Payment Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Doanh thu theo cổng thanh toán
            </CardTitle>
            <CardDescription>Tổng doanh thu từ mỗi cổng thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByProvider.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByProvider}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueByProvider.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()}đ`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                <p className="font-semibold text-blue-600">{payosRevenue.toLocaleString()}đ</p>
                <p className="text-muted-foreground">PayOS</p>
              </div>
              <div className="p-2 rounded bg-[#0070BA]/20">
                <p className="font-semibold text-[#0070BA]">${paypalRevenue.toLocaleString()}</p>
                <p className="text-muted-foreground">PayPal</p>
              </div>
              <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-900/30">
                <p className="font-semibold text-emerald-600">{balanceRevenue.toLocaleString()}đ</p>
                <p className="text-muted-foreground">Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Doanh thu 7 ngày qua
            </CardTitle>
            <CardDescription>Phân bổ theo cổng thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}${name === 'PayPal' ? '$' : 'đ'}`, 
                      name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="PayOS" fill="#3B82F6" name="PayOS" />
                  <Bar dataKey="PayPal" fill="#0070BA" name="PayPal" />
                  <Bar dataKey="Balance" fill="#10B981" name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tổng quan đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { status: 'PENDING_PAYMENT', label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700' },
              { status: 'PAID', label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-700' },
              { status: 'PROCESSING', label: 'Đang xử lý', color: 'bg-purple-100 text-purple-700' },
              { status: 'DELIVERED', label: 'Đã giao', color: 'bg-green-100 text-green-700' },
              { status: 'COMPLETED', label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' },
            ].map((item) => {
              const count = orders?.filter(o => o.status === item.status).length || 0;
              return (
                <div key={item.status} className={`p-3 rounded-lg ${item.color}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs">{item.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;