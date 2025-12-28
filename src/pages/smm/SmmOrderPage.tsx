import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { 
  useSmmPlatforms, 
  useSmmServiceTypes, 
  useSmmServices, 
  useCreateSmmOrder, 
  useSmmApiCall,
  SmmService 
} from '@/hooks/useSmm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { sanitizeHtml } from '@/lib/sanitize';

const SmmOrderPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { formatPrice, convertToVND } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceIdFromUrl = searchParams.get('serviceId');
  
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [selectedService, setSelectedService] = useState<SmmService | null>(null);
  const [linkType, setLinkType] = useState<'single' | 'multiple'>('single');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatInterval, setRepeatInterval] = useState(5);
  const [orderForm, setOrderForm] = useState({
    link: '',
    quantity: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: platforms = [] } = useSmmPlatforms();
  const { data: serviceTypes = [] } = useSmmServiceTypes(selectedPlatform || undefined);
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

  const filteredServices = services.filter(service => {
    const matchesPlatform = !selectedPlatform || service.service_type?.platform_id === selectedPlatform;
    const matchesServiceType = !selectedServiceType || service.service_type_id === selectedServiceType;
    return matchesPlatform && matchesServiceType && service.is_active;
  });

  useEffect(() => {
    if (serviceIdFromUrl && services.length > 0) {
      const service = services.find(s => s.id === serviceIdFromUrl);
      if (service) {
        setSelectedService(service);
        setOrderForm({
          link: '',
          quantity: service.min_quantity,
        });
        if (service.service_type) {
          setSelectedPlatform(service.service_type.platform_id || '');
          setSelectedServiceType(service.service_type_id || '');
        }
      }
    }
  }, [serviceIdFromUrl, services]);

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

  const calculateTotal = () => {
    if (!selectedService || !orderForm.quantity) return 0;
    const pricePerK = getSellingPrice(selectedService);
    return (pricePerK * orderForm.quantity) / 1000;
  };

  const totalUSD = calculateTotal();
  // Convert USD to VND for display (assume balance is stored in VND)
  const totalVND = convertToVND(totalUSD);

  const handleSelectService = (service: SmmService) => {
    setSelectedService(service);
    setOrderForm({
      link: '',
      quantity: service.min_quantity,
    });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error(t('smmPleaseLogin'));
      navigate('/auth');
      return;
    }

    if (!selectedService) {
      toast.error(t('smmPleaseSelectService'));
      return;
    }

    if (!orderForm.link) {
      toast.error(t('smmPleaseEnterLink'));
      return;
    }

    if (orderForm.quantity < selectedService.min_quantity || orderForm.quantity > selectedService.max_quantity) {
      toast.error(`${t('smmQuantity')}: ${selectedService.min_quantity} - ${selectedService.max_quantity}`);
      return;
    }

    // Check balance (balance is in VND)
    const currentBalance = profile?.balance || 0;
    if (currentBalance < totalVND) {
      toast.error(`${t('insufficientBalance')}: ${formatPrice(totalVND)}, ${t('currentBalance')}: ${formatPrice(currentBalance)}`);
      return;
    }

    setIsProcessing(true);
    try {
      // Call SMM API first
      const apiResult = await apiCall.mutateAsync({
        action: 'add',
        service: selectedService.external_service_id,
        link: orderForm.link,
        quantity: orderForm.quantity,
      });

      // Use atomic RPC to deduct balance and create order
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_smm_order_atomic', {
        p_user_id: user.id,
        p_amount_vnd: totalVND,
        p_service_id: selectedService.id,
        p_external_order_id: String(apiResult.order),
        p_link: orderForm.link,
        p_quantity: orderForm.quantity,
        p_charge_usd: totalUSD,
        p_note: `SMM: ${selectedService.name}`
      });

      if (rpcError) throw rpcError;

      const result = rpcResult as { success: boolean; error?: string; order_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }

      await refreshProfile();
      toast.success(t('smmOrderSuccess'));
      setSelectedService(null);
      setOrderForm({ link: '', quantity: 0 });
      navigate('/smm/orders');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('smmOrder')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('smmOrderDesc')}
            {vipTierName !== 'member' && (
              <span className="ml-2 text-primary font-medium">
                (VIP {vipTierName.charAt(0).toUpperCase() + vipTierName.slice(1)})
              </span>
            )}
          </p>
        </div>

        {!user ? (
          <Card className="max-w-2xl">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">{t('smmPleaseLogin')}</p>
              <Button onClick={() => navigate('/auth')}>
                {t('login')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t('smmOrderInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('smmPlatform')}</Label>
                  <Select value={selectedPlatform || "all"} onValueChange={(v) => {
                    setSelectedPlatform(v === "all" ? "" : v);
                    setSelectedServiceType("");
                    setSelectedService(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('smmSelectPlatform')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('smmAllPlatforms')}</SelectItem>
                      {platforms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('smmServiceType')}</Label>
                  <Select value={selectedServiceType || "all"} onValueChange={(v) => {
                    setSelectedServiceType(v === "all" ? "" : v);
                    setSelectedService(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('smmSelectServiceType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('smmAllServiceTypes')}</SelectItem>
                      {serviceTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('smmServicePackage')}</Label>
                <Select 
                  value={selectedService?.id || "none"} 
                  onValueChange={(value) => {
                    if (value === "none") {
                      setSelectedService(null);
                      return;
                    }
                    const service = services.find(s => s.id === value);
                    if (service) handleSelectService(service);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('smmSelectPackage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- {t('smmSelectPackage')} --</SelectItem>
                    {filteredServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        [{service.external_service_id}] {service.name} - {formatPrice(convertToVND(getSellingPrice(service)))}/1k
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService && (
                <>
                  {/* Link type selection */}
                  <div className="space-y-3">
                    <Label>{t('smmLinkType')}</Label>
                    <RadioGroup
                      value={linkType}
                      onValueChange={(v) => setLinkType(v as 'single' | 'multiple')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single" className="cursor-pointer">{t('smmLinkSingle')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="multiple" id="multiple" />
                        <Label htmlFor="multiple" className="cursor-pointer">{t('smmLinkMultiple')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('smmLink')}</Label>
                    {linkType === 'single' ? (
                      <Input
                        placeholder={t('smmEnterUrl')}
                        value={orderForm.link}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, link: e.target.value }))}
                      />
                    ) : (
                      <Textarea
                        placeholder={t('smmEnterMultipleUrls')}
                        value={orderForm.link}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, link: e.target.value }))}
                        rows={5}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('smmQuantity')}</Label>
                    <Input
                      type="number"
                      min={selectedService.min_quantity}
                      max={selectedService.max_quantity}
                      value={orderForm.quantity || ''}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  {/* Schedule toggle */}
                  <div className="py-2 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-medium">{t('smmScheduleRun')}</Label>
                        <p className="text-sm text-muted-foreground">{t('smmTimezone')}: +07:00</p>
                      </div>
                      <Switch
                        checked={scheduleEnabled}
                        onCheckedChange={setScheduleEnabled}
                      />
                    </div>
                    {scheduleEnabled && (
                      <div className="space-y-2">
                        <Label>{t('smmScheduleTime')}</Label>
                        <Input
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Repeat order toggle */}
                  <div className="py-2 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="font-medium">{t('smmRepeatOrder')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('smmRepeatOrderDesc')} <span className="font-bold">{t('smmCompleted')}</span>. {t('smmEnsureBalance')}
                        </p>
                      </div>
                      <Switch
                        checked={repeatEnabled}
                        onCheckedChange={setRepeatEnabled}
                      />
                    </div>
                    {repeatEnabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('smmRepeatCount')}</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={repeatCount}
                            onChange={(e) => setRepeatCount(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('smmRepeatInterval')}</Label>
                          <Input
                            type="number"
                            min={1}
                            value={repeatInterval}
                            onChange={(e) => setRepeatInterval(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Simple total and button */}
              <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-lg font-bold">
                  {t('smmPayment')}: <span className="text-primary">{formatPrice(totalVND)}</span>
                </div>
                <Button 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={!selectedService || !orderForm.link || !orderForm.quantity || isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('processing')}</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" /> {t('smmPlaceOrder')}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Info Card - Below Order Form */}
        {selectedService && (
          <Card className="max-w-2xl mt-6">
            <CardHeader>
              <CardTitle>{t('smmServiceInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('smmServiceId')}:</span>
                  <span className="ml-2 font-medium">{selectedService.external_service_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmPrice')}:</span>
                  <span className="ml-2 font-medium">{formatPrice(convertToVND(getSellingPrice(selectedService)))}/1000</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmMin')}:</span>
                  <span className="ml-2 font-medium">{selectedService.min_quantity.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('smmMax')}:</span>
                  <span className="ml-2 font-medium">{selectedService.max_quantity.toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('smmAvgCompletionTime')}:</span>
                  <span className="ml-2 font-medium">{selectedService.processing_time || 'N/A'}</span>
                </div>
                {selectedService.has_refill && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{t('smmRefillPolicy')}:</span>
                    <span className="ml-2 font-medium">{selectedService.refill_policy || 'Có bảo hành'}</span>
                  </div>
                )}
              </div>
              {selectedService.description && (
                <div className="pt-3 border-t">
                  <span className="text-muted-foreground text-sm">{t('smmDescription')}:</span>
                  <div 
                    className="mt-1 text-sm prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedService.description) }}
                  />
                </div>
              )}
              <div className="pt-3 border-t">
                <span className="text-muted-foreground text-sm">{t('smmServiceName')}:</span>
                <p className="mt-1 font-medium">{selectedService.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SmmOrderPage;