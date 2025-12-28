import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Star, Clock, ChevronRight, ArrowRight, BadgeCheck } from 'lucide-react';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { useDesignCategories, useDesignServices } from '@/hooks/useDesignServices';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { TiltCard } from '@/components/ui/tilt-card';
import { Skeleton } from '@/components/ui/skeleton';

export function DesignServicesSection() {
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const { data: categories, isLoading: loadingCategories } = useDesignCategories();
  const { data: services, isLoading: loadingServices } = useDesignServices();

  // Get top 4 services
  const topServices = services?.slice(0, 4) || [];

  if (!loadingCategories && !loadingServices && (!categories?.length || !services?.length)) {
    return null;
  }

  return (
    <ScrollReveal animation="fade-up" delay={150}>
      <section className="py-6 md:py-10 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Palette className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-bold">Thiết kế ảnh</h2>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                  Dịch vụ thiết kế chuyên nghiệp từ các designer hàng đầu
                </p>
              </div>
            </div>
            <Link to="/design" className="flex items-center gap-1 text-xs md:text-sm text-primary hover:underline">
              Xem tất cả <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Link>
          </div>

          {/* Categories Pills */}
          {loadingCategories ? (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <Link to="/design">
                <Badge variant="secondary" className="px-3 py-1.5 text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap">
                  Tất cả
                </Badge>
              </Link>
              {categories?.slice(0, 6).map((category) => (
                <Link key={category.id} to={`/design/category/${category.slug}`}>
                  <Badge variant="outline" className="px-3 py-1.5 text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap">
                    {language === 'en' && category.name_en ? category.name_en : category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Services Grid */}
          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full rounded-lg mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {topServices.map((service) => (
                <StaggerItem key={service.id}>
                  <TiltCard maxTilt={3} scale={1.005}>
                    <Link to={`/design/service/${service.id}`}>
                      <Card className="h-full overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                        <CardContent className="p-0">
                          {/* Portfolio Image */}
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-purple-500/10 overflow-hidden">
                            {service.portfolio_images?.[0] ? (
                              <img
                                src={service.portfolio_images[0]}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette className="w-12 h-12 text-primary/30" />
                              </div>
                            )}
                            {/* Category badge */}
                            {service.category && (
                              <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-[10px]">
                                {language === 'en' && service.category.name_en ? service.category.name_en : service.category.name}
                              </Badge>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-3 md:p-4">
                            {/* Seller info */}
                            {service.seller && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Palette className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  {service.seller.shop_name}
                                  {service.seller.is_verified && (
                                    <BadgeCheck className="h-3 w-3 text-primary fill-primary/20 shrink-0" />
                                  )}
                                  {service.seller.is_partner && (
                                    <PartnerBadge size="sm" variant="icon-only" />
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Service name */}
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                              {service.name}
                            </h3>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {service.average_rating.toFixed(1)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.delivery_days} ngày
                              </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Giá từ</span>
                              <span className="font-bold text-primary">{formatPrice(service.price)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* CTA */}
          <div className="mt-6 text-center">
            <Link to="/design">
              <Button variant="outline" className="gap-2">
                Khám phá thêm dịch vụ
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}
