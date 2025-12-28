import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, LogIn, Crown, Wallet, Store, Tag, Loader2, X, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart, AppliedVoucherInfo } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CartPage = () => {
  const { 
    items, removeFromCart, updateQuantity, totalAmount,
    marketplaceItems, removeMarketplaceItem,
    appliedVouchers, addVoucher, removeVoucher, getSystemVoucher, getSellerVoucher,
    systemItemsTotal, marketplaceItemsTotal
  } = useCart();
  const { user, profile, vipLevel, isLoading: authLoading } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Voucher input states
  const [systemVoucherCode, setSystemVoucherCode] = useState('');
  const [sellerVoucherCodes, setSellerVoucherCodes] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState<string | null>(null);

  // Group marketplace items by seller
  const groupedMarketplaceItems = marketplaceItems.reduce((acc, item) => {
    if (!acc[item.sellerId]) {
      acc[item.sellerId] = { sellerName: item.sellerName, items: [] };
    }
    acc[item.sellerId].items.push(item);
    return acc;
  }, {} as Record<string, { sellerName: string; items: typeof marketplaceItems }>);

  // Calculate VIP discount
  const vipDiscountPercent = vipLevel?.discount_percent || 0;
  const vipDiscount = totalAmount * (vipDiscountPercent / 100);
  
  // Calculate voucher discounts
  const systemVoucher = getSystemVoucher();
  const systemVoucherDiscount = systemVoucher?.calculatedDiscount || 0;
  
  // Calculate total seller voucher discounts
  const sellerVouchersDiscount = appliedVouchers
    .filter(v => v.type === 'seller')
    .reduce((sum, v) => sum + v.calculatedDiscount, 0);
  
  const totalVoucherDiscount = systemVoucherDiscount + sellerVouchersDiscount;
  
  // Calculate tax from site settings
  const taxRate = siteSettings?.tax_rate || 0;
  const subtotalAfterDiscounts = totalAmount - vipDiscount - totalVoucherDiscount;
  const taxAmount = subtotalAfterDiscounts * (taxRate / 100);
  const finalTotal = subtotalAfterDiscounts + taxAmount;

  // Apply system voucher
  const handleApplySystemVoucher = async () => {
    if (!systemVoucherCode.trim()) return;
    setIsValidating('system');

    try {
      // First check if this is a seller voucher
      const { data: sellerVoucher } = await supabase
        .from('seller_vouchers')
        .select('*, sellers!inner(shop_name)')
        .eq('code', systemVoucherCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (sellerVoucher) {
        const shopName = (sellerVoucher.sellers as any)?.shop_name || 'shop';
        toast.error(`Mã voucher "${systemVoucherCode.toUpperCase()}" chỉ áp dụng cho các sản phẩm của shop "${shopName}"`);
        setIsValidating(null);
        return;
      }

      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', systemVoucherCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!voucher) {
        toast.error('Mã giảm giá không tồn tại hoặc đã hết hạn');
        setIsValidating(null);
        return;
      }

      // Check expiration
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast.error('Mã giảm giá đã hết hạn');
        setIsValidating(null);
        return;
      }

      // Check usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        toast.error('Mã giảm giá đã hết lượt sử dụng');
        setIsValidating(null);
        return;
      }

      // Check min order (apply to system items)
      if (voucher.min_order_value && systemItemsTotal < voucher.min_order_value) {
        toast.error(`Đơn hàng tối thiểu ${formatPrice(voucher.min_order_value)}`);
        setIsValidating(null);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (voucher.discount_type === 'percentage') {
        discount = (systemItemsTotal * voucher.discount_value) / 100;
        if (voucher.max_discount) discount = Math.min(discount, voucher.max_discount);
      } else {
        discount = voucher.discount_value;
      }

      addVoucher({
        id: voucher.id,
        code: voucher.code,
        type: 'system',
        discountType: voucher.discount_type as 'percentage' | 'fixed',
        discountValue: voucher.discount_value,
        calculatedDiscount: discount
      });

      setSystemVoucherCode('');
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
    setIsValidating(null);
  };

  // Apply seller voucher
  const handleApplySellerVoucher = async (sellerId: string) => {
    const code = sellerVoucherCodes[sellerId];
    if (!code?.trim()) return;
    setIsValidating(sellerId);

    try {
      const { data: voucher } = await supabase
        .from('seller_vouchers')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_to', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .maybeSingle();

      if (!voucher) {
        toast.error('Mã giảm giá shop không hợp lệ');
        setIsValidating(null);
        return;
      }

      // Check usage limit
      if (voucher.max_uses && voucher.used_count >= voucher.max_uses) {
        toast.error('Mã giảm giá đã hết lượt sử dụng');
        setIsValidating(null);
        return;
      }

      // Calculate seller items total
      const sellerItemsTotal = groupedMarketplaceItems[sellerId]?.items.reduce((sum, i) => sum + i.price, 0) || 0;

      // Check min order
      if (voucher.min_order_amount && sellerItemsTotal < voucher.min_order_amount) {
        toast.error(`Đơn hàng tối thiểu ${formatPrice(voucher.min_order_amount)}`);
        setIsValidating(null);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (voucher.type === 'percentage') {
        discount = (sellerItemsTotal * voucher.value) / 100;
      } else {
        discount = voucher.value;
      }

      addVoucher({
        id: voucher.id,
        code: voucher.code,
        type: 'seller',
        sellerId,
        discountType: voucher.type as 'percentage' | 'fixed',
        discountValue: voucher.value,
        calculatedDiscount: discount
      });

      setSellerVoucherCodes(prev => ({ ...prev, [sellerId]: '' }));
      toast.success('Áp dụng mã shop thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
    setIsValidating(null);
  };

  const hasItems = items.length > 0 || marketplaceItems.length > 0;

  if (!hasItems) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mb-3 text-2xl font-bold">{t('emptyCart')}</h1>
            <p className="mb-6 text-muted-foreground">{t('emptyCartMessage')}</p>
            <Link to="/">
              <Button size="lg">{t('continueShopping')}</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Require login to view cart with items
  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <LogIn className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-4 text-2xl font-bold">{t('pleaseLogin')}</h1>
          <p className="mb-6 text-muted-foreground">{t('pleaseLoginToView')}</p>
          <Link to="/auth">
            <Button size="lg">
              <LogIn className="h-5 w-5 mr-2" />
              {t('loginNow')}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="mb-8 text-3xl font-bold">{t('cart')} ({items.length + marketplaceItems.length})</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Products Section */}
            {items.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Sản phẩm hệ thống</Badge>
                  <span className="text-sm text-muted-foreground">({items.length} sản phẩm)</span>
                </div>
                
                {items.map(item => {
                  const imageUrl = item.product.images?.[0] || (item.product as any).image_url || '/placeholder.svg';
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-border bg-card p-4 md:p-6"
                    >
                      <Link to={`/product/${item.product.slug}`} className="shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="h-24 w-24 rounded-lg object-cover md:h-32 md:w-32 bg-muted"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {t('package')}: {item.selectedPackage.name}
                        </p>
                        {Object.entries(item.customFieldValues).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(item.customFieldValues).map(([key, value]) => {
                              const field = item.product.customFields?.find(f => f.id === key);
                              if (!field) return null;
                              return (
                                <p key={key} className="text-xs text-muted-foreground">
                                  {field.name}: {value}
                                </p>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">
                              {formatPrice(item.selectedPackage.price * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* System Voucher Input */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Mã giảm giá hệ thống</span>
                  </div>
                  {systemVoucher ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-mono font-medium">{systemVoucher.code}</span>
                        <Badge variant="secondary">-{formatPrice(systemVoucher.calculatedDiscount)}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeVoucher(systemVoucher.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá..."
                        value={systemVoucherCode}
                        onChange={(e) => setSystemVoucherCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplySystemVoucher()}
                      />
                      <Button 
                        onClick={handleApplySystemVoucher}
                        disabled={isValidating === 'system'}
                      >
                        {isValidating === 'system' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Marketplace Products Section - Grouped by Seller */}
            {Object.entries(groupedMarketplaceItems).map(([sellerId, { sellerName, items: sellerItems }]) => {
              const sellerVoucher = getSellerVoucher(sellerId);
              const sellerTotal = sellerItems.reduce((sum, i) => sum + i.price, 0);
              
              return (
                <div key={sellerId} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="border-primary/50">Shop: {sellerName}</Badge>
                    <span className="text-sm text-muted-foreground">({sellerItems.length} sản phẩm)</span>
                  </div>
                  
                  {sellerItems.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-primary/20 bg-card p-4 md:p-6"
                    >
                      <Link to={`/shops/product/${item.category}_${item.productId.split('-')[0]}`} className="shrink-0">
                        <img
                          src={item.images?.[0] || '/placeholder.svg'}
                          alt={item.title}
                          className="h-24 w-24 rounded-lg object-cover md:h-32 md:w-32 bg-muted"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link
                          to={`/shops/product/${item.category}_${item.productId.split('-')[0]}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <Badge variant="secondary" className="w-fit mt-1">
                          <Store className="h-3 w-3 mr-1" />
                          Chợ
                        </Badge>
                        <div className="mt-auto flex items-center justify-between pt-4">
                          <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeMarketplaceItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Seller Voucher Input */}
                  <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Mã giảm giá của shop {sellerName}</span>
                    </div>
                    {sellerVoucher ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-mono font-medium">{sellerVoucher.code}</span>
                          <Badge variant="secondary">-{formatPrice(sellerVoucher.calculatedDiscount)}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeVoucher(sellerVoucher.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mã của shop..."
                          value={sellerVoucherCodes[sellerId] || ''}
                          onChange={(e) => setSellerVoucherCodes(prev => ({ ...prev, [sellerId]: e.target.value.toUpperCase() }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplySellerVoucher(sellerId)}
                        />
                        <Button 
                          onClick={() => handleApplySellerVoucher(sellerId)}
                          disabled={isValidating === sellerId}
                        >
                          {isValidating === sellerId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">{t('orderSummary')}</h2>

              {/* User info and balance */}
              {profile && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{t('balance')}</span>
                    </div>
                    <span className="font-semibold text-primary">{formatPrice(profile.balance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      {vipLevel?.name || 'Member'}
                    </Badge>
                    {vipDiscountPercent > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        {t('discount')} {vipDiscountPercent}%
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 border-b border-border pb-4">
                {/* System items */}
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span>{formatPrice(item.selectedPackage.price * item.quantity)}</span>
                  </div>
                ))}
                {/* Marketplace items */}
                {marketplaceItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px] flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {item.title}
                    </span>
                    <span>{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-b border-border py-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                {vipDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      VIP {vipDiscountPercent}%
                    </span>
                    <span>-{formatPrice(vipDiscount)}</span>
                  </div>
                )}
                {systemVoucher && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {systemVoucher.code}
                    </span>
                    <span>-{formatPrice(systemVoucher.calculatedDiscount)}</span>
                  </div>
                )}
                {appliedVouchers.filter(v => v.type === 'seller').map(v => (
                  <div key={v.id} className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1 text-sm">
                      <Store className="h-3 w-3" />
                      {v.code}
                    </span>
                    <span>-{formatPrice(v.calculatedDiscount)}</span>
                  </div>
                ))}
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('tax')} ({taxRate}%)</span>
                    <span>+{formatPrice(taxAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4">
                <span className="text-lg font-semibold">{t('total')}</span>
                <span className="text-xl font-bold text-primary">{formatPrice(finalTotal)}</span>
              </div>

              <Link to="/checkout">
                <Button variant="hero" size="lg" className="w-full">
                  {t('proceedToCheckout')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
