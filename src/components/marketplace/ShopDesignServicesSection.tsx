import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Clock, Star, RefreshCw, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useSellerDesignServices, useDesignCategories } from '@/hooks/useDesignServices';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShopDesignServicesSectionProps {
  sellerId: string;
  availabilityStatus?: string | null;
  availabilityReason?: string | null;
  availabilityUntil?: string | null;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'available':
      return {
        label: 'Sẵn sàng nhận đơn',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      };
    case 'busy':
      return {
        label: 'Đang bận',
        icon: AlertCircle,
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'away':
      return {
        label: 'Nghỉ phép',
        icon: Calendar,
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      };
    default:
      return {
        label: 'Sẵn sàng nhận đơn',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      };
  }
};

export function ShopDesignServicesSection({ 
  sellerId, 
  availabilityStatus,
  availabilityReason,
  availabilityUntil,
}: ShopDesignServicesSectionProps) {
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const { language } = useLanguage();
  const { data: services = [], isLoading } = useSellerDesignServices(sellerId);
  const { data: allCategories = [] } = useDesignCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Only show active services
  const activeServices = services.filter(s => s.is_active);
  
  // Filter services by selected category
  const filteredServices = selectedCategory === 'all' 
    ? activeServices 
    : activeServices.filter(s => s.category_id === selectedCategory);
  
  const statusConfig = getStatusConfig(availabilityStatus || 'available');
  const StatusIcon = statusConfig.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Dịch vụ thiết kế {activeServices.length > 0 && `(${activeServices.length})`}
        </h2>
        
        {/* Availability Status Badge */}
        {availabilityStatus && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.className}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{statusConfig.label}</span>
          </div>
        )}
      </div>
      
      {/* Status Info */}
      {availabilityStatus && availabilityStatus !== 'available' && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 mt-0.5 ${
                availabilityStatus === 'busy' ? 'text-amber-500' : 'text-gray-500'
              }`} />
              <div className="space-y-1">
                <p className="font-medium">{statusConfig.label}</p>
                {availabilityReason && (
                  <p className="text-sm text-muted-foreground">{availabilityReason}</p>
                )}
                {availabilityUntil && (
                  <p className="text-xs text-muted-foreground">
                    Đến: {formatDate(availabilityUntil)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Design Categories Filter - Always show if categories exist */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={selectedCategory === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Tất cả ({activeServices.length})
          </Button>
          {allCategories.map((cat) => (
            <Button 
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name} ({activeServices.filter(s => s.category_id === cat.id).length})
            </Button>
          ))}
        </div>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Palette className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Chưa có dịch vụ thiết kế</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Link
              key={service.id}
              to={`/design/service/${service.id}`}
              className="group block"
            >
              <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg h-full">
                {/* Service Image */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {service.portfolio_images?.[0] ? (
                    <img
                      src={service.portfolio_images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Palette className="h-12 w-12 text-purple-500/30" />
                    </div>
                  )}
                  {service.category && (
                    <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs">
                      {language === 'en' && service.category.name_en ? service.category.name_en : service.category.name}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4 space-y-3">
                  {/* Service Name */}
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  
                  {/* Info */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{service.delivery_days} ngày</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>{service.revision_count} lần sửa</span>
                    </div>
                    {service.rating_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{service.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="pt-2 border-t">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
