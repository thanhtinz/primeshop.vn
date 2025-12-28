import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Star, History, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useActiveEvent,
  useEventSpinPrizes,
  useUserEventPoints,
  useUserSpinHistory,
  useSpinWheel,
  useClaimPrize,
  EventSpinPrize,
  EventSpinHistory,
} from '@/hooks/useEvents';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useConfetti } from '@/hooks/useConfetti';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export default function EventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { formatDate, formatDateTime } = useDateFormat();
  const { data: event, isLoading: eventLoading } = useActiveEvent();
  const { data: prizes } = useEventSpinPrizes(event?.id || '');
  const { data: userPoints } = useUserEventPoints(event?.id || '', user?.id);
  const { data: spinHistory } = useUserSpinHistory(event?.id || '', user?.id);
  const spinWheel = useSpinWheel();
  const claimPrize = useClaimPrize();
  const { firePrizeWin } = useConfetti();
  const { playSuccessSound } = useNotificationSound();

  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    success: boolean;
    message: string;
    prize_type: string | null;
    prize_name: string | null;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState<EventSpinHistory | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const handleSpin = async () => {
    if (!user) {
      toast.error(t('pleaseLoginToSpin'));
      navigate('/auth');
      return;
    }

    if (!event) return;

    if (!userPoints || userPoints.current_balance < event.spin_cost) {
      toast.error(t('notEnoughPoints'));
      return;
    }

    setIsSpinning(true);
    
    try {
      const result = await spinWheel.mutateAsync(event.id);
      
      // Wait for animation
      setTimeout(() => {
        setIsSpinning(false);
        setSpinResult(result);
        setShowResultDialog(true);
        
        // Fire confetti and sound for winning prizes
        if (result.prize_type && result.prize_type !== 'nothing') {
          firePrizeWin();
          playSuccessSound();
        }
      }, 3000);
    } catch (error) {
      setIsSpinning(false);
      toast.error(t('spinError'));
    }
  };

  const handleClaimPrize = async (spin: EventSpinHistory) => {
    if (spin.prize_type === 'product') {
      // Need to get custom fields first
      setClaimingPrize(spin);
    } else {
      // Direct claim for voucher, game_account
      try {
        await claimPrize.mutateAsync({ spinId: spin.id });
        toast.success('Nhận thưởng thành công!');
      } catch (error: any) {
        toast.error(error.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimingPrize) return;

    try {
      await claimPrize.mutateAsync({ 
        spinId: claimingPrize.id, 
        customFields 
      });
      toast.success('Nhận thưởng thành công! Đơn hàng đã được tạo.');
      setClaimingPrize(null);
      setCustomFields({});
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const unclaimedPrizes = spinHistory?.filter(s => !s.claimed && s.prize_type !== 'nothing' && s.prize_type !== 'points') || [];

  if (eventLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">{t('noEventsYet')}</h1>
          <p className="text-muted-foreground mb-4">{t('noEventsRunning')}</p>
          <Button onClick={() => navigate('/')}>{t('goHome')}</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Banner */}
      <div 
        className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-purple-500/20 overflow-hidden"
        style={event.banner_url ? { backgroundImage: `url(${event.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative h-full flex items-end pb-6">
          <div>
            <Badge className="mb-2">{t('onGoing')}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Points Info */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('currentPoints')}</p>
                <p className="text-2xl font-bold">{userPoints?.current_balance || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng điểm đã tích</p>
                <p className="text-2xl font-bold">{userPoints?.total_earned || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Điểm/lượt quay</p>
                <p className="text-2xl font-bold">{event.spin_cost}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unclaimed Prizes Alert */}
        {unclaimedPrizes.length > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Bạn có {unclaimedPrizes.length} phần thưởng chưa nhận!</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('history-tab')?.click()}>
                  Nhận ngay <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="spin">
          <TabsList className="mb-4">
            <TabsTrigger value="spin">
              <Gift className="w-4 h-4 mr-2" /> Vòng quay
            </TabsTrigger>
            <TabsTrigger value="history" id="history-tab">
              <History className="w-4 h-4 mr-2" /> Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spin">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Spin Wheel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Vòng quay may mắn</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <SpinWheel 
                    prizes={prizes || []} 
                    isSpinning={isSpinning}
                  />
                  <Button 
                    size="lg" 
                    className="mt-6"
                    onClick={handleSpin}
                    disabled={isSpinning || !user || (userPoints?.current_balance || 0) < event.spin_cost}
                  >
                    {isSpinning ? 'Đang quay...' : `Quay (${event.spin_cost} điểm)`}
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                        Đăng nhập
                      </Button> để tham gia quay
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Prizes List */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách phần thưởng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prizes?.filter(p => p.is_active && p.prize_type !== 'nothing').map((prize) => (
                      <div key={prize.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        {prize.image_url ? (
                          <img src={prize.image_url} alt={prize.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Gift className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{prize.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {prize.quantity_total === -1 
                              ? 'Không giới hạn'
                              : `Còn ${prize.quantity_remaining}/${prize.quantity_total}`
                            }
                          </p>
                        </div>
                        <Badge variant="outline">{prize.win_rate}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử quay</CardTitle>
              </CardHeader>
              <CardContent>
                {spinHistory && spinHistory.length > 0 ? (
                  <div className="space-y-3">
                    {spinHistory.map((spin) => (
                      <div key={spin.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            spin.prize_type === 'nothing' ? 'bg-muted' : 'bg-primary/10'
                          }`}>
                            {spin.prize_type === 'nothing' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <Gift className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{spin.prize_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(spin.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {spin.claimed ? (
                            <Badge variant="secondary">{t('claimed') || 'Đã nhận'}</Badge>
                          ) : spin.prize_type !== 'nothing' && spin.prize_type !== 'points' ? (
                            <Button size="sm" onClick={() => handleClaimPrize(spin)}>
                              {t('claimReward')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t('noSpinHistory')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">{t('spinResult')}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            {spinResult?.prize_type === 'nothing' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Gift className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">{spinResult.message}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-primary">{spinResult?.message}</p>
                {spinResult?.prize_type && !['points', 'nothing'].includes(spinResult.prize_type) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('goToHistoryToClaimReward') || 'Vào tab "Lịch sử" để nhận thưởng'}
                  </p>
                )}
              </>
            )}
          </div>
          <Button onClick={() => setShowResultDialog(false)}>{t('close')}</Button>
        </DialogContent>
      </Dialog>

      {/* Claim Prize Dialog */}
      <ClaimPrizeDialog 
        spin={claimingPrize}
        onClose={() => {
          setClaimingPrize(null);
          setCustomFields({});
        }}
        customFields={customFields}
        setCustomFields={setCustomFields}
        onSubmit={handleSubmitClaim}
        isPending={claimPrize.isPending}
      />
    </Layout>
  );
}

function SpinWheel({ prizes, isSpinning }: { prizes: EventSpinPrize[]; isSpinning: boolean }) {
  const activePrizes = prizes.filter(p => p.is_active);
  const segments = activePrizes.length || 8;
  const rotation = isSpinning ? 'rotate-[1800deg]' : '';

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  return (
    <div className="relative w-64 h-64">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
      </div>
      
      {/* Wheel */}
      <div 
        className={`w-full h-full rounded-full border-4 border-primary shadow-lg transition-transform duration-[3000ms] ease-out ${rotation}`}
        style={{
          background: `conic-gradient(${activePrizes.map((_, i) => 
            `${colors[i % colors.length]} ${(i / segments) * 100}% ${((i + 1) / segments) * 100}%`
          ).join(', ')})`,
        }}
      >
        {activePrizes.map((prize, i) => {
          const angle = (i / segments) * 360 + (180 / segments);
          return (
            <div
              key={prize.id}
              className="absolute w-full h-full flex items-center justify-center"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <span 
                className="absolute text-[10px] font-medium text-white drop-shadow-md"
                style={{ 
                  transform: `translateY(-80px) rotate(-${angle}deg)`,
                  maxWidth: '60px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {prize.name.length > 12 ? prize.name.slice(0, 12) + '...' : prize.name}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </div>
    </div>
  );
}

function ClaimPrizeDialog({ 
  spin, 
  onClose, 
  customFields, 
  setCustomFields, 
  onSubmit,
  isPending 
}: { 
  spin: EventSpinHistory | null;
  onClose: () => void;
  customFields: Record<string, string>;
  setCustomFields: (fields: Record<string, string>) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { data: products } = useProducts();
  const [productCustomFields, setProductCustomFields] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!spin?.prize_data) return;
      
      const prizeData = spin.prize_data as { prize_reference_id?: string };
      if (!prizeData.prize_reference_id) return;

      const { data } = await supabase
        .from('product_custom_fields')
        .select('*')
        .eq('product_id', prizeData.prize_reference_id)
        .order('sort_order');

      if (data) setProductCustomFields(data);
    };

    if (spin) fetchCustomFields();
  }, [spin]);

  if (!spin) return null;

  const prizeData = spin.prize_data as { prize_reference_id?: string } | null;
  const product = products?.find(p => p.id === prizeData?.prize_reference_id);

  return (
    <Dialog open={!!spin} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhận phần thưởng: {spin.prize_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {product && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.style === 'premium' ? 'Sản phẩm Premium' : 'Nạp game'}
                </p>
              </div>
            </div>
          )}

          {productCustomFields.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Vui lòng điền thông tin để nhận thưởng:
              </p>
              {productCustomFields.map((field) => (
                <div key={field.id}>
                  <Label>
                    {field.field_name}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    value={customFields[field.field_name] || ''}
                    onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                    placeholder={field.placeholder || ''}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Xác nhận nhận thưởng'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
