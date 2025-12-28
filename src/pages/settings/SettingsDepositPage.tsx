import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { DepositQRModal } from '@/components/payment/DepositQRModal';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CreditCard, ArrowUpRight, Plus } from 'lucide-react';

interface SettingsContext {
  t: (key: string) => string;
}

export default function SettingsDepositPage() {
  const { t } = useOutletContext<SettingsContext>();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { currency, formatPrice, convertToUSD } = useCurrency();
  const { data: paypalEnabled } = useSiteSetting('paypal_enabled');

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  const isPayPalAvailable = paypalEnabled === true || paypalEnabled === 'true';
  const isUSD = currency === 'USD';

  const quickDepositAmounts = isUSD 
    ? [5, 10, 20, 50, 100]
    : [50000, 100000, 200000, 500000, 1000000];
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
      if (isUSD) {
        // PayPal deposit
        const { data, error } = await supabase.functions.invoke('paypal-webhook', {
          body: {
            action: 'create_deposit',
            amount: inputAmount,
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
      } else {
        // PayOS deposit
        const { data, error } = await supabase.functions.invoke('create-deposit-payment', {
          body: { amount: inputAmount }
        });
        
        if (error) throw error;
        
        if (data?.qrCode || data?.qr_code || data?.accountNo) {
          setQrData({
            qrCode: data.qrCode || data.qr_code,
            accountNo: data.accountNo,
            accountName: data.accountName,
            description: data.description,
            orderCode: data.orderCode,
            amount: inputAmount
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('depositToAccount')}
          </CardTitle>
          <CardDescription>
            {isUSD ? t('depositViaPayPalDesc') : t('selectOrEnterAmount')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUSD && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">{t('depositViaPayPal')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('depositPayPalNote')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {quickDepositAmounts.map((amount) => (
              <Button
                key={amount}
                variant={depositAmount === amount.toString() ? 'default' : 'outline'}
                onClick={() => setDepositAmount(amount.toString())}
                className={`text-sm ${isUSD ? 'border-blue-500/30' : 'border-green-500/30'}`}
              >
                {isUSD ? `$${amount}` : formatPrice(amount)}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label>{t('orEnterOtherAmount')}</Label>
            <Input
              type="number"
              placeholder={isUSD ? 'Enter USD amount...' : t('enterAmount')}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min={minDepositAmount}
              step={isUSD ? 1 : 1000}
            />
            <p className="text-xs text-muted-foreground">
              {t('minimumDeposit')} {isUSD ? `$${minDepositAmount}` : formatPrice(minDepositAmount)}
            </p>
          </div>

          {isUSD && !isPayPalAvailable ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-sm text-destructive">{t('paypalNotConfigured')}</p>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('processing')}
                </>
              ) : isUSD ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('depositViaPayPal')}
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  {t('depositViaPayOS')}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
