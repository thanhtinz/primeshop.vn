import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Package, Crown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const UserAnalyticsDashboard = () => {
  const { spendingData, topProducts, vipHistory, isLoading } = useUserAnalytics();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Spending Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Chi tiêu 6 tháng gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatMonth}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [formatPrice(value), 'Chi tiêu']}
                  labelFormatter={formatMonth}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu chi tiêu</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Sản phẩm mua nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.productName} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">{product.count} lần mua</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{formatPrice(product.totalSpent)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng nào</p>
            )}
          </CardContent>
        </Card>

        {/* VIP History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Lịch sử VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vipHistory.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {vipHistory.map((entry, index) => (
                    <div key={index} className="relative pl-10">
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <Badge>{entry.vipLevel}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tổng chi tiêu: {formatPrice(entry.totalSpent)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử VIP</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
