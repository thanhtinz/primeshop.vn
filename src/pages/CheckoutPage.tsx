import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Wallet, CreditCard, LogIn, Loader2, Store, Tag, Crown } from 'lucide-react';
import { PaymentLoadingOverlay } from '@/components/payment/PaymentLoadingOverlay';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useConfetti } from '@/hooks/useConfetti';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendDiscordNotification } from '@/hooks/useDiscordNotify';
import { processAutoDelivery } from '@/hooks/useAutoDelivery';

const PayPalIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.767.767 0 0 1 .757-.64h6.654c2.204 0 3.935.583 5.15 1.73.606.574 1.063 1.248 1.357 2.005.315.8.42 1.7.308 2.672-.27 2.291-1.246 4.093-2.907 5.357-1.553 1.183-3.467 1.783-5.694 1.783H8.29a.767.767 0 0 0-.757.64l-.457 2.97z"/>
    <path fill="#0070BA" d="M19.588 7.957c-.084.697-.233 1.355-.454 1.974a6.882 6.882 0 0 1-1.45 2.377c-1.455 1.557-3.552 2.324-6.237 2.324H9.42a.767.767 0 0 0-.757.64l-.858 5.577a.641.641 0 0 0 .633.74h3.263a.767.767 0 0 0 .757-.64l.325-2.113a.767.767 0 0 1 .757-.64h1.61c2.042 0 3.672-.504 4.85-1.5 1.102-.93 1.88-2.244 2.314-3.907.35-1.332.387-2.474.112-3.407a3.587 3.587 0 0 0-1.288-1.865c-.207-.16-.432-.304-.673-.432-.078-.042-.16-.084-.246-.125.002.006.003.012.003.018a7.75 7.75 0 0 1-.634 1.599z"/>
  </svg>
);

const CheckoutPage = () => {
  const { 
    items, totalAmount, clearCart, 
    marketplaceItems, systemItemsTotal, marketplaceItemsTotal,
    appliedVouchers, getSystemVoucher,
    appliedReferralCode, setAppliedReferralCode
  } = useCart();
  const { user, profile, vipLevel, refreshProfile, isLoading: authLoading } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const { t } = useLanguage();
  const { currency, formatPrice, convertToUSD } = useCurrency();
  const navigate = useNavigate();
  const { fireSuccess } = useConfetti();
  const { playSuccessSound } = useNotificationSound();

  const [referralCode, setReferralCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'payos' | 'paypal'>('payos');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Initialize customer fields from profile and referral code from cart
  useEffect(() => {
    if (profile) {
      setCustomerName(profile.full_name || '');
      setCustomerPhone(profile.phone || '');
    }
  }, [profile]);

  // Sync referral code from cart context
  useEffect(() => {
    if (appliedReferralCode && !referralCode) {
      setReferralCode(appliedReferralCode);
    }
  }, [appliedReferralCode]);

  const paypalEnabled = siteSettings?.paypal_enabled ?? false;

  // Auto-select payment method based on currency
  useEffect(() => {
    if (currency === 'USD') {
      if (paypalEnabled) {
        setPaymentMethod('paypal');
      }
    } else {
      if (paymentMethod === 'paypal') {
        setPaymentMethod('payos');
      }
    }
  }, [currency, paypalEnabled]);

  // Calculate VIP discount
  const vipDiscountPercent = vipLevel?.discount_percent || 0;
  const vipDiscount = totalAmount * (vipDiscountPercent / 100);
  const amountAfterVip = totalAmount - vipDiscount;

  // Calculate voucher discounts from cart context
  const systemVoucher = getSystemVoucher();
  const systemVoucherDiscount = systemVoucher?.calculatedDiscount || 0;
  const sellerVouchersDiscount = appliedVouchers
    .filter(v => v.type === 'seller')
    .reduce((sum, v) => sum + v.calculatedDiscount, 0);
  const totalVoucherDiscount = systemVoucherDiscount + sellerVouchersDiscount;

  const totalDiscount = vipDiscount + totalVoucherDiscount;
  const amountAfterDiscounts = totalAmount - totalDiscount;
  
  // Calculate tax from site settings
  const taxRate = siteSettings?.tax_rate || 0;
  const taxAmount = amountAfterDiscounts * (taxRate / 100);
  const finalAmount = amountAfterDiscounts + taxAmount;
  const canPayWithBalance = profile && profile.balance >= finalAmount;

  const hasItems = items.length > 0 || marketplaceItems.length > 0;

  const handleCheckout = async () => {
    if (!user || !profile) {
      toast.error(t('pleaseLoginToPay'));
      navigate('/auth');
      return;
    }

    if (paymentMethod === 'balance' && !canPayWithBalance) {
      toast.error(t('insufficientBalance'));
      return;
    }

    setIsProcessing(true);

    try {
      const customerEmail = profile.email;
      const orderIds: string[] = [];

      // Create orders for system items
      for (const item of items) {
        const itemTotal = item.selectedPackage.price * item.quantity;
        const isFirstItem = items.indexOf(item) === 0;
        
        // Calculate item's share of discounts and tax for first item only
        const itemDiscount = isFirstItem ? (vipDiscount + systemVoucherDiscount) : 0;
        const itemAfterDiscount = itemTotal - itemDiscount;
        const itemTaxAmount = isFirstItem ? (itemAfterDiscount * taxRate / 100) : 0;
        const itemFinalTotal = itemAfterDiscount + itemTaxAmount;
        
        // Convert field IDs to field names for display in invoice
        const customFieldValuesWithNames = Object.entries(item.customFieldValues).reduce((acc, [fieldId, value]) => {
          const fieldDef = (item.product as any).custom_fields?.find((f: any) => f.id === fieldId);
          const fieldName = fieldDef?.field_name || fieldId;
          acc[fieldName] = value;
          return acc;
        }, {} as Record<string, string>);

        const productSnapshot = {
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            image_url: item.product.image_url,
            style: item.product.style || 'topup', // Ensure style is preserved for OrderLookup
          },
          selectedPackage: item.selectedPackage,
          customFieldValues: customFieldValuesWithNames,
          quantity: item.quantity,
          taxRate: isFirstItem ? taxRate : 0,
          taxAmount: isFirstItem ? Math.round(itemTaxAmount) : 0,
          vipDiscount: isFirstItem ? vipDiscount : 0,
          voucherDiscount: isFirstItem ? systemVoucherDiscount : 0,
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            customer_email: customerEmail,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            product_snapshot: productSnapshot as any,
            subtotal: itemTotal,
            discount_amount: itemDiscount,
            total_amount: Math.round(itemFinalTotal),
            voucher_code: isFirstItem ? systemVoucher?.code : null,
            voucher_id: isFirstItem ? systemVoucher?.id : null,
            referral_code: isFirstItem ? referralCode : null,
            status: paymentMethod === 'balance' ? 'PAID' : 'PENDING_PAYMENT',
          })
          .select()
          .single();

        if (orderError) throw orderError;
        orderIds.push(order.id);

        sendDiscordNotification('new_order', {
          order_number: order.order_number,
          customer_email: profile.email,
          product_name: item.product.name,
          package_name: item.selectedPackage.name,
          total_amount: order.total_amount,
        });

        // Create payment record - will be marked completed after RPC succeeds for balance payments
        const { data: createdPayment } = await supabase.from('payments').insert({
          order_id: order.id,
          amount: order.total_amount,
          status: 'pending', // Always start as pending, update after successful payment
          payment_provider: paymentMethod === 'balance' ? 'balance' : 'payos',
        }).select().single();
        if (createdPayment) {
          // collect payment id for potential PayOS checkout creation
          // store in orderIdsPayments map
          (window as any).__createdPayments = (window as any).__createdPayments || [];
          (window as any).__createdPayments.push(createdPayment);
        }
      }

      // Process marketplace items - create seller orders using atomic RPC
      const { data: platformFeeData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'marketplace_platform_fee')
        .single();
      const platformFeePercent = platformFeeData?.value ? Number(platformFeeData.value) : 5;

      for (const mpItem of marketplaceItems) {
        const sellerVoucher = appliedVouchers.find(v => v.type === 'seller' && v.sellerId === mpItem.sellerId);
        const itemDiscount = sellerVoucher?.calculatedDiscount || 0;

        if (paymentMethod === 'balance') {
          // Use atomic RPC for balance payment
          const { data: result, error: rpcError } = await supabase.rpc('create_seller_order_with_escrow', {
            p_product_id: mpItem.productId,
            p_seller_id: mpItem.sellerId,
            p_amount: mpItem.price,
            p_platform_fee_percent: platformFeePercent,
            p_voucher_code: sellerVoucher?.code || null,
            p_discount_amount: itemDiscount
          });

          if (rpcError) throw rpcError;
          
          const orderResult = result as { success: boolean; error?: string; order_number?: string };
          if (!orderResult.success) {
            throw new Error(orderResult.error || 'Không thể tạo đơn hàng marketplace');
          }

          sendDiscordNotification('new_order', {
            order_number: orderResult.order_number,
            customer_email: profile.email,
            product_name: mpItem.title,
            package_name: 'Marketplace',
            total_amount: mpItem.price - itemDiscount,
          });
        } else {
          // For non-balance payments, create pending order (handled by webhook later)
          const itemFinal = mpItem.price - itemDiscount;
          const platformFee = itemFinal * (platformFeePercent / 100);
          const sellerAmount = itemFinal - platformFee;
          const orderNumber = `MKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          const { data: productData } = await supabase
            .from('seller_products')
            .select('account_data')
            .eq('id', mpItem.productId)
            .single();

          const { error: sellerOrderError } = await supabase
            .from('seller_orders')
            .insert({
              order_number: orderNumber,
              product_id: mpItem.productId,
              seller_id: mpItem.sellerId,
              buyer_id: user.id,
              buyer_email: customerEmail,
              amount: mpItem.price,
              platform_fee: platformFee,
              seller_amount: sellerAmount,
              status: 'pending',
              delivery_content: productData?.account_data || null,
              escrow_release_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            });

          if (sellerOrderError) throw sellerOrderError;

          sendDiscordNotification('new_order', {
            order_number: orderNumber,
            customer_email: profile.email,
            product_name: mpItem.title,
            package_name: 'Marketplace',
            total_amount: itemFinal,
          });
        }
      }

      // If paying with balance, deduct from account (only for system items - marketplace handled by RPC)
      if (paymentMethod === 'balance' && items.length > 0) {
        // Only deduct system items total (marketplace already deducted by RPC)
        const systemOnlyAmount = systemItemsTotal - vipDiscount - systemVoucherDiscount + (systemItemsTotal * taxRate / 100);
        
        if (systemOnlyAmount > 0) {
          // Use atomic RPC for balance payment
          const { data: rpcResult, error: rpcError } = await supabase.rpc('pay_with_balance', {
            p_user_id: user.id,
            p_amount: Math.max(0, systemOnlyAmount),
            p_reference_type: 'order',
            p_reference_id: null,
            p_note: 'Thanh toán đơn hàng hệ thống'
          });

          if (rpcError) throw rpcError;

          const result = rpcResult as { success: boolean; error?: string };
          if (!result.success) {
            throw new Error(result.error || t('paymentFailed'));
          }
        }

        // Update payment status to completed after successful balance deduction
        for (const orderId of orderIds) {
          await supabase
            .from('payments')
            .update({ status: 'completed' })
            .eq('order_id', orderId);
          
          await supabase
            .from('orders')
            .update({ status: 'PAID' })
            .eq('id', orderId);
            
          // Process auto-delivery for game_topup and game_account
          const orderItem = items.find((item, idx) => idx === orderIds.indexOf(orderId));
          if (orderItem) {
            const productStyle = (orderItem.product as any)?.style;
            if (productStyle === 'game_topup' || productStyle === 'game_account') {
              const deliveryResult = await processAutoDelivery(orderId);
              if (!deliveryResult.success && deliveryResult.deliveryType !== 'manual') {
                console.error('Auto-delivery failed:', deliveryResult.message);
              }
            }
          }
        }
      }

      await refreshProfile();

      // If PayOS payment was used, request creation of checkoutUrl/qr for created payments
      try {
        if (paymentMethod !== 'balance') {
          const createdPayments = (window as any).__createdPayments || [];
          for (const p of createdPayments) {
            try {
              const { data } = await supabase.functions.invoke('create-order-payment', {
                body: { paymentId: p.id }
              });
              // If PayOS returns a checkoutUrl, redirect user to it (use first available)
              if (data?.checkoutUrl || data?.data?.checkoutUrl) {
                const url = data.checkoutUrl || data.data.checkoutUrl;
                window.location.href = url;
                return;
              }
              // If QR is returned, we could show modal; for now, rely on admin email/notifications
            } catch (err) {
              console.error('create-order-payment invoke error:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error creating PayOS checkout for order payments:', err);
      }

      fireSuccess();
      playSuccessSound();
      
      if (paymentMethod === 'balance') {
        toast.success(t('paymentSuccess'));
      } else {
        toast.success(t('orderSuccess'));
      }
      clearCart();
      navigate('/order-lookup');

      // Update system voucher usage atomically
      if (systemVoucher) {
        await supabase.rpc('increment_voucher_usage' as any, { 
          voucher_id: systemVoucher.id 
        });
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('orderError'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasItems) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">{t('emptyCart')}</h1>
          <p className="mb-6 text-muted-foreground">{t('needProductFirst')}</p>
          <Link to="/">
            <Button>{t('returnHome')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Require login to checkout
  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <LogIn className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="mb-4 text-2xl font-bold">{t('pleaseLogin')}</h1>
          <p className="mb-6 text-muted-foreground">{t('pleaseLoginToContinue')}</p>
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
      <PaymentLoadingOverlay isProcessing={isProcessing} paymentMethod={paymentMethod} />
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              {t('home')}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/cart" className="text-muted-foreground hover:text-foreground">
              {t('cart')}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{t('checkout')}</span>
          </nav>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <h1 className="mb-6 text-2xl font-bold">{t('checkout')}</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-4">
            {/* User info - editable */}
            {profile && (
              <div className="rounded-xl border border-border bg-card p-4 md:p-6">
                <h2 className="mb-4 text-lg font-semibold">{t('buyerInfo')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('email')}</Label>
                    <Input
                      value={profile.email}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('fullName')}</Label>
                    <Input
                      placeholder={t('enterFullName')}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('phone')}</Label>
                    <Input
                      placeholder={t('enterPhone')}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment method selection */}
            <div className="rounded-xl border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('paymentMethod')}</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'balance' | 'payos' | 'paypal')}>
                <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === 'balance' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'} ${!canPayWithBalance ? 'opacity-50' : ''}`}>
                  <RadioGroupItem value="balance" id="balance" disabled={!canPayWithBalance} />
                  <Label htmlFor="balance" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="font-medium">{t('balance')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('currentBalance')}: <span className={canPayWithBalance ? 'text-green-600 font-medium' : 'text-destructive'}>{formatPrice(profile?.balance || 0)}</span>
                      {!canPayWithBalance && <span className="text-destructive ml-2">({t('notEnoughBalance')})</span>}
                    </p>
                  </Label>
                </div>

                {currency === 'VND' && (
                  <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === 'payos' ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}>
                    <RadioGroupItem value="payos" id="payos" />
                    <Label htmlFor="payos" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">{t('payWithPayOS')} (VNĐ)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('payOSDescription')}
                      </p>
                    </Label>
                  </div>
                )}

                {paypalEnabled && (
                  <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#003087] bg-[#003087]/5' : 'border-border hover:bg-secondary/50'}`}>
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <PayPalIcon />
                        <span className="font-medium">PayPal (USD)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currency === 'USD' 
                          ? `${t('paypalPayment')} $${convertToUSD(finalAmount).toFixed(2)} USD`
                          : `${t('internationalPayment')} - $${convertToUSD(finalAmount).toFixed(2)} USD`
                        }
                      </p>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Referral Code */}
            <div className="rounded-xl border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('referralCode')}</h2>
              
              <div className="space-y-2">
                <Input
                  placeholder={t('enterReferralCode')}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  {t('referralCommissionNote')}
                </p>
              </div>
            </div>

            {/* Applied Vouchers Summary */}
            {appliedVouchers.length > 0 && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  {t('appliedVouchers')}
                </h3>
                <div className="space-y-2">
                  {appliedVouchers.map(v => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        {v.type === 'seller' ? <Store className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                        <span className="font-mono">{v.code}</span>
                      </span>
                      <span className="text-green-600 font-medium">-{formatPrice(v.calculatedDiscount)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('manageVouchersInCart')} <Link to="/cart" className="text-primary underline">{t('cart')}</Link>
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-20 rounded-xl border border-border bg-card p-4 md:p-6">
              <h2 className="mb-4 text-lg font-semibold">{t('orderDetails')}</h2>

              <div className="space-y-3 border-b border-border pb-4">
                {/* System Items */}
                {items.map(item => {
                  const imageUrl = item.product.images?.[0] || (item.product as any).image_url || '/placeholder.svg';
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        className="h-14 w-14 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.selectedPackage.name} x{item.quantity}
                        </p>
                      </div>
                      <span className="font-medium text-sm">
                        {formatPrice(item.selectedPackage.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
                
                {/* Marketplace Items */}
                {marketplaceItems.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.images?.[0] || '/placeholder.svg'}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm line-clamp-1 flex items-center gap-1">
                        <Store className="h-3 w-3 text-primary" />
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shop: {item.sellerName}
                      </p>
                    </div>
                    <span className="font-medium text-sm">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-b border-border py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                {vipDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      VIP {vipDiscountPercent}%
                    </span>
                    <span>-{formatPrice(vipDiscount)}</span>
                  </div>
                )}
                {totalVoucherDiscount > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Voucher ({appliedVouchers.length})
                    </span>
                    <span>-{formatPrice(totalVoucherDiscount)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('tax')} ({taxRate}%)</span>
                    <span>+{formatPrice(taxAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between py-4">
                <span className="text-lg font-semibold">{t('totalPayment')}</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(finalAmount)}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t('processing')}
                  </>
                ) : paymentMethod === 'balance' ? (
                  <>
                    <Wallet className="h-5 w-5 mr-2" />
                    {t('payWithBalance')}
                  </>
                ) : paymentMethod === 'paypal' ? (
                  <>
                    <PayPalIcon />
                    <span className="ml-2">PayPal</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    {t('payWithPayOS')}
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{t('securePayment')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
