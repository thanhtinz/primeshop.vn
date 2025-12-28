import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, DollarSign, Award, Star, Crown, Gem, Medal } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ReferralStats {
  code: string;
  tier: string;
  commission_rate: number;
  lifetime_earnings: number;
  total_referrals: number;
  total_credits: number;
  available_credits: number;
}

const tierConfig: Record<string, { name: string; icon: React.ReactNode; color: string; nextTier: string | null; threshold: number }> = {
  bronze: { 
    name: 'Bronze', 
    icon: <Medal className="h-5 w-5" />, 
    color: 'bg-amber-600',
    nextTier: 'silver',
    threshold: 0
  },
  silver: { 
    name: 'Silver', 
    icon: <Star className="h-5 w-5" />, 
    color: 'bg-gray-400',
    nextTier: 'gold',
    threshold: 5000000
  },
  gold: { 
    name: 'Gold', 
    icon: <Crown className="h-5 w-5" />, 
    color: 'bg-yellow-500',
    nextTier: 'diamond',
    threshold: 20000000
  },
  diamond: { 
    name: 'Diamond', 
    icon: <Gem className="h-5 w-5" />, 
    color: 'bg-cyan-500',
    nextTier: null,
    threshold: 100000000
  }
};

export const ReferralTierProgress = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-stats', profile?.email],
    queryFn: async () => {
      if (!profile?.email) return null;
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code, tier, commission_rate, lifetime_earnings, total_referrals, total_credits, available_credits')
        .eq('email', profile.email)
        .single();

      if (error) throw error;
      return data as ReferralStats;
    },
    enabled: !!profile?.email
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const currentTier = tierConfig[stats.tier] || tierConfig.bronze;
  const nextTierKey = currentTier.nextTier;
  const nextTier = nextTierKey ? tierConfig[nextTierKey] : null;
  
  const progressToNext = nextTier 
    ? Math.min(100, (stats.lifetime_earnings / nextTier.threshold) * 100)
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Cấp độ Affiliate
        </CardTitle>
        <CardDescription>
          Tăng hạng để nhận hoa hồng cao hơn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${currentTier.color} text-white flex items-center justify-center`}>
            {currentTier.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{currentTier.name}</h3>
              <Badge variant="secondary">{stats.commission_rate}% hoa hồng</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Tổng thu nhập: {formatPrice(stats.lifetime_earnings)}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiến độ lên {nextTier.name}</span>
              <span className="font-medium">{formatPrice(stats.lifetime_earnings)} / {formatPrice(nextTier.threshold)}</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Còn {formatPrice(nextTier.threshold - stats.lifetime_earnings)} để lên hạng {nextTier.name} ({tierConfig[nextTierKey!].name} được {(stats.commission_rate + 2).toFixed(0)}% hoa hồng)
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              Người giới thiệu
            </div>
            <p className="text-xl font-bold">{stats.total_referrals}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Số dư khả dụng
            </div>
            <p className="text-xl font-bold text-primary">{formatPrice(stats.available_credits)}</p>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Quyền lợi theo cấp độ
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Bronze: 5% hoa hồng</li>
            <li>• Silver: 7% hoa hồng (từ 5 triệu)</li>
            <li>• Gold: 10% hoa hồng (từ 20 triệu)</li>
            <li>• Diamond: 15% hoa hồng (từ 100 triệu)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
