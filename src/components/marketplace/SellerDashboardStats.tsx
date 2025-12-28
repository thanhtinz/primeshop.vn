import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, TrendingDown, ShoppingBag, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { useSellerOverviewStats, useSellerDailyStats } from '@/hooks/useSellerStats';
import { useSellerEarnedBadges, useCurrentSellerLevel, useSellerLevels } from '@/hooks/useSellerBadges';
import { Seller } from '@/hooks/useMarketplace';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerDashboardStatsProps {
  seller: Seller;
}

export const SellerDashboardStats = ({ seller }: SellerDashboardStatsProps) => {
  const { formatDate } = useDateFormat();
  const { data: stats, isLoading: statsLoading } = useSellerOverviewStats(seller.id);
  const { data: dailyStats } = useSellerDailyStats(seller.id, 30);
  const { data: earnedBadges } = useSellerEarnedBadges(seller.id);
  const { data: currentLevel } = useCurrentSellerLevel(seller.id);
  const { data: allLevels } = useSellerLevels();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const nextLevel = allLevels?.find(l => l.level === (currentLevel?.level || 0) + 1);
  const progressToNextLevel = nextLevel 
    ? Math.min(100, (seller.total_sales / nextLevel.min_sales) * 100)
    : 100;

  const chartData = dailyStats?.map(d => ({
    date: formatDate(d.stat_date, 'dd/MM'),
    revenue: d.revenue,
    orders: d.orders_count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Level & Badges */}
      <div className="flex items-center gap-4 flex-wrap">
        {currentLevel && (
          <Card className="flex-1 min-w-[200px]" style={{ borderColor: currentLevel.color }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: currentLevel.color }}
                >
                  Lv.{currentLevel.level}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{currentLevel.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Phí: {currentLevel.commission_rate}%
                  </p>
                  {nextLevel && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Tiến độ lên cấp</span>
                        <span>{seller.total_sales}/{nextLevel.min_sales} đơn</span>
                      </div>
                      <Progress value={progressToNextLevel} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {earnedBadges && earnedBadges.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {earnedBadges.map(eb => (
              <Badge 
                key={eb.id} 
                style={{ backgroundColor: eb.badge?.badge_color }}
                className="text-white"
              >
                {eb.badge?.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hôm nay</p>
                <p className="text-2xl font-bold">{stats?.revenueToday.toLocaleString('vi-VN')}đ</p>
                <p className="text-xs text-muted-foreground">{stats?.ordersToday} đơn</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tuần này</p>
                <p className="text-2xl font-bold">{stats?.revenueThisWeek.toLocaleString('vi-VN')}đ</p>
                <p className="text-xs text-muted-foreground">{stats?.ordersThisWeek} đơn</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tháng này</p>
                <p className="text-2xl font-bold">{stats?.revenueThisMonth.toLocaleString('vi-VN')}đ</p>
                <p className="text-xs text-muted-foreground">{stats?.ordersThisMonth} đơn</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold">{stats?.totalRevenue.toLocaleString('vi-VN')}đ</p>
                <p className="text-xs text-muted-foreground">{stats?.totalOrders} đơn</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Tỷ lệ hoàn tất</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-green-500">
                {stats?.completionRate.toFixed(1)}%
              </p>
              <Progress value={stats?.completionRate || 0} className="flex-1 h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Tỷ lệ tranh chấp</p>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="flex items-center gap-4">
              <p className={`text-3xl font-bold ${(stats?.disputeRate || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                {stats?.disputeRate.toFixed(1)}%
              </p>
              <Progress 
                value={Math.min(stats?.disputeRate || 0, 100)} 
                className="flex-1 h-2" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalDisputes} tranh chấp / {stats?.totalOrders} đơn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biểu đồ doanh thu 30 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString('vi-VN') + 'đ', 'Doanh thu']}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sold} đã bán • {product.revenue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerDashboardStats;
