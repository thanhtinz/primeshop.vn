import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSmmServices, useCreateSmmOrder, useSmmApiCall, SmmService } from '@/hooks/useSmm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { rpc } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

const SmmBulkOrderPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { formatPrice, convertToVND } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [bulkOrderText, setBulkOrderText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: services = [] } = useSmmServices();
  const createOrder = useCreateSmmOrder();
  const apiCall = useSmmApiCall();

  // Get user's VIP level name
  const { data: vipLevel } = useQuery({
    queryKey: ['user-vip-level', profile?.vip_level_id],
    queryFn: async () => {
      if (!profile?.vip_level_id) return null;
      const { data } = await supabase
        .from('vip_levels')
        .select('name')
        .eq('id', profile.vip_level_id)
        .single();
      return data;
    },
    enabled: !!profile?.vip_level_id,
  });

  const vipTierName = vipLevel?.name?.toLowerCase() || 'member';

  // Get markup based on VIP tier
  const getVipMarkup = (service: SmmService): number => {
    switch (vipTierName) {
      case 'diamond': return service.markup_diamond ?? service.markup_percent;
      case 'gold': return service.markup_gold ?? service.markup_percent;
      case 'silver': return service.markup_silver ?? service.markup_percent;
      case 'bronze': return service.markup_bronze ?? service.markup_percent;
      default: return service.markup_member ?? service.markup_percent;
    }
  };

  const getSellingPrice = (service: SmmService) => {
    const markup = getVipMarkup(service);
    return service.rate * (1 + markup / 100);
  };

  const parseOrders = () => {
    if (!bulkOrderText.trim()) return [];
    
    const lines = bulkOrderText.trim().split('\n');
    const orders: Array<{
      serviceId: string;
      link: string;
      quantity: number;
      service: SmmService | undefined;
      chargeUSD: number;
    }> = [];
    
    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length !== 3) continue;
      
      const [serviceId, link, quantityStr] = parts;
      const quantity = parseInt(quantityStr);
      const service = services.find(s => s.external_service_id.toString() === serviceId);
      
      if (service && link && quantity) {
        const pricePerK = getSellingPrice(service);
        const chargeUSD = (pricePerK * quantity) / 1000;
        orders.push({ serviceId, link, quantity, service, chargeUSD });
      }
    }
    
    return orders;
  };

  const parsedOrders = parseOrders();
  const totalChargeUSD = parsedOrders.reduce((sum, o) => sum + o.chargeUSD, 0);
  const totalChargeVND = convertToVND(totalChargeUSD);

  const handleBulkOrder = async () => {
    if (!user) {
      toast.error(t('smmPleaseLogin'));
      navigate('/auth');
      return;
    }

    if (parsedOrders.length === 0) {
      toast.error(t('smmNoValidOrders'));
      return;
    }

    // Check balance (balance is in VND)
    const currentBalance = profile?.balance || 0;
    if (currentBalance < totalChargeVND) {
      toast.error(`${t('insufficientBalance')}: ${formatPrice(totalChargeVND)}, ${t('currentBalance')}: ${formatPrice(currentBalance)}`);
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const order of parsedOrders) {
      if (!order.service) continue;
      
      try {
        // Call SMM API first
        const apiResult = await apiCall.mutateAsync({
          action: 'add',
          service: parseInt(order.serviceId),
          link: order.link,
          quantity: order.quantity,
        });

        const orderVND = convertToVND(order.chargeUSD);

        // Use atomic RPC to deduct balance and create order
        const { data: rpcResult, error: rpcError } = await rpc('create_smm_order_atomic', {
          p_user_id: user.id,
          p_amount_vnd: orderVND,
          p_service_id: order.service.id,
          p_external_order_id: String(apiResult.order),
          p_link: order.link,
          p_quantity: order.quantity,
          p_charge_usd: order.chargeUSD,
          p_note: `SMM Bulk: ${order.service.name}`
        });

        if (rpcError) throw rpcError;

        const result = rpcResult as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

        successCount++;
      } catch {
        errorCount++;
      }
    }

    await refreshProfile();

    if (successCount > 0) {
      toast.success(`${t('smmBulkOrderSuccess').replace('{count}', successCount.toString())}`);
      setBulkOrderText('');
    }
    if (errorCount > 0) {
      toast.error(`${t('smmBulkOrderFailed').replace('{count}', errorCount.toString())}`);
    }
    
    setIsProcessing(false);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('smmBulkOrder')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('smmBulkOrderDesc')}
            {vipTierName !== 'member' && (
              <span className="ml-2 text-primary font-medium">
                (VIP {vipTierName.charAt(0).toUpperCase() + vipTierName.slice(1)})
              </span>
            )}
          </p>
        </div>

        {!user ? (
          <Card className="max-w-3xl">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">{t('smmPleaseLogin')}</p>
              <Button onClick={() => navigate('/auth')}>
                {t('login')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('smmBulkOrderList')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`${t('smmBulkOrderFormat')}\n\n${t('smmBulkOrderExample')}`}
                value={bulkOrderText}
                onChange={(e) => setBulkOrderText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              
              {parsedOrders.length > 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {t('smmValidOrders')}: <span className="font-bold">{parsedOrders.length}</span>
                </div>
              )}

              <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-lg font-bold">
                  {t('smmPayment')}: <span className="text-primary">{formatPrice(totalChargeVND)}</span>
                </div>
                <Button 
                  size="lg"
                  onClick={handleBulkOrder}
                  disabled={parsedOrders.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('processing')}</>
                  ) : (
                    <>{t('smmPlaceOrder')} {parsedOrders.length} {t('orders')}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SmmBulkOrderPage;