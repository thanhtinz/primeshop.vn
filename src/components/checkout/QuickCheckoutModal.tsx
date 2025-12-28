import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Wallet, 
  CreditCard, 
  Loader2, 
  LogIn, 
  Package,
  Tag,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { VoucherInput } from './VoucherInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface QuickCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Product info
  productName: string;
  packageName?: string;
  packagePrice: number;
  // Pricing info
  vipDiscount?: number;
  vipDiscountPercent?: number;
  taxRate?: number;
  taxAmount?: number;
  // User info
  user: any;
  profile?: { balance: number } | null;
  // Form states
  email: string;
  onEmailChange: (value: string) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (value: string) => void;
  // Payment
  paymentMethod: 'balance' | 'payos' | 'paypal';
  onPaymentMethodChange: (value: 'balance' | 'payos' | 'paypal') => void;
  paypalEnabled?: boolean;
  currency: string;
  // Voucher & Referral
  voucherCode: string;
  onVoucherChange: (code: string) => void;
  onVoucherApplied?: (voucher: any, discountAmount: number) => void;
  referralCode: string;
  onReferralChange: (value: string) => void;
  // Actions
  isProcessing: boolean;
  onCheckout: () => void;
  // Formatting
  formatPrice: (price: number) => string;
  convertToUSD?: (amount: number) => number;
}

export const QuickCheckoutModal: React.FC<QuickCheckoutModalProps> = ({
  open,
  onOpenChange,
  productName,
  packageName,
  packagePrice,
  vipDiscount = 0,
  vipDiscountPercent = 0,
  taxRate = 0,
  taxAmount = 0,
  user,
  profile,
  email,
  onEmailChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMethod,
  onPaymentMethodChange,
  paypalEnabled = false,
  currency,
  voucherCode,
  onVoucherChange,
  onVoucherApplied,
  referralCode,
  onReferralChange,
  isProcessing,
  onCheckout,
  formatPrice,
  convertToUSD = (v) => v / 23000,
}) => {
  const { t } = useLanguage();

  const priceAfterVip = packagePrice - vipDiscount;
  const finalPrice = priceAfterVip + taxAmount;
  const canPayWithBalance = profile && profile.balance >= finalPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 px-5 py-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50"></div>
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  {t('quickPayment')}
                </DialogTitle>
                <p className="text-sm text-white/70">Thanh toán nhanh chóng & an toàn</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Product Card */}
          <div className="relative rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 p-4 border border-border/50">
            <div className="absolute top-3 right-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground pr-10">{productName}</p>
            {packageName && (
              <p className="text-sm text-muted-foreground mt-0.5">{packageName}</p>
            )}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(packagePrice)}
              </span>
            </div>
            
            {/* Price breakdown */}
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              {vipDiscountPercent > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    VIP {vipDiscountPercent}%
                  </span>
                  <span className="text-green-600 font-medium">-{formatPrice(vipDiscount)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Thuế ({taxRate}%)</span>
                  <span className="text-muted-foreground">+{formatPrice(taxAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email for non-logged in users */}
          {!user && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                {t('emailToReceive')} <span className="text-destructive">*</span>
              </Label>
              <Input 
                type="email" 
                placeholder="email@example.com" 
                value={email} 
                onChange={(e) => onEmailChange(e.target.value)} 
                className="h-12 rounded-xl bg-secondary/30 border-border/50 focus:border-primary transition-colors"
              />
            </div>
          )}

          {/* Customer Info */}
          {user && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('fullName')}</Label>
                <Input
                  placeholder={t('enterFullName')}
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('phone')}</Label>
                <Input
                  placeholder={t('enterPhone')}
                  value={customerPhone}
                  onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {user && profile && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('paymentMethod')}</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(v) => onPaymentMethodChange(v as 'balance' | 'payos' | 'paypal')}
                className="space-y-2"
              >
                {/* Balance */}
                <label 
                  htmlFor="qc-balance" 
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                    paymentMethod === 'balance' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border/50 bg-secondary/20 hover:border-border',
                    !canPayWithBalance && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <RadioGroupItem 
                    value="balance" 
                    id="qc-balance" 
                    disabled={!canPayWithBalance}
                    className="border-2"
                  />
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <Wallet className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t('balance')}</p>
                    <p className={cn(
                      "text-xs mt-0.5",
                      canPayWithBalance ? "text-green-600" : "text-destructive"
                    )}>
                      {formatPrice(profile.balance)}
                    </p>
                  </div>
                  {canPayWithBalance && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium dark:bg-green-900/30 dark:text-green-400">
                      Đủ
                    </span>
                  )}
                </label>

                {/* PayOS */}
                {currency === 'VND' && (
                  <label 
                    htmlFor="qc-payos" 
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                      paymentMethod === 'payos' 
                        ? 'border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-900/20' 
                        : 'border-border/50 bg-secondary/20 hover:border-border'
                    )}
                  >
                    <RadioGroupItem value="payos" id="qc-payos" className="border-2" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                      <CreditCard className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">PayOS</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Chuyển khoản / QR Code</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium dark:bg-blue-900/30 dark:text-blue-400">
                      VNĐ
                    </span>
                  </label>
                )}

                {/* PayPal */}
                {paypalEnabled && (
                  <label 
                    htmlFor="qc-paypal" 
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                      paymentMethod === 'paypal' 
                        ? 'border-[#003087] bg-[#003087]/5 shadow-sm' 
                        : 'border-border/50 bg-secondary/20 hover:border-border'
                    )}
                  >
                    <RadioGroupItem value="paypal" id="qc-paypal" className="border-2" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#003087]/20 to-[#003087]/10">
                      <CreditCard className="h-4.5 w-4.5 text-[#003087]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">PayPal</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ${convertToUSD(finalPrice).toFixed(2)} USD
                      </p>
                    </div>
                    <span className="text-xs bg-[#003087]/10 text-[#003087] px-2 py-0.5 rounded-full font-medium dark:bg-[#003087]/30 dark:text-blue-300">
                      USD
                    </span>
                  </label>
                )}
              </RadioGroup>
            </div>
          )}

          {/* Voucher */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {t('voucherCode')}
            </Label>
            <VoucherInput
              value={voucherCode}
              onChange={onVoucherChange}
              orderAmount={packagePrice}
              className="h-11 rounded-xl"
              onApplied={onVoucherApplied}
            />
          </div>

          {/* Referral */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {t('referralCode')}
            </Label>
            <Input 
              placeholder="Nhập mã giới thiệu (nếu có)" 
              value={referralCode} 
              onChange={(e) => onReferralChange(e.target.value)} 
              className="h-11 rounded-xl bg-secondary/30 border-border/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!user ? (
              <>
                <Button 
                  onClick={onCheckout} 
                  disabled={isProcessing} 
                  className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  {currency === 'USD' && paypalEnabled ? 'PayPal' : t('payWithPayOSBtn')}
                </Button>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full h-11 rounded-xl">
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('loginToPayWithBalance')}
                  </Button>
                </Link>
              </>
            ) : (
              <Button 
                onClick={onCheckout} 
                disabled={isProcessing} 
                className={cn(
                  "w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all",
                  paymentMethod === 'paypal' 
                    ? 'bg-[#003087] hover:bg-[#002570] shadow-[#003087]/20' 
                    : paymentMethod === 'payos'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
                )}
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('processing')}</>
                ) : paymentMethod === 'balance' ? (
                  <><Wallet className="h-5 w-5 mr-2" /> {t('payWithBalanceBtn')}</>
                ) : paymentMethod === 'paypal' ? (
                  <><CreditCard className="h-5 w-5 mr-2" /> Thanh toán PayPal</>
                ) : (
                  <><CreditCard className="h-5 w-5 mr-2" /> {t('payWithPayOSBtn')}</>
                )}
              </Button>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Giao dịch được bảo mật 100%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
