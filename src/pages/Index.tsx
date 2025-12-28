import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { useProducts, useProductsByStyle } from '@/hooks/useProducts';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useVouchers } from '@/hooks/useVouchers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ArrowRight, Sparkles, ShoppingBag, Users, Gift, Zap, RefreshCw, ChevronRight, Gamepad2, TrendingUp, Search, ChevronDown } from 'lucide-react';
import { GameAccountCategoryCard } from '@/components/product/GameAccountCategoryCard';
import { HeroBannerCarousel } from '@/components/home/HeroBannerCarousel';
import { CategorySidebar } from '@/components/home/CategorySidebar';
import { SidePromoBanners, QuickActionBanners } from '@/components/home/PromoBanners';
import { TopupProductCard as TopupProductListCard } from '@/components/product/TopupProductListCard';
import { NewsSection } from '@/components/home/NewsSection';
import { EventBanner } from '@/components/home/EventBanner';
import { FlashSaleBanner } from '@/components/home/FlashSaleBanner';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { FlashSalePurchaseNotification } from '@/components/home/FlashSalePurchaseNotification';
import { AuctionBanner } from '@/components/home/AuctionBanner';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { ProductCardSkeleton, CategoryCardSkeleton } from '@/components/ui/skeletons';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { TiltCard } from '@/components/ui/tilt-card';
import { DailyCheckinWidget } from '@/components/checkin/DailyCheckinWidget';

import { DesignCategoriesSection } from '@/components/home/DesignCategoriesSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { RegisterCTASection } from '@/components/home/RegisterCTASection';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { data: categories, isLoading: loadingCategories, error: errorCategories, refetch: refetchCategories } = useCategories();
  const { data: products, isLoading: loadingProducts, error: errorProducts, refetch: refetchProducts } = useProducts();
  const { data: topupProducts, isLoading: loadingTopup } = useProductsByStyle('game_topup');
  const { data: siteSettings } = useSiteSettings();
  const { data: vouchers } = useVouchers();
  const [showTimeout, setShowTimeout] = useState(false);
  const [topupPage, setTopupPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const TOPUP_PER_PAGE = 5;
  const ACCOUNT_PER_PAGE = 6;

  const referralPercent = siteSettings?.referral_commission_percent || 10;
  const welcomeVoucher = vouchers?.find(v => 
    v.is_active && v.code.toLowerCase().includes('welcome')
  ) || vouchers?.find(v => v.is_active);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingProducts || loadingCategories) setShowTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loadingProducts, loadingCategories]);

  useEffect(() => {
    if (!loadingProducts && !loadingCategories) setShowTimeout(false);
  }, [loadingProducts, loadingCategories]);

  const featuredProducts = products?.filter(p => p.is_featured && (p.style || 'premium') === 'premium').slice(0, 10) || [];
  const allGameAccountCategories = categories?.filter(c => (c.style || 'premium') === 'game_account') || [];
  const allTopupProducts = topupProducts || [];
  
  // Pagination for Account categories
  const totalAccountPages = Math.ceil(allGameAccountCategories.length / ACCOUNT_PER_PAGE);
  const displayAccountCategories = allGameAccountCategories.slice(
    (accountPage - 1) * ACCOUNT_PER_PAGE,
    accountPage * ACCOUNT_PER_PAGE
  );
  
  // Pagination for Topup products  
  const totalTopupPages = Math.ceil(allTopupProducts.length / TOPUP_PER_PAGE);
  const displayTopupProducts = allTopupProducts.slice(
    (topupPage - 1) * TOPUP_PER_PAGE,
    topupPage * TOPUP_PER_PAGE
  );

  // Get marketplace product counts by category
  const { data: marketplaceProductCounts } = useQuery({
    queryKey: ['marketplace-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_products')
        .select('category')
        .eq('status', 'available');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return counts;
    }
  });

  const getPriceRange = (product: typeof topupProducts[0]) => {
    if (!product?.packages || product.packages.length === 0) return null;
    const prices = product.packages.filter(p => p.is_active).map(p => p.price);
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const getProductCount = (categorySlug: string) => marketplaceProductCounts?.[categorySlug] || 0;

  const handleRetry = () => {
    setShowTimeout(false);
    refetchCategories();
    refetchProducts();
  };

  const hasError = errorCategories || errorProducts;

  const getVoucherText = () => {
    if (!welcomeVoucher) return null;
    return welcomeVoucher.discount_type === 'percentage' 
      ? `${t('discount')} ${welcomeVoucher.discount_value}%`
      : `${t('discount')} ${formatPrice(welcomeVoucher.discount_value)}`;
  };

  return (
    <Layout>

      {/* Flash Sale Purchase Notifications */}
      <FlashSalePurchaseNotification />
      
      {/* Flash Sale Banner */}
      <FlashSaleBanner />
      
      {/* Event Banner */}
      <div className="pt-4">
        <EventBanner />
      </div>

      <div className="container py-4">
        {/* Hero Section - Divine Shop Style */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Category Sidebar - Hidden on mobile */}
          <CategorySidebar />
          
          {/* Main Banner - Full width */}
          <div className="flex-1 min-w-0">
            <HeroBannerCarousel />
          </div>
        </div>

        {/* Quick Action Banners - Better mobile grid */}
        <div className="mb-6 md:mb-8">
          <QuickActionBanners />
        </div>

        {/* Auction Banner */}
        <AuctionBanner />
      </div>

      {/* Error/Timeout State */}
      {(hasError || showTimeout) && (
        <section className="py-4">
          <div className="container">
            <div className="text-center py-6 rounded-xl bg-card border border-border">
              <p className="text-muted-foreground mb-3 text-sm">
                {hasError ? t('error') : t('loading')}
              </p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('refresh')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Flash Sale Products Section */}
      <FlashSaleSection />

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <ScrollReveal animation="fade-up">
          <section className="py-6 md:py-10">
            <div className="container">
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold">{t('featuredProducts')}</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{t('featuredProductsDesc')}</p>
                </div>
                <Link to="/products" className="flex items-center gap-1 text-xs md:text-sm text-primary hover:underline">
                  {t('viewAll')} <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </div>
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                  {[...Array(10)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                  {featuredProducts.map((product) => {
                    const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
                      || product.images?.[0]?.image_url 
                      || product.image_url;
                    return (
                    <StaggerItem key={product.id}>
                      <Link
                        to={`/product/${product.slug}`}
                        className="group rounded-xl bg-card border border-border hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] block hover:scale-[1.02]"
                      >
                        <div className="relative aspect-square bg-secondary">
                          {primaryImage ? (
                            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                          {product.is_featured && (
                            <Badge className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-destructive text-destructive-foreground text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5">HOT</Badge>
                          )}
                        </div>
                        <div className="p-2 md:p-3">
                          <h3 className="font-medium text-xs md:text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          {product.short_description && (
                            <p className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-muted-foreground line-clamp-1">{product.short_description}</p>
                          )}
                        </div>
                      </Link>
                    </StaggerItem>
                  )})}
                </StaggerContainer>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Game Account Section */}
      {allGameAccountCategories.length > 0 && (
        <ScrollReveal animation="fade-up" delay={100}>
          <section className="py-6 md:py-10 bg-muted/30">
            <div className="container">
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold">{t('gameAccounts')}</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{t('gameAccountsDesc')}</p>
                </div>
              </div>
              {loadingCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                    {displayAccountCategories.map((category, index) => (
                      <StaggerItem key={category.id}>
                        <GameAccountCategoryCard category={category} productCount={getProductCount(category.slug)} colorIndex={index} />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                  
                  {/* Account Pagination */}
                  {totalAccountPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAccountPage(p => Math.max(1, p - 1))}
                        disabled={accountPage === 1}
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {accountPage} / {totalAccountPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAccountPage(p => Math.min(totalAccountPages, p + 1))}
                        disabled={accountPage === totalAccountPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Game Topup Section */}
      {(displayTopupProducts.length > 0 || loadingTopup) && (
        <ScrollReveal animation="fade-up" delay={200}>
          <section className="py-6 md:py-10">
            <div className="container">
              <div className="flex items-center justify-between mb-4 md:mb-5">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold">{t('topUp')}</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{t('topUpDesc')}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/products?style=game_topup')}
                  className="gap-1 md:gap-2 h-8 px-2 md:px-3 text-xs md:text-sm"
                >
                  <Search className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{t('search')}</span>
                </Button>
              </div>
              
              <div className="space-y-3">
                {loadingTopup && displayTopupProducts.length === 0 ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl bg-card border border-border">
                      <div className="w-24 h-24 bg-muted animate-pulse rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  displayTopupProducts.map((product) => (
                    <TopupProductListCard
                      key={product.id}
                      product={product}
                      priceRange={getPriceRange(product)}
                    />
                  ))
                )}
              </div>

              {/* Topup Pagination */}
              {totalTopupPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupPage(p => Math.max(1, p - 1))}
                    disabled={topupPage === 1}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {topupPage} / {totalTopupPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupPage(p => Math.min(totalTopupPages, p + 1))}
                    disabled={topupPage === totalTopupPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Design Categories Section */}
      <DesignCategoriesSection />


      {/* News Section */}
      <NewsSection />



      {/* Empty State - only show if truly nothing available */}
      {!loadingProducts && featuredProducts.length === 0 && allGameAccountCategories.length === 0 && displayTopupProducts.length === 0 && (
        <section className="py-8">
          <div className="container">
            <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t('noData')}</p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <ScrollReveal animation="zoom-in" delay={300}>
        <section className="py-6 md:py-10">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <TiltCard maxTilt={5} scale={1.01} className="h-full">
                <div className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors active:scale-[0.99] h-full flex flex-col">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center mb-2 md:mb-3">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2">{t('referral')}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 flex-1">
                    {t('referralCTAPrefix')} <span className="text-primary font-semibold">{referralPercent}%</span> {t('referralCTASuffix')}
                  </p>
                  <Link to="/referral">
                    <Button size="sm" className="text-xs md:text-sm h-8 md:h-9">{t('joinNow')} <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" /></Button>
                  </Link>
                </div>
              </TiltCard>

              <TiltCard maxTilt={5} scale={1.01} className="h-full">
                <div className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors active:scale-[0.99] h-full flex flex-col">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary flex items-center justify-center mb-2 md:mb-3">
                    <Gift className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2">{t('specialOffers')}</h3>
                  <div className="flex-1">
                    {welcomeVoucher ? (
                      <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">
                        {t('useCode')} <code className="px-1.5 md:px-2 py-0.5 md:py-1 bg-primary/10 text-primary rounded-md font-mono text-[10px] md:text-xs">{welcomeVoucher.code}</code> {t('toGet')} {getVoucherText()}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">{t('discountAwaiting')}</p>
                    )}
                  </div>
                  <Link to="/settings/vouchers">
                    <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5 text-xs md:text-sm h-8 md:h-9">
                      {t('viewNow')} <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                    </Button>
                  </Link>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Partners Section - above footer */}
      <PartnersSection />

      {/* Register CTA Section - only show when not logged in */}
      <RegisterCTASection />
    </Layout>
  );
};

export default Index;
