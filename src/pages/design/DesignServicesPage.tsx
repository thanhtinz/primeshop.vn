import { useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, RefreshCw, Image as ImageIcon, Package } from 'lucide-react';
import { useDesignCategories, useDesignServices } from '@/hooks/useDesignServices';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { AnimeCard } from '@/components/ui/anime-card';

export default function DesignServicesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const categorySlug = slug || searchParams.get('category');
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  
  const { data: categories } = useCategories();
  const category = categories?.find(c => c.slug === categorySlug && c.style === 'design');
  
  const { data: designCategories, isLoading: categoriesLoading } = useDesignCategories();
  const selectedCategory = designCategories?.find(c => c.slug === categorySlug);
  const { data: services, isLoading: servicesLoading } = useDesignServices(selectedCategory?.id);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(services || [], { itemsPerPage: 24 });

  // Reset page when category changes
  useEffect(() => {
    resetPage();
  }, [categorySlug]);

  const getCategoryName = (cat: typeof category) => {
    if (!cat) return language === 'en' ? 'Design Services' : 'Thiết Kế Ảnh';
    return language === 'en' && cat.name_en ? cat.name_en : cat.name;
  };

  if (!category && !categoriesLoading && categorySlug) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">{t('categoryNotFound')}</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Banner - Large Category Image Only */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-muted">
        {category?.image_url ? (
          <img 
            src={category.image_url} 
            alt={getCategoryName(category)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
        )}
      </div>

      {/* Services Grid */}
      <section className="py-4 md:py-6">
        <div className="container">
          {servicesLoading ? (
            <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : services && services.length > 0 ? (
            <>
              <StaggerContainer className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {paginatedItems.map((service) => (
                  <StaggerItem key={service.id}>
                    <AnimeCard animation="pop">
                      <Link to={`/design/service/${service.id}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden border-border hover:border-primary/50">
                          {/* Portfolio Image */}
                          <div className="aspect-square relative bg-muted overflow-hidden">
                            {service.portfolio_images && service.portfolio_images.length > 0 ? (
                              <img
                                src={service.portfolio_images[0]}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          <CardContent className="p-2 md:p-3">
                            {/* Seller Info */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={service.seller?.shop_avatar_url || ''} />
                                <AvatarFallback className="text-[10px]">{service.seller?.shop_name?.charAt(0) || 'S'}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate flex-1">
                                {service.seller?.shop_name}
                              </span>
                              {(service.seller?.trust_score || 0) >= 80 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 text-green-600 border-green-600">
                                  ✓
                                </Badge>
                              )}
                            </div>

                            {/* Service Name */}
                            <h3 className="font-medium text-xs md:text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                              {service.name}
                            </h3>

                            {/* Stats - Compact */}
                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground mb-2">
                              {service.rating_count > 0 && (
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{service.average_rating.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                <span>{service.delivery_days}d</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <RefreshCw className="h-3 w-3" />
                                <span>{service.revision_count}</span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm md:text-base font-bold text-primary">
                                {formatPrice(service.price)}
                              </span>
                              {service.completed_orders > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {service.completed_orders} {language === 'en' ? 'sold' : 'đã bán'}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </AnimeCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
                className="mt-6"
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/30">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {language === 'en' ? 'No services available in this category' : 'Chưa có dịch vụ nào trong danh mục này'}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
