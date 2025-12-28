import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Link2, Copy, TrendingUp, Users, DollarSign, MousePointer,
  CheckCircle, Clock, XCircle, Award, ChevronRight
} from 'lucide-react';
import { useAffiliate, useRegisterAffiliate, useAffiliateStats, tierConfig } from '@/hooks/useAffiliate';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';

export const AffiliateDashboard = () => {
  const { data: affiliate, isLoading } = useAffiliate();
  const registerAffiliate = useRegisterAffiliate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!affiliate) {
    return <AffiliateRegister onRegister={() => registerAffiliate.mutate()} isLoading={registerAffiliate.isPending} />;
  }

  return <AffiliateStats />;
};

const AffiliateRegister = ({ onRegister, isLoading }: { onRegister: () => void; isLoading: boolean }) => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Link2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Trở thành Affiliate Partner</CardTitle>
        <CardDescription className="text-base">
          Kiếm hoa hồng từ việc giới thiệu sản phẩm đến bạn bè và cộng đồng của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-primary">5%</p>
            <p className="text-sm text-muted-foreground">Hoa hồng khởi điểm</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-primary">15%</p>
            <p className="text-sm text-muted-foreground">Hoa hồng tối đa</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <p className="text-2xl font-bold text-primary">30 ngày</p>
            <p className="text-sm text-muted-foreground">Cookie tracking</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Quyền lợi:</h4>
          <ul className="space-y-2">
            {[
              'Link giới thiệu độc quyền',
              'Dashboard theo dõi chi tiết',
              'Thanh toán tự động vào ví',
              'Nâng cấp tier để tăng hoa hồng'
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={onRegister} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
        </Button>
      </CardContent>
    </Card>
  );
};

const AffiliateStats = () => {
  const { formatPrice } = useCurrency();
  const { formatDateTime } = useDateFormat();
  const { 
    affiliate, 
    clicks, 
    conversions, 
    todayClicks, 
    monthClicks,
    pendingConversions,
    approvedConversions,
    conversionRate,
    isLoading 
  } = useAffiliateStats();

  if (!affiliate || isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const tier = tierConfig[affiliate.tier];
  const nextTier = Object.entries(tierConfig).find(([_, config]) => 
    config.minEarnings > affiliate.total_earnings
  );
  const progressToNext = nextTier 
    ? (affiliate.total_earnings / nextTier[1].minEarnings) * 100 
    : 100;

  const affiliateLink = `${window.location.origin}?ref=${affiliate.affiliate_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success('Đã sao chép link giới thiệu!');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={tier.color}>{tier.name}</Badge>
                <span className="text-sm text-muted-foreground">
                  {affiliate.commission_rate}% hoa hồng
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Mã affiliate</p>
              <p className="text-xl font-bold font-mono">{affiliate.affiliate_code}</p>
            </div>
            <Award className="h-12 w-12 text-primary" />
          </div>

          {/* Affiliate Link */}
          <div className="flex gap-2">
            <Input value={affiliateLink} readOnly className="font-mono text-sm" />
            <Button onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Tier Progress */}
          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Tiến độ lên {tierConfig[nextTier[0] as keyof typeof tierConfig].name}</span>
                <span>{formatPrice(affiliate.total_earnings)} / {formatPrice(nextTier[1].minEarnings)}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng thu nhập</p>
                <p className="text-2xl font-bold">{formatPrice(affiliate.total_earnings)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold">{formatPrice(affiliate.pending_earnings)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng clicks</p>
                <p className="text-2xl font-bold">{affiliate.total_clicks}</p>
              </div>
              <MousePointer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for details */}
      <Tabs defaultValue="conversions">
        <TabsList>
          <TabsTrigger value="conversions">Đơn hàng ({conversions.length})</TabsTrigger>
          <TabsTrigger value="clicks">Clicks ({clicks.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversions">
          <Card>
            <CardContent className="pt-6">
              {conversions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng nào</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {conversions.map((conversion) => (
                      <div key={conversion.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">Đơn hàng #{conversion.order_id?.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(conversion.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-500">+{formatPrice(conversion.commission_amount)}</p>
                          <Badge variant={
                            conversion.status === 'paid' ? 'default' :
                            conversion.status === 'approved' ? 'secondary' :
                            conversion.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {conversion.status === 'paid' ? 'Đã thanh toán' :
                             conversion.status === 'approved' ? 'Đã duyệt' :
                             conversion.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clicks">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Hôm nay</p>
                  <p className="text-2xl font-bold">{todayClicks} clicks</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Tháng này</p>
                  <p className="text-2xl font-bold">{monthClicks} clicks</p>
                </div>
              </div>
              
              {clicks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Chưa có clicks nào</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {clicks.slice(0, 50).map((click) => (
                      <div key={click.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {click.landing_page || '/'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateTime(click.clicked_at, 'HH:mm dd/MM')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateDashboard;
