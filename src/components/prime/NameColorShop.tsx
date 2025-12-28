import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Lock, Loader2, Gift, Search, Eye, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  useNameColors, 
  useUserNameColors, 
  usePurchaseNameColor,
  useSetActiveNameColor,
  useHasPrimeBoost
} from '@/hooks/usePrimeBoost';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWalletBalance } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

const NameColorShop = () => {
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const { data: colors, isLoading } = useNameColors();
  const { data: userColors, refetch: refetchUserColors } = useUserNameColors();
  const { hasPrime, hasPrimeBoost } = useHasPrimeBoost();
  const purchaseColor = usePurchaseNameColor();
  const setActiveColor = useSetActiveNameColor();
  const { balance } = useWalletBalance();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  
  // Gift state
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [isGifting, setIsGifting] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState<any>(null);
  const [giftLoading, setGiftLoading] = useState(false);

  const ownedColorIds = userColors?.map((uc: any) => uc.color_id) || [];
  const activeColorId = profile?.active_name_color_id;

  const handlePurchase = async (colorId: string, price: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    if (!hasPrimeBoost) {
      toast.error('Bạn cần có Prime Boost để mua màu tên');
      return;
    }

    if ((balance || 0) < price) {
      toast.error('Số dư không đủ');
      return;
    }

    setPurchasingId(colorId);
    await purchaseColor.mutateAsync(colorId);
    setPurchasingId(null);
  };

  const handleSetActive = async (colorId: string) => {
    if (activeColorId === colorId) {
      await setActiveColor.mutateAsync(null);
    } else {
      await setActiveColor.mutateAsync(colorId);
    }
  };

  const openGiftDialog = (color: any, giftMode: boolean = false) => {
    setSelectedColor(color);
    setIsGifting(giftMode);
    setGiftRecipient(null);
    setShowGiftDialog(true);
  };
  
  const isColorOwned = (colorId: string) => ownedColorIds.includes(colorId);

  const handleGift = async () => {
    if (!selectedColor || !giftRecipient || !user) return;
    
    setGiftLoading(true);
    try {
      const price = selectedColor.price;
      
      // Use atomic RPC function for gift
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'name_color',
        p_item_id: selectedColor.id,
        p_item_name: selectedColor.name,
        p_price: price,
        p_recipient_user_id: giftRecipient.user_id
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast.error('Số dư không đủ');
        } else if (result.error === 'Already owns this item') {
          toast.error('Người này đã sở hữu màu tên này');
        } else {
          toast.error(result.error || 'Có lỗi xảy ra khi tặng quà');
        }
        setGiftLoading(false);
        return;
      }
      
      toast.success(`Đã tặng ${selectedColor.name} cho ${giftRecipient.display_name || giftRecipient.username}!`);
      setShowGiftDialog(false);
      setSelectedColor(null);
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
      if (selectedColor) {
        await handlePurchase(selectedColor.id, selectedColor.price);
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
        <div className="p-3 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Màu Tên Đặc Biệt</h2>
          <p className="text-muted-foreground">Làm nổi bật tên của bạn</p>
        </div>
      </div>

      {/* Prime Boost Required Warning */}
      {!hasPrimeBoost && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-500" />
              <p className="text-sm">
                Bạn cần <span className="font-semibold text-yellow-500">Prime Boost</span> để mua màu tên
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Grid - Same style as Avatar Frames */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {colors?.map((color, index) => {
          const isOwned = ownedColorIds.includes(color.id);
          const isActive = activeColorId === color.id;
          
          return (
            <motion.div
              key={color.id}
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
                onClick={() => openGiftDialog(color)}
              >
                <CardContent className="p-2 sm:p-3">
                  {/* Color Preview */}
                  <div 
                    className="aspect-square relative mb-2 flex items-center justify-center overflow-hidden rounded-lg"
                    style={{
                      background: color.is_gradient 
                        ? (color.gradient_value || color.color_value) 
                        : color.color_value,
                    }}
                  >
                    {/* Preview Text */}
                    <span 
                      className="font-bold text-sm sm:text-base"
                      style={{
                        ...(color.is_gradient ? {
                          background: color.gradient_value || color.color_value,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        } : {
                          color: 'white',
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                        })
                      }}
                    >
                      Aa
                    </span>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isOwned ? (
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      ) : (
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Name & Status */}
                  <div className="text-center space-y-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{color.name}</p>
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
                        {formatPrice(color.price)}
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
              <Palette className="h-5 w-5 text-purple-500" />
              {selectedColor?.name}
            </DialogTitle>
            <DialogDescription>
              Xem trước màu tên - {formatPrice(selectedColor?.price || 0)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Large Preview */}
            <div className="bg-secondary/30 rounded-xl p-6">
              <div 
                className="h-20 rounded-lg flex items-center justify-center font-bold text-2xl"
              >
                  {selectedColor?.is_gradient ? (
                    <span style={{
                      background: selectedColor?.gradient_value || selectedColor?.color_value,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {(profile as any)?.display_name || (profile as any)?.username || 'Tên của bạn'}
                    </span>
                  ) : (
                    <span style={{ color: selectedColor?.color_value }}>
                      {(profile as any)?.display_name || (profile as any)?.username || 'Tên của bạn'}
                    </span>
                  )}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Preview màu tên khi hiển thị
              </p>
            </div>

            {/* Show owned status or purchase options */}
            {isColorOwned(selectedColor?.id) ? (
              <div className="space-y-3">
                <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-600 border-green-500/30">
                  <Check className="h-4 w-4 mr-2" />
                  Bạn đã sở hữu màu tên này
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
            {(isGifting || (!isColorOwned(selectedColor?.id) && hasPrimeBoost)) && (
              <Button 
                onClick={handleBuyOrGift}
                disabled={
                  giftLoading || 
                  purchaseColor.isPending ||
                  (isGifting && !giftRecipient) ||
                  (balance || 0) < (selectedColor?.price || 0) ||
                  (!isGifting && isColorOwned(selectedColor?.id))
                }
                className={isGifting ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                {giftLoading || purchaseColor.isPending ? (
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

export default NameColorShop;