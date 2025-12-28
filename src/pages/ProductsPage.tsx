import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { usePagination } from '@/hooks/usePagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Search, Filter, Sparkles, X, SlidersHorizontal, Zap, Star, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopupProductCard } from '@/components/product/TopupProductListCard';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { ProductCardSkeleton } from '@/components/ui/skeletons';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { language } = useLanguage();
  
  const styleFromUrl = searchParams.get('style') as 'premium' | 'game_topup' | null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>(styleFromUrl || 'all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (styleFromUrl) {
      setSelectedStyle(styleFromUrl);
    }
  }, [styleFromUrl]);

  const premiumCategories = categories?.filter(c => (c.style || 'premium') === 'premium') || [];

  const getCategoryName = (category: any) => {
    if (language === 'en' && category.name_en) {
      return category.name_en;
    }
    return category.name;
  };

  const filteredProducts = useMemo(() => {
    let result = products || [];

    // Style filter
    if (selectedStyle !== 'all') {
      result = result.filter(p => (p.style || 'premium') === selectedStyle);
    } else {
      result = result.filter(p => (p.style || 'premium') === 'premium');
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.short_description?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category_id === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedStyle, sortBy]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredProducts, { itemsPerPage: 20 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [searchQuery, selectedCategory, selectedStyle, sortBy]);

  const getPriceRange = (product: typeof products[0]) => {
    if (!product?.packages || product.packages.length === 0) return null;
    const prices = product.packages.filter(p => p.is_active).map(p => p.price);
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStyle('all');
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedStyle !== 'all' || sortBy !== 'newest';

  const isTopupMode = selectedStyle === 'game_topup';

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {isTopupMode ? t('topUp') : t('allProducts')}
          </h1>
          <p className="text-muted-foreground">
            {isTopupMode ? t('searchFastTopup') : t('explorePremium')}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Style Filter */}
            <Select value={selectedStyle} onValueChange={(value) => {
              setSelectedStyle(value);
              if (value === 'all') {
                searchParams.delete('style');
              } else {
                searchParams.set('style', value);
              }
              setSearchParams(searchParams);
            }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="game_topup">{t('topUpGame')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter - only for premium */}
            {!isTopupMode && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  {premiumCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{getCategoryName(cat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t('sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('newest')}</SelectItem>
                <SelectItem value="oldest">{t('oldest')}</SelectItem>
                <SelectItem value="name-asc">{t('nameAZ')}</SelectItem>
                <SelectItem value="name-desc">{t('nameZA')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{t('filters')}:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {(() => { const cat = premiumCategories.find(c => c.id === selectedCategory); return cat ? getCategoryName(cat) : ''; })()}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7">
                {t('clearAllProducts')}
              </Button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {t('showingProducts')} <span className="font-medium text-foreground">{startIndex}-{endIndex}</span> {t('ofProducts')}{' '}
            <span className="font-medium text-foreground">{totalItems}</span> {t('totalProducts')}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          isTopupMode ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-card border border-border">
                  <div className="w-24 h-24 bg-muted animate-pulse rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : paginatedItems.length > 0 ? (
          <>
            {isTopupMode ? (
              <StaggerContainer className="space-y-3">
                {paginatedItems.map((product) => (
                  <StaggerItem key={product.id}>
                    <TopupProductCard
                      product={product}
                      priceRange={getPriceRange(product)}
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {paginatedItems.map((product) => (
                  <StaggerItem key={product.id}>
                    {(() => {
                      const primaryImage = product.images?.find(img => img.is_primary)?.image_url 
                        || product.images?.[0]?.image_url 
                        || product.image_url;
                      return (
                        <Link
                          to={`/product/${product.slug}`}
                          className="group rounded-xl bg-card border border-border hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 block"
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
                              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">HOT</Badge>
                            )}
                          </div>
                          <div className="p-3">
                            {product.category && (
                              <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
                                {language === 'en' && product.category.name_en ? product.category.name_en : product.category.name}
                              </span>
                            )}
                            <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors mt-0.5">
                              {product.name}
                            </h3>
                            {product.short_description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{product.short_description}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })()}
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
            
            {/* Pagination */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              showInfo={false}
              className="mt-6"
            />
          </>
        ) : (
          <div className="text-center py-16 rounded-xl border border-dashed border-border bg-card/50">
            <SlidersHorizontal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">{t('noProductsFound')}</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>{t('clearFilters')}</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
