import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useSmmPlatforms, useSmmServiceTypes, useSmmServices, SmmService } from '@/hooks/useSmm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const SmmServicesPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { formatPrice, convertToVND } = useCurrency();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: platforms = [] } = useSmmPlatforms();
  const { data: serviceTypes = [] } = useSmmServiceTypes(selectedPlatform || undefined);
  const { data: services = [] } = useSmmServices();

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
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.external_service_id.toString().includes(searchQuery);
    return matchesPlatform && matchesServiceType && matchesSearch && service.is_active;
  });

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

  const handleSelectService = (service: SmmService) => {
    navigate(`/smm/order?serviceId=${service.id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('smmServices')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('smmServicesDesc')}
            {vipTierName !== 'member' && (
              <span className="ml-2 text-primary font-medium">
                (VIP {vipTierName.charAt(0).toUpperCase() + vipTierName.slice(1)})
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('smmSearchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedPlatform || "all"} onValueChange={(v) => {
            setSelectedPlatform(v === "all" ? "" : v);
            setSelectedServiceType("");
          }}>
            <SelectTrigger>
              <SelectValue placeholder={t('smmPlatform')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('smmAllPlatforms')}</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedServiceType || "all"} onValueChange={(v) => setSelectedServiceType(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={t('smmServiceType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('smmAllServiceTypes')}</SelectItem>
              {serviceTypes.map((st) => (
                <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services List */}
        <div className="space-y-2">
          {filteredServices.map((service) => (
            <Card 
              key={service.id}
              className="cursor-pointer transition-all hover:border-primary"
              onClick={() => handleSelectService(service)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        #{service.external_service_id}
                      </span>
                      {service.service_type?.platform && (
                        <Badge variant="outline" className="text-xs">
                          {service.service_type.platform.name}
                        </Badge>
                      )}
                      {service.service_type && (
                        <Badge variant="secondary" className="text-xs">
                          {service.service_type.name}
                        </Badge>
                      )}
                      {service.has_refill && (
                        <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('smmWarranty')}</Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm md:text-base truncate">{service.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>{t('smmMin')}: {service.min_quantity.toLocaleString()}</span>
                      <span>{t('smmMax')}: {service.max_quantity.toLocaleString()}</span>
                      {service.processing_time && <span>{t('smmETA')}: {service.processing_time}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">
                      {formatPrice(convertToVND(getSellingPrice(service)))}
                    </p>
                    <p className="text-xs text-muted-foreground">/1000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('smmNoServiceFound')}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SmmServicesPage;