import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, Sparkles, Gift, Star, Loader2, Zap, User, Search, X, Diamond, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  usePrimeBoostPlans, 
  useHasPrimeBoost, 
  usePurchasePrimeBoost,
  usePrimeBoostBenefits 
} from '@/hooks/usePrimeBoost';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWalletBalance } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Gift user search component
const GiftUserSearch = ({ 
  onSelect, 
  selectedUser 
}: { 
  onSelect: (user: any) => void; 
  selectedUser: any;
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('user_id', currentUser?.id)
      .limit(5);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  if (selectedUser) {
    return (
      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
        <img 
          src={selectedUser.avatar_url || '/placeholder.svg'} 
          alt={selectedUser.display_name || selectedUser.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium">{selectedUser.display_name || selectedUser.username}</p>
          <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Đổi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            searchUsers(e.target.value);
          }}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>
      
      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden divide-y max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.user_id}
              onClick={() => {
                onSelect(user);
                setSearch('');
                setResults([]);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <img 
                src={user.avatar_url || '/placeholder.svg'} 
                alt={user.display_name || user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm">{user.display_name || user.username}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Basic features
const BASIC_FEATURES = [
  'Tải lên ảnh avatar tùy chỉnh',
  'Tải lên ảnh bìa/banner',
  'Huy hiệu Basic độc quyền'
];

// Boost features
const BOOST_FEATURES = [
  'Tất cả tính năng của Basic',
  'Mua khung avatar độc quyền',
  'Đổi màu tên hiển thị',
  'Hiệu ứng đặc biệt cho profile',
  'Nhân điểm thưởng khi check-in',
  'Huy hiệu Boost độc quyền'
];

type PlanType = 'basic' | 'boost';

const PrimeBoostShop = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: plans, isLoading: plansLoading } = usePrimeBoostPlans();
  const { data: benefits } = usePrimeBoostBenefits();
  const { hasPrime, hasPrimeBasic, hasPrimeBoost: hasBoost, primeType, subscription, isLoading: primeLoading } = useHasPrimeBoost();
  const purchasePrime = usePurchasePrimeBoost();
  const { balance } = useWalletBalance();
  
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isGifting, setIsGifting] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<any>(null);

  // Separate plans by type
  const basicPlans = plans?.filter(p => (p as any).plan_type === 'basic').sort((a, b) => a.duration_days - b.duration_days) || [];
  const boostPlans = plans?.filter(p => (p as any).plan_type !== 'basic').sort((a, b) => a.duration_days - b.duration_days) || [];

  const handleSelectPlanType = (type: PlanType) => {
    setSelectedPlanType(type);
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowDialog(true);
    setIsGifting(false);
    setGiftRecipient(null);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    const price = selectedPlan.price;
    if ((balance || 0) < price) {
      toast.error('Số dư không đủ. Vui lòng nạp thêm tiền.');
      return;
    }

    if (isGifting && giftRecipient) {
      try {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            balance: (balance || 0) - price 
          })
          .eq('user_id', user.id);
          
        if (balanceError) throw balanceError;

        const expiresAt = addDays(new Date(), selectedPlan.duration_days);

        const { error: subError } = await supabase
          .from('prime_boost_subscriptions')
          .insert({
            user_id: giftRecipient.user_id,
            plan_id: selectedPlan.id,
            amount_paid: price,
            expires_at: expiresAt.toISOString(),
          });
          
        if (subError) throw subError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            has_prime_boost: true,
            prime_expires_at: expiresAt.toISOString(),
          })
          .eq('user_id', giftRecipient.user_id);
          
        if (profileError) throw profileError;

        toast.success(`Đã tặng ${selectedPlan.name} cho ${giftRecipient.display_name || giftRecipient.username}!`);
        setShowDialog(false);
        setSelectedPlan(null);
        setGiftRecipient(null);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi tặng quà');
      }
    } else {
      await purchasePrime.mutateAsync({ planId: selectedPlan.id, amountPaid: price });
      setShowDialog(false);
      setSelectedPlan(null);
    }
  };

  // Calculate discount
  const getDiscount = (plan: any, allPlans: any[]) => {
    const oneMonthPlan = allPlans.find(p => p.duration_days === 30);
    if (!oneMonthPlan || plan.duration_days === 30) return 0;
    const monthsCount = Math.round(plan.duration_days / 30);
    const originalPrice = oneMonthPlan.price * monthsCount;
    return Math.round((1 - plan.price / originalPrice) * 100);
  };

  if (plansLoading || primeLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Crown className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show plan selection when a type is selected
  if (selectedPlanType) {
    const plansToShow = selectedPlanType === 'basic' ? basicPlans : boostPlans;
    const features = selectedPlanType === 'basic' ? BASIC_FEATURES : BOOST_FEATURES;
    const typeLabel = selectedPlanType === 'basic' ? 'Basic' : 'Boost';
    const gradientClass = selectedPlanType === 'basic' 
      ? 'from-blue-500 via-cyan-500 to-blue-600' 
      : 'from-pink-500 via-purple-500 to-pink-600';
    const IconComponent = selectedPlanType === 'basic' ? Zap : Diamond;

    return (
      <div className="space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => setSelectedPlanType(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <IconComponent className={cn(
              "h-6 w-6",
              selectedPlanType === 'basic' ? 'text-blue-500' : 'text-pink-500'
            )} />
            <span className={cn(
              "text-sm font-medium uppercase tracking-wider",
              selectedPlanType === 'basic' ? 'text-blue-500' : 'text-pink-500'
            )}>
              Prime {typeLabel}
            </span>
          </div>
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            gradientClass
          )}>
            CHỌN GÓI CỦA BẠN
          </h1>
        </div>

        {/* Features list */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-3">Quyền lợi của Prime {typeLabel}:</h3>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className={cn(
                    "h-4 w-4",
                    selectedPlanType === 'basic' ? 'text-blue-500' : 'text-pink-500'
                  )} />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Plan options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plansToShow.map((plan) => {
            const discount = getDiscount(plan, plansToShow);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
                    discount > 0 && "border-primary"
                  )}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {discount > 0 && (
                    <div className={cn(
                      "absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white",
                      selectedPlanType === 'basic' ? 'bg-blue-500' : 'bg-pink-500'
                    )}>
                      -{discount}%
                    </div>
                  )}
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={cn(
                      "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                      selectedPlanType === 'basic' ? 'bg-blue-500/10' : 'bg-pink-500/10'
                    )}>
                      <IconComponent className={cn(
                        "h-8 w-8",
                        selectedPlanType === 'basic' ? 'text-blue-500' : 'text-pink-500'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.duration_days} ngày</h3>
                      <p className="text-2xl font-bold mt-2">{formatPrice(plan.price)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(Math.round(plan.price / plan.duration_days))}/ngày
                      </p>
                    </div>
                    <Button 
                      className={cn(
                        "w-full",
                        selectedPlanType === 'basic' 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-pink-500 hover:bg-pink-600'
                      )}
                    >
                      Chọn gói này
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {plansToShow.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có gói nào cho loại này
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Discord Style */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Prime</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          NÂNG CẤP TÀI KHOẢN
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Khám phá nhiều tiện ích và quyền lợi độc quyền
        </p>
      </div>

      {/* Current Status */}
      {hasPrime && subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={cn(
            "border-2",
            primeType === 'basic' 
              ? "border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" 
              : "border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10"
          )}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={cn(
                  "p-3 rounded-full",
                  primeType === 'basic' ? "bg-blue-500/20" : "bg-pink-500/20"
                )}>
                  {primeType === 'basic' ? (
                    <Zap className="h-6 w-6 text-blue-500" />
                  ) : (
                    <Diamond className="h-6 w-6 text-pink-500" />
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="font-semibold">
                    Bạn đang là thành viên Prime {primeType === 'basic' ? 'Basic' : 'Boost'}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hết hạn: {format(new Date(subscription.expires_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
                <Badge className={cn(
                  "text-white",
                  primeType === 'basic' ? "bg-blue-500" : "bg-pink-500"
                )}>
                  {primeType === 'basic' ? (
                    <Zap className="h-3 w-3 mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Đang hoạt động
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Type Cards - Discord Nitro Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Boost Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => handleSelectPlanType('boost')}
        >
          <Card className="relative overflow-hidden border-0 h-full">
            {/* Gradient Background - Pink */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/90 via-purple-500/90 to-pink-600/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            
            {/* Decorative shapes */}
            <div className="absolute top-10 right-10 w-20 h-12 bg-white/10 rounded-full blur-md" />
            <div className="absolute bottom-20 right-20 w-16 h-10 bg-white/10 rounded-full blur-md" />
            
            <CardContent className="relative p-6 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 mb-2">
                    Phổ biến nhất
                  </Badge>
                  <h3 className="text-2xl font-black tracking-tight mb-1">PRIME BOOST</h3>
                  <p className="text-white/80 text-sm">Trải nghiệm đầy đủ nhất</p>
                </div>
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Diamond className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2 mb-6">
                {BOOST_FEATURES.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
                <li className="text-sm text-white/70">+ nhiều quyền lợi khác...</li>
              </ul>

              <Button 
                className="w-full bg-white text-pink-600 hover:bg-white/90 font-semibold"
              >
                Xem các gói Boost
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Basic Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => handleSelectPlanType('basic')}
        >
          <Card className="relative overflow-hidden border-0 h-full">
            {/* Gradient Background - Blue */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 via-cyan-500/90 to-blue-600/90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            
            {/* Decorative shapes */}
            <div className="absolute top-10 right-10 w-16 h-10 bg-white/10 rounded-full blur-md" />
            <div className="absolute bottom-20 right-16 w-12 h-8 bg-white/10 rounded-full blur-md" />
            
            <CardContent className="relative p-6 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 mb-2">
                    Khởi đầu
                  </Badge>
                  <h3 className="text-2xl font-black tracking-tight mb-1">PRIME BASIC</h3>
                  <p className="text-white/80 text-sm">Dành cho người mới bắt đầu</p>
                </div>
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2 mb-6">
                {BASIC_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold"
              >
                Xem các gói Basic
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-center mb-6">So sánh các gói</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Tính năng</th>
                  <th className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-blue-500">Basic</span>
                    </div>
                  </th>
                  <th className="p-3 text-center bg-pink-500/5">
                    <div className="flex items-center justify-center gap-2">
                      <Diamond className="h-4 w-4 text-pink-500" />
                      <span className="font-bold text-pink-500">Boost</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 text-sm">Tải ảnh avatar tùy chỉnh</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Tải ảnh bìa/banner</td>
                  <td className="p-3 text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Huy hiệu độc quyền</td>
                  <td className="p-3 text-center"><Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Zap className="h-3 w-3 mr-1" />Basic</Badge></td>
                  <td className="p-3 text-center bg-pink-500/5"><Badge className="bg-pink-500/10 text-pink-500 border-pink-500/30"><Diamond className="h-3 w-3 mr-1" />Boost</Badge></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Mua khung avatar</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Đổi màu tên</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Hiệu ứng profile</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-sm">Nhân điểm check-in</td>
                  <td className="p-3 text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></td>
                  <td className="p-3 text-center bg-pink-500/5"><Check className="h-4 w-4 mx-auto text-green-500" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(selectedPlan as any)?.plan_type === 'basic' ? (
                <Zap className="h-5 w-5 text-blue-500" />
              ) : (
                <Diamond className="h-5 w-5 text-pink-500" />
              )}
              {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.duration_days} ngày - {formatPrice(selectedPlan?.price || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Buy for self / Gift toggle */}
            {!hasPrime && (
              <>
                <div className="flex gap-2">
                  <Button
                    variant={!isGifting ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => {
                      setIsGifting(false);
                      setGiftRecipient(null);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mua cho mình
                  </Button>
                  <Button
                    variant={isGifting ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setIsGifting(true)}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Tặng bạn bè
                  </Button>
                </div>
              </>
            )}

            {/* Gift recipient search */}
            {isGifting && (
              <div className="space-y-2">
                <Label>Người nhận</Label>
                <GiftUserSearch 
                  onSelect={setGiftRecipient} 
                  selectedUser={giftRecipient}
                />
              </div>
            )}

            {/* Balance info */}
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Số dư:</span>
              <span className="font-medium text-foreground">{formatPrice(balance || 0)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Đóng
            </Button>
            {(isGifting || !hasPrime) && (
              <Button
                onClick={handlePurchase}
                disabled={purchasePrime.isPending || (isGifting && !giftRecipient)}
                className={(selectedPlan as any)?.plan_type === 'basic' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-pink-500 hover:bg-pink-600'
                }
              >
                {purchasePrime.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isGifting ? (
                  <Gift className="h-4 w-4 mr-2" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                {isGifting ? 'Tặng ngay' : 'Mua ngay'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrimeBoostShop;