import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Eye, MessageSquare, DollarSign, Calendar } from 'lucide-react';
import { useDesignSellerDailyStats, useDesignSellerMatchProfile, useUpdateDesignMatchProfile } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDateFormat } from '@/hooks/useDateFormat';

export default function SellerDesignStatsPage() {
  const { seller } = useOutletContext<any>();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const [days, setDays] = useState(30);
  const { data: dailyStats, isLoading } = useDesignSellerDailyStats(seller?.id, days);
  const { data: matchProfile } = useDesignSellerMatchProfile(seller?.id);
  const updateMatchProfile = useUpdateDesignMatchProfile();
  
  const [maxConcurrent, setMaxConcurrent] = useState(matchProfile?.max_concurrent_orders?.toString() || '5');
  const [isAvailable, setIsAvailable] = useState(matchProfile?.is_available ?? true);
  
  // Calculate totals
  const totals = dailyStats?.reduce((acc, stat) => ({
    orders_received: acc.orders_received + stat.orders_received,
    orders_completed: acc.orders_completed + stat.orders_completed,
    orders_cancelled: acc.orders_cancelled + stat.orders_cancelled,
    orders_disputed: acc.orders_disputed + stat.orders_disputed,
    revenue: acc.revenue + stat.revenue,
    on_time_count: acc.on_time_count + stat.on_time_count,
    late_count: acc.late_count + stat.late_count,
    profile_views: acc.profile_views + stat.profile_views,
    messages_sent: acc.messages_sent + stat.messages_sent,
  }), {
    orders_received: 0,
    orders_completed: 0,
    orders_cancelled: 0,
    orders_disputed: 0,
    revenue: 0,
    on_time_count: 0,
    late_count: 0,
    profile_views: 0,
    messages_sent: 0,
  }) || {
    orders_received: 0,
    orders_completed: 0,
    orders_cancelled: 0,
    orders_disputed: 0,
    revenue: 0,
    on_time_count: 0,
    late_count: 0,
    profile_views: 0,
    messages_sent: 0,
  };
  
  const onTimeRate = totals.orders_completed > 0 
    ? ((totals.on_time_count / totals.orders_completed) * 100).toFixed(1) 
    : '100';
  
  const handleUpdateMatchProfile = async () => {
    if (!seller) return;
    await updateMatchProfile.mutateAsync({
      sellerId: seller.id,
      is_available: isAvailable,
      max_concurrent_orders: parseInt(maxConcurrent) || 5,
    });
  };
  
  if (!seller) return null;
  
  // Format data for charts
  const chartData = dailyStats?.map(stat => ({
    date: formatDate(stat.stat_date, 'dd/MM'),
    revenue: stat.revenue,
    orders: stat.orders_completed,
    views: stat.profile_views,
  })) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Thống kê Chi tiết
          </h1>
          <p className="text-muted-foreground">Xem hiệu suất dịch vụ thiết kế của bạn</p>
        </div>
        
        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 ngày</SelectItem>
            <SelectItem value="30">30 ngày</SelectItem>
            <SelectItem value="90">90 ngày</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.revenue)}</div>
            <p className="text-xs text-muted-foreground">{days} ngày qua</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.orders_completed}</div>
            <p className="text-xs text-muted-foreground">/ {totals.orders_received} đơn nhận</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ đúng hạn</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimeRate}%</div>
            <p className="text-xs text-muted-foreground">{totals.on_time_count} đúng hạn / {totals.late_count} trễ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt xem</CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.profile_views}</div>
            <p className="text-xs text-muted-foreground">{days} ngày qua</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatPrice(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Đơn hoàn thành theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Auto Match Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cài đặt Auto-Match
          </CardTitle>
          <CardDescription>
            Cho phép hệ thống tự động gán đơn hàng phù hợp với bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sẵn sàng nhận đơn</Label>
              <p className="text-sm text-muted-foreground">Bật để nhận đơn auto-match từ buyer</p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          
          <div className="space-y-2">
            <Label>Số đơn đồng thời tối đa</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={maxConcurrent}
                onChange={(e) => setMaxConcurrent(e.target.value)}
                className="w-24"
                min={1}
                max={20}
              />
              <Button onClick={handleUpdateMatchProfile} disabled={updateMatchProfile.isPending}>
                Lưu
              </Button>
            </div>
          </div>
          
          {matchProfile && (
            <div className="grid gap-2 md:grid-cols-4 pt-4 border-t">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{matchProfile.on_time_rate?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Tỷ lệ đúng hạn</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{matchProfile.acceptance_rate?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Tỷ lệ chấp nhận</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{matchProfile.avg_response_time_hours?.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">Thời gian phản hồi</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{matchProfile.priority_score?.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Điểm ưu tiên</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
