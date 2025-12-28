import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Lock, Loader2, Sun, CircleDot, Gift, Search, Eye, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  usePrimeEffects, 
  useUserPrimeEffects, 
  usePurchasePrimeEffect,
  useSetActivePrimeEffect,
  useHasPrimeBoost
} from '@/hooks/usePrimeBoost';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWalletBalance } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const getEffectIcon = (effectType: string) => {
  switch (effectType) {
    case 'particles':
      return Sparkles;
    case 'glow':
      return Sun;
    case 'border':
      return CircleDot;
    default:
      return Sparkles;
  }
};

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

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .neq('user_id', currentUser?.id)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, currentUser?.id]);

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
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>
      
      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden divide-y">
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

const PrimeEffectsShop = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: effects, isLoading } = usePrimeEffects();
  const { data: userEffects, refetch: refetchUserEffects } = useUserPrimeEffects();
  const { hasPrime, hasPrimeBoost } = useHasPrimeBoost();
  const purchaseEffect = usePurchasePrimeEffect();
  const setActiveEffect = useSetActivePrimeEffect();
  const { balance } = useWalletBalance();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Gift state
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<any>(null);
  const [isGifting, setIsGifting] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<any>(null);
  const [giftLoading, setGiftLoading] = useState(false);

  const ownedEffectIds = userEffects?.map((ue: any) => ue.effect_id) || [];
  const activeEffectId = profile?.active_effect_id;

  const handlePurchase = async (effectId: string, price: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    if (!hasPrimeBoost) {
      toast.error('Bạn cần có Prime Boost để mua hiệu ứng');
      return;
    }

    if ((balance || 0) < price) {
      toast.error('Số dư không đủ');
      return;
    }

    setPurchasingId(effectId);
    await purchaseEffect.mutateAsync(effectId);
    setPurchasingId(null);
  };

  const handleSetActive = async (effectId: string) => {
    if (activeEffectId === effectId) {
      await setActiveEffect.mutateAsync(null);
    } else {
      await setActiveEffect.mutateAsync(effectId);
    }
  };

  const openGiftDialog = (effect: any, giftMode: boolean = false) => {
    setSelectedEffect(effect);
    setIsGifting(giftMode);
    setGiftRecipient(null);
    setShowGiftDialog(true);
  };
  
  const isEffectOwned = (effectId: string) => ownedEffectIds.includes(effectId);

  const handleGift = async () => {
    if (!selectedEffect || !giftRecipient || !user) return;
    
    setGiftLoading(true);
    try {
      const price = selectedEffect.price;
      
      // Use atomic RPC function for gift
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'prime_effect',
        p_item_id: selectedEffect.id,
        p_item_name: selectedEffect.name,
        p_price: price,
        p_recipient_user_id: giftRecipient.user_id
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast.error('Số dư không đủ');
        } else if (result.error === 'Already owns this item') {
          toast.error('Người này đã sở hữu hiệu ứng này');
        } else {
          toast.error(result.error || 'Có lỗi xảy ra khi tặng quà');
        }
        setGiftLoading(false);
        return;
      }
      
      toast.success(`Đã tặng ${selectedEffect.name} cho ${giftRecipient.display_name || giftRecipient.username}!`);
      setShowGiftDialog(false);
      setSelectedEffect(null);
      setGiftRecipient(null);
      setIsGifting(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tặng quà');
    }
    setGiftLoading(false);
  };

  const handleBuyOrGift = async () => {
    if (isGifting) {
      await handleGift();
    } else {
      if (selectedEffect) {
        await handlePurchase(selectedEffect.id, selectedEffect.price);
        setShowGiftDialog(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Hiệu Ứng Hồ Sơ</h2>
          <p className="text-muted-foreground">Hình nền trang cá nhân của bạn</p>
        </div>
      </div>

      {/* Prime Boost Required Warning */}
      {!hasPrimeBoost && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-500" />
              <p className="text-sm">
                Bạn cần <span className="font-semibold text-yellow-500">Prime Boost</span> để mua hiệu ứng
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Effects Grid - Same style as Avatar Frames */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {effects?.map((effect, index) => {
          const isOwned = ownedEffectIds.includes(effect.id);
          const isActive = activeEffectId === effect.id;
          const config = effect.effect_config as Record<string, any>;
          
          return (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card 
                className={cn(
                  "relative transition-all duration-300 group overflow-hidden cursor-pointer",
                  isOwned 
                    ? "border-green-500/50 bg-green-500/5 ring-1 ring-green-500/20 hover:shadow-lg" 
                    : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
                  isActive && "ring-2 ring-primary",
                  !hasPrimeBoost && !isOwned && "opacity-60"
                )}
                onClick={() => openGiftDialog(effect)}
              >
                <CardContent className="p-2 sm:p-3">
                  {/* Effect Preview - Profile Background Style */}
                  <div className="aspect-square relative mb-2 flex items-center justify-center overflow-hidden rounded-lg">
                    {/* Background image */}
                    {config.background_url ? (
                      <img 
                        src={config.background_url}
                        alt={effect.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="absolute inset-0"
                        style={{ 
                          background: config.color 
                            ? `linear-gradient(135deg, ${config.color}, ${config.color}80)` 
                            : 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3))'
                        }}
                      />
                    )}
                    
                    {/* Mini profile preview overlay */}
                    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-2">
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background mb-1" />
                      <div className="h-1.5 w-12 bg-background/80 rounded" />
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                      {isOwned ? (
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      ) : (
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Name & Status */}
                  <div className="text-center space-y-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{effect.name}</p>
                    {isOwned ? (
                      <Badge 
                        variant={isActive ? "default" : "secondary"} 
                        className="text-[10px] sm:text-xs"
                      >
                        {isActive ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Đang dùng
                          </>
                        ) : 'Đã sở hữu'}
                      </Badge>
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        {formatPrice(effect.price)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Preview & Purchase Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {selectedEffect?.name}
            </DialogTitle>
            <DialogDescription>
              Xem trước hiệu ứng - {formatPrice(selectedEffect?.price || 0)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Large Effect Preview - Profile Background Style */}
            <div className="rounded-xl overflow-hidden">
              <div className="relative h-40 sm:h-48">
                {/* Background image or gradient */}
                {(selectedEffect?.effect_config as any)?.background_url ? (
                  <img 
                    src={(selectedEffect?.effect_config as any)?.background_url}
                    alt={selectedEffect?.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: (selectedEffect?.effect_config as any)?.color 
                        ? `linear-gradient(135deg, ${(selectedEffect?.effect_config as any)?.color}, ${(selectedEffect?.effect_config as any)?.color}60)` 
                        : 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.4))'
                    }}
                  />
                )}
                
                {/* Mini profile overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-end gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted border-4 border-background overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary">👤</div>
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="h-4 w-24 bg-background/80 rounded mb-1" />
                      <div className="h-2.5 w-16 bg-background/60 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-card p-3 border-t">
                <div className="h-2 w-3/4 bg-muted rounded mb-2" />
                <div className="h-2 w-1/2 bg-muted/50 rounded" />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Hiển thị trên trang cá nhân của bạn
            </p>

            {/* Show owned status or purchase options */}
            {isEffectOwned(selectedEffect?.id) ? (
              <div className="space-y-3">
                <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-600 border-green-500/30">
                  <Check className="h-4 w-4 mr-2" />
                  Bạn đã sở hữu hiệu ứng này
                </Badge>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsGifting(true)}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Tặng cho bạn bè
                </Button>
              </div>
            ) : (
              <>
                {/* Toggle gift mode */}
                <div className="flex gap-2">
                  <Button
                    variant={!isGifting ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setIsGifting(false)}
                    disabled={!hasPrimeBoost}
                  >
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

                {!hasPrimeBoost && !isGifting && (
                  <div className="text-sm text-yellow-600 bg-yellow-500/10 p-3 rounded-lg">
                    Bạn cần có Prime Boost để mua cho mình
                  </div>
                )}
              </>
            )}

            {/* Gift recipient selector */}
            {isGifting && (
              <GiftUserSearch 
                selectedUser={giftRecipient}
                onSelect={setGiftRecipient}
              />
            )}

            {/* Balance info */}
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Số dư:</span>
              <span className="font-medium text-foreground">{formatPrice(balance || 0)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGiftDialog(false)}>
              Đóng
            </Button>
            {(isGifting || (!isEffectOwned(selectedEffect?.id) && hasPrimeBoost)) && (
              <Button 
                onClick={handleBuyOrGift}
                disabled={
                  giftLoading || 
                  purchaseEffect.isPending ||
                  (isGifting && !giftRecipient) ||
                  (balance || 0) < (selectedEffect?.price || 0) ||
                  (!isGifting && isEffectOwned(selectedEffect?.id))
                }
                className={isGifting ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {giftLoading || purchaseEffect.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isGifting ? (
                  <Gift className="h-4 w-4 mr-2" />
                ) : null}
                {isGifting ? 'Xác nhận tặng' : 'Xác nhận mua'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrimeEffectsShop;