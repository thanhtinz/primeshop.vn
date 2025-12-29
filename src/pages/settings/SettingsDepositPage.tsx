import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { DepositQRModal } from '@/components/payment/DepositQRModal';
import { CryptoPaymentModal } from '@/components/payment/CryptoPaymentModal';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, ArrowUpRight, Plus, Wallet, DollarSign, QrCode } from 'lucide-react';

interface SettingsContext {
  t: (key: string) => string;
}

// PayPal icon component
const PayPalIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.767.767 0 0 1 .757-.64h6.654c2.204 0 3.935.583 5.15 1.73.606.574 1.063 1.248 1.357 2.005.315.8.42 1.7.308 2.672-.27 2.291-1.246 4.093-2.907 5.357-1.553 1.183-3.467 1.783-5.694 1.783H8.29a.767.767 0 0 0-.757.64l-.457 2.97z"/>
    <path fill="#0070BA" d="M19.588 7.957c-.084.697-.233 1.355-.454 1.974a6.882 6.882 0 0 1-1.45 2.377c-1.455 1.557-3.552 2.324-6.237 2.324H9.42a.767.767 0 0 0-.757.64l-.858 5.577a.641.641 0 0 0 .633.74h3.263a.767.767 0 0 0 .757-.64l.325-2.113a.767.767 0 0 1 .757-.64h1.61c2.042 0 3.672-.504 4.85-1.5 1.102-.93 1.88-2.244 2.314-3.907.35-1.332.387-2.474.112-3.407a3.587 3.587 0 0 0-1.288-1.865c-.207-.16-.432-.304-.673-.432-.078-.042-.16-.084-.246-.125.002.006.003.012.003.018a7.75 7.75 0 0 1-.634 1.599z"/>
  </svg>
);

// USDT/Tether icon
const USDTIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path fill="#fff" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
  </svg>
);

type PaymentMethod = 'payos' | 'paypal' | 'crypto';

export default function SettingsDepositPage() {
  const { t } = useOutletContext<SettingsContext>();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { currency, formatPrice, convertToUSD } = useCurrency();
  const { data: paypalEnabled } = useSiteSetting('paypal_enabled');
  const { data: fpaymentEnabled } = useSiteSetting('fpayment_enabled');

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('payos');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [cryptoData, setCryptoData] = useState<any>(null);

  const isPayPalAvailable = paypalEnabled === true || paypalEnabled === 'true';
  const isCryptoAvailable = fpaymentEnabled === true || fpaymentEnabled === 'true';
  const isUSD = currency === 'USD';

  const quickDepositAmounts = isUSD 
    ? [5, 10, 20, 50, 100, 200]
    : [50000, 100000, 200000, 500000, 1000000, 2000000];
  const minDepositAmount = isUSD ? 1 : 10000;

  useEffect(() => {
    setDepositAmount('');
  }, [currency]);

  // Handle PayPal deposit return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositSuccess = params.get('deposit_success');
    const depositCancelled = params.get('deposit_cancelled');
    const depositId = params.get('depositId');

    if (depositSuccess === 'true' && depositId) {
      const captureDeposit = async () => {
        try {
          const { data: deposit } = await supabase
            .from('deposit_transactions')
            .select('*')
            .eq('id', depositId)
            .single();

          if (deposit && deposit.payment_id && deposit.status === 'pending') {
            const { data, error } = await supabase.functions.invoke('paypal-webhook', {
              body: {
                action: 'capture_deposit',
                depositId: depositId,
                paypalOrderId: deposit.payment_id,
              }
            });

            if (data?.success) {
              toast.success(t('depositSuccess'));
              refreshProfile();
            } else {
              toast.error(data?.error || t('depositError'));
            }
          }
        } catch (error) {
          console.error('Error capturing PayPal deposit:', error);
        }
      };

      captureDeposit();
      navigate('/settings/deposit', { replace: true });
    } else if (depositCancelled === 'true') {
      toast.error(t('depositCancelled'));
      navigate('/settings/deposit', { replace: true });
    }
  }, [navigate, t, refreshProfile]);

  const handleDeposit = async () => {
    const inputAmount = parseFloat(depositAmount);
    
    if (!inputAmount || inputAmount < minDepositAmount) {
      const minDisplay = isUSD ? `$${minDepositAmount}` : formatPrice(minDepositAmount);
      toast.error(`${t('minDepositAmount')}: ${minDisplay}`);
      return;
    }

    setIsDepositing(true);
    
    try {
      if (paymentMethod === 'paypal') {
        // PayPal deposit - works with both VND and USD
        const amountUSD = isUSD ? inputAmount : convertToUSD(inputAmount);
        
        const { data, error } = await supabase.functions.invoke('paypal-webhook', {
          body: {
            action: 'create_deposit',
            amount: amountUSD,
            originalAmount: inputAmount,
            originalCurrency: currency,
            returnUrl: `${window.location.origin}/settings/deposit?deposit_success=true`,
            cancelUrl: `${window.location.origin}/settings/deposit?deposit_cancelled=true`
          }
        });

        if (error) throw error;
        if (data?.approveUrl) {
          window.location.href = data.approveUrl;
          return;
        }
        throw new Error(t('cannotCreatePaymentLink'));
        
      } else if (paymentMethod === 'crypto') {
        // Crypto USDT deposit via FPayment
        const { data, error } = await supabase.functions.invoke('fpayment-usdt', {
          body: {
            amount: inputAmount,
            currency: currency,
            type: 'deposit',
            description: `Nạp tiền - ${inputAmount} ${currency}`,
          }
        });

        if (error) throw error;
        if (data?.data) {
          setCryptoData({
            paymentId: data.data.payment_id,
            amountUsdt: data.data.amount_usdt,
            amountOriginal: data.data.amount_original,
            currencyOriginal: data.data.currency_original,
            walletAddress: data.data.wallet_address,
            qrCode: data.data.qr_code,
            network: data.data.network,
            expiresAt: data.data.expires_at,
          });
          setShowCryptoModal(true);
        } else {
          throw new Error(data?.error || t('cannotCreatePaymentLink'));
        }
        
      } else {
        // PayOS deposit (VND only, but allow from any currency)
        const amountVND = isUSD ? Math.round(inputAmount * 24500) : inputAmount;
        
        const { data, error } = await supabase.functions.invoke('create-deposit-payment', {
          body: { 
            amount: amountVND,
            originalAmount: inputAmount,
            originalCurrency: currency,
          }
        });
        
        if (error) throw error;
        
        if (data?.qrCode || data?.qr_code || data?.accountNo) {
          setQrData({
            qrCode: data.qrCode || data.qr_code,
            accountNo: data.accountNo,
            accountName: data.accountName,
            description: data.description,
            orderCode: data.orderCode,
            amount: amountVND
          });
          setShowQRModal(true);
        } else if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(t('cannotCreatePaymentLink'));
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('depositError'));
    } finally {
      setIsDepositing(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'paypal':
        return <PayPalIcon />;
      case 'crypto':
        return <USDTIcon />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'paypal':
        return 'PayPal';
      case 'crypto':
        return 'USDT (Crypto)';
      default:
        return 'PayOS (Chuyển khoản)';
    }
  };

  const getPaymentMethodDescription = (method: PaymentMethod) => {
    switch (method) {
      case 'paypal':
        return isUSD 
          ? `Thanh toán $${depositAmount || '0'} USD qua PayPal`
          : `Thanh toán ~$${convertToUSD(parseFloat(depositAmount) || 0).toFixed(2)} USD qua PayPal`;
      case 'crypto':
        const usdtAmount = isUSD 
          ? parseFloat(depositAmount) || 0
          : (parseFloat(depositAmount) || 0) / 24500;
        return `Thanh toán ~${usdtAmount.toFixed(2)} USDT qua TRC20`;
      default:
        return isUSD
          ? `Chuyển khoản ~${formatPrice(Math.round((parseFloat(depositAmount) || 0) * 24500))} VND`
          : `Chuyển khoản ${formatPrice(parseFloat(depositAmount) || 0)} VND`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('currentBalance')}</p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(profile?.balance || 0)}
              </p>
            </div>
            <Wallet className="h-12 w-12 text-primary/50" />
          </div>
        </CardContent>
      </Card>

      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('depositToAccount')}
          </CardTitle>
          <CardDescription>
            {t('selectAmountAndMethod')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('selectAmount')}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickDepositAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={depositAmount === amount.toString() ? 'default' : 'outline'}
                  onClick={() => setDepositAmount(amount.toString())}
                  className="text-sm"
                >
                  {isUSD ? `$${amount}` : formatPrice(amount)}
                </Button>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>{t('orEnterOtherAmount')}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder={isUSD ? 'Enter USD amount...' : 'Nhập số tiền VNĐ...'}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min={minDepositAmount}
                  step={isUSD ? 1 : 1000}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('minimumDeposit')} {isUSD ? `$${minDepositAmount}` : formatPrice(minDepositAmount)}
              </p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t('selectPaymentMethod')}</Label>
            
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              {/* PayOS - Bank Transfer */}
              <div 
                className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                  paymentMethod === 'payos' 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setPaymentMethod('payos')}
              >
                <RadioGroupItem value="payos" id="payos" />
                <Label htmlFor="payos" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">PayOS (Chuyển khoản ngân hàng)</span>
                        <Badge variant="secondary" className="text-xs">VND</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getPaymentMethodDescription('payos')}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {/* PayPal */}
              {isPayPalAvailable && (
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    paymentMethod === 'paypal' 
                      ? 'border-[#003087] bg-[#003087]/5 ring-1 ring-[#003087]' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                        <PayPalIcon />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">PayPal</span>
                          <Badge variant="secondary" className="text-xs">USD</Badge>
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">Quốc tế</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodDescription('paypal')}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              )}

              {/* Crypto USDT */}
              {isCryptoAvailable && (
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    paymentMethod === 'crypto' 
                      ? 'border-[#26A17B] bg-[#26A17B]/5 ring-1 ring-[#26A17B]' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setPaymentMethod('crypto')}
                >
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#26A17B]/10 flex items-center justify-center">
                        <USDTIcon />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">USDT (Tether)</span>
                          <Badge variant="secondary" className="text-xs">TRC20</Badge>
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">Crypto</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodDescription('crypto')}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full h-12 text-base" 
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount || parseFloat(depositAmount) < minDepositAmount}
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('processing')}
              </>
            ) : (
              <>
                {getPaymentMethodIcon(paymentMethod)}
                <span className="ml-2">
                  {t('depositWith')} {getPaymentMethodLabel(paymentMethod)}
                </span>
              </>
            )}
          </Button>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium text-sm mb-2">{t('depositNote')}</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {t('depositNoteAutoProcess')}</li>
              <li>• {t('depositNoteSecure')}</li>
              <li>• {t('depositNoteSupport')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* PayOS QR Modal */}
      {qrData && (
        <DepositQRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          amount={qrData.amount}
          qrCodeUrl={qrData.qrCode}
          accountNo={qrData.accountNo}
          accountName={qrData.accountName}
          description={qrData.description}
        />
      )}

      {/* Crypto Payment Modal */}
      {cryptoData && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          paymentId={cryptoData.paymentId}
          amountUsdt={cryptoData.amountUsdt}
          amountOriginal={cryptoData.amountOriginal}
          currencyOriginal={cryptoData.currencyOriginal}
          walletAddress={cryptoData.walletAddress}
          qrCode={cryptoData.qrCode}
          network={cryptoData.network}
          expiresAt={cryptoData.expiresAt}
        />
      )}
    </div>
  );
}
