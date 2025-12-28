import { useState } from 'react';
import { motion } from 'framer-motion';
import { Frame, Check, Loader2, ShoppingCart, Sparkles, Lock, Gift, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvatarFrames, useUserAvatarFrames, usePurchaseFrame, useSetActiveFrame } from '@/hooks/useAvatarFrames';
import { useHasPrimeBoost } from '@/hooks/usePrimeBoost';
import { useWalletBalance } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  const { t } = useLanguage();

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
          {t('change')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchUsers')}
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

export const AvatarFrameShop = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { data: frames, isLoading } = useAvatarFrames();
  const { data: userFrames, refetch: refetchUserFrames } = useUserAvatarFrames();
  const { hasPrimeBoost } = useHasPrimeBoost();
  const purchaseFrame = usePurchaseFrame();
  const setActiveFrame = useSetActiveFrame();
  const { balance } = useWalletBalance();

  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [isGifting, setIsGifting] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<any>(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const ownedFrameIds = userFrames?.map((uf: any) => uf.frame_id) || [];
  const activeFrameId = profile?.avatar_frame_id;

  const isFrameOwned = (frameId: string) => ownedFrameIds.includes(frameId);

  const handlePurchase = async (frameId: string, price: number) => {
    if (!user) {
      toast.error(t('pleaseLogin'));
      return;
    }

    if (!hasPrimeBoost) {
      toast.error(t('needPrimeBoostForFrames'));
      return;
    }

    if ((balance || 0) < price) {
      toast.error(t('insufficientBalance'));
      return;
    }

    setPurchasingId(frameId);
    const frame = frames?.find(f => f.id === frameId);
    if (frame) {
      await purchaseFrame.mutateAsync(frame);
    }
    setPurchasingId(null);
  };

  const handleSetActive = async (frameId: string) => {
    if (activeFrameId === frameId) {
      await setActiveFrame.mutateAsync(null);
    } else {
      await setActiveFrame.mutateAsync(frameId);
    }
  };

  const openGiftDialog = (frame: any, giftMode: boolean = false) => {
    setSelectedFrame(frame);
    setIsGifting(giftMode);
    setGiftRecipient(null);
    setShowGiftDialog(true);
  };

  const handleGift = async () => {
    if (!selectedFrame || !giftRecipient || !user) return;
    
    setGiftLoading(true);
    try {
      const price = selectedFrame.price;
      
      // Use atomic RPC function for gift
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'avatar_frame',
        p_item_id: selectedFrame.id,
        p_item_name: selectedFrame.name,
        p_price: price,
        p_recipient_user_id: giftRecipient.user_id
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast.error(t('insufficientBalance'));
        } else if (result.error === 'Already owns this item') {
          toast.error(t('recipientAlreadyOwnsFrame'));
        } else {
          toast.error(result.error || t('giftError'));
        }
        setGiftLoading(false);
        return;
      }
      
      toast.success(`${t('giftedTo')} ${giftRecipient.display_name || giftRecipient.username}!`);
      setShowGiftDialog(false);
      setSelectedFrame(null);
      setGiftRecipient(null);
      setIsGifting(false);
    } catch (error) {
      toast.error(t('giftError'));
    }
    setGiftLoading(false);
  };

  const handleBuyOrGift = async () => {
    if (isGifting) {
      await handleGift();
    } else {
      if (selectedFrame) {
        await handlePurchase(selectedFrame.id, selectedFrame.price);
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
        <div className="p-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
          <Frame className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t('avatarFrameShop')}</h2>
          <p className="text-muted-foreground">{t('avatarFrameShopDesc')}</p>
        </div>
      </div>

      {/* Prime Boost Required Warning */}
      {!hasPrimeBoost && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-500" />
              <p className="text-sm">
                {t('needPrimeBoostPrefix')} <span className="font-semibold text-yellow-500">Prime Boost</span> {t('needPrimeBoostSuffixFrames')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frames Grid - Same style as NameColorShop */}
      {frames && frames.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {frames.map((frame, index) => {
            const isOwned = isFrameOwned(frame.id);
            const isActive = activeFrameId === frame.id;
            
            return (
              <motion.div
                key={frame.id}
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
                  onClick={() => openGiftDialog(frame)}
                >
                  <CardContent className="p-2 sm:p-3">
                    {/* Frame Preview */}
                    <div className="aspect-square relative mb-2 flex items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                      <img
                        src={frame.image_url}
                        alt={frame.name}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="text-center">
                      <p className="font-medium text-xs sm:text-sm truncate">{frame.name}</p>
                      {isOwned ? (
                        <Badge 
                          variant={isActive ? "default" : "secondary"} 
                          className="mt-1 text-[10px] sm:text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(frame.id);
                          }}
                        >
                          {isActive ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              {t('itemEquipped')}
                            </>
                          ) : (
                            t('itemOwned')
                          )}
                        </Badge>
                      ) : (
                        <p className="text-xs sm:text-sm font-bold text-primary mt-1">
                          {frame.price > 0 ? formatPrice(frame.price) : t('free')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Frame className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('noAvatarFrames')}</p>
        </div>
      )}

      {/* Purchase/Gift Dialog */}
      <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              {selectedFrame?.name}
            </DialogTitle>
            <DialogDescription>
              Xem trước khung - {formatPrice(selectedFrame?.price || 0)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFrame && (
            <div className="space-y-4 py-4">
              {/* Large Frame Preview - Profile Style */}
              <div className="rounded-xl overflow-hidden">
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  {/* Frame preview with avatar */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                    <img 
                      src={selectedFrame.image_url}
                      alt={selectedFrame.name}
                      className="absolute inset-0 w-full h-full object-contain z-10"
                    />
                    <div className="absolute inset-[15%] rounded-full bg-muted overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary">👤</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mini profile info */}
                  <div className="absolute bottom-4 left-4">
                    <div className="h-4 w-24 bg-background/80 rounded mb-1" />
                    <div className="h-2.5 w-16 bg-background/60 rounded" />
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
              {isFrameOwned(selectedFrame.id) ? (
                <div className="space-y-3">
                  <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="h-4 w-4 mr-2" />
                    Bạn đã sở hữu khung này
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
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGiftDialog(false)}>
              Đóng
            </Button>
            {selectedFrame && (isGifting || (!isFrameOwned(selectedFrame.id) && hasPrimeBoost)) && (
              <Button 
                onClick={handleBuyOrGift}
                disabled={
                  giftLoading || 
                  purchaseFrame.isPending ||
                  (isGifting && !giftRecipient) ||
                  (balance || 0) < (selectedFrame?.price || 0) ||
                  (!isGifting && isFrameOwned(selectedFrame.id))
                }
                className={isGifting ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {giftLoading || purchaseFrame.isPending ? (
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
