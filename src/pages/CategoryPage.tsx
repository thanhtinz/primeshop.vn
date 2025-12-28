import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Package, Zap, Pin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { GameAccountCard } from '@/components/product/GameAccountCard';
import { GameAccountFilter, FilterValues } from '@/components/product/GameAccountFilter';
import { useProductsByCategory, ProductWithRelations } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useSellerProducts, SellerProduct, Seller } from '@/hooks/useMarketplace';
import { useActiveBoosts } from '@/hooks/useProductBoosts';
import { useAllActiveSellerFlashSales } from '@/hooks/useSellerFlashSale';
import { StaggerContainer, StaggerItem } from '@/components/ui/stagger-container';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import { Badge } from '@/components/ui/badge';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

const initialFilters: FilterValues = {
  search: '',
  rank: [],
  minChampions: '',
  maxChampions: '',
  minSkins: '',
  maxSkins: '',
  minPrice: '',
  maxPrice: '',
};

// Combined product type for display
interface CombinedProduct {
  id: string;
  product: ProductWithRelations;
  isMarketplace: boolean;
  seller?: Seller;
  marketplaceProductId?: string;
  marketplaceCategory?: string;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProductsByCategory(slug || '');
  const { data: marketplaceProducts, isLoading: loadingMarketplace } = useSellerProducts();
  // Fetch all active boosts that affect category display (category_top, marketplace_top, shop_featured)
  const { data: allBoosts = [] } = useActiveBoosts();
  // Fetch all active seller flash sales
  const { data: flashSaleData } = useAllActiveSellerFlashSales();
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  
  const category = categories?.find(c => c.slug === slug);
  const isGameAccount = (category?.style || 'premium') === 'game_account';
  const isGameTopup = category?.style === 'game_topup';
  
  // Get boosted product IDs - applies to all boost types for game_account style
  const boostedProductIds = useMemo(() => {
    return allBoosts
      .filter(b => b.product && b.status === 'active')
      .map(b => b.product_id);
  }, [allBoosts]);
  
  // Use flash sale map from hook
  const flashSaleMap = flashSaleData?.flashSaleMap || new Map();

  // Combine admin products with marketplace products for game_account style
  const combinedProducts = useMemo<CombinedProduct[]>(() => {
    const combined: CombinedProduct[] = [];
    
    // Add admin products
    if (products) {
      products.forEach(p => {
        combined.push({
          id: `admin-${p.id}`,
          product: p,
          isMarketplace: false
        });
      });
    }
    
    // Add marketplace products for game_account category
    if (isGameAccount && marketplaceProducts && slug) {
      marketplaceProducts
        .filter(mp => mp.category === slug)
        .forEach(mp => {
          // Convert marketplace product to ProductWithRelations format
          const convertedProduct: ProductWithRelations = {
            id: mp.id,
            name: mp.title,
            slug: mp.id,
            description: mp.description,
            short_description: null,
            image_url: mp.images?.[0] || null,
            category_id: null,
            is_active: true,
            is_featured: mp.is_featured || false,
            style: 'game_account',
            sort_order: 0,
            created_at: mp.created_at,
            updated_at: mp.updated_at,
            price: mp.price,
            account_info: mp.account_info as Record<string, string> | null,
            tags: [],
            external_api: null,
            external_category_id: null,
            usage_guide: null,
            warranty_info: null,
            images: mp.images?.map((url, idx) => ({
              id: `img-${idx}`,
              product_id: mp.id,
              image_url: url,
              is_primary: idx === 0,
              sort_order: idx,
              created_at: mp.created_at
            })) || [],
            packages: [],
            custom_fields: [],
            category: null
          };
          
          combined.push({
            id: `marketplace-${mp.id}`,
            product: convertedProduct,
            isMarketplace: true,
            seller: mp.seller,
            marketplaceProductId: mp.id,
            marketplaceCategory: mp.category
          });
        });
    }
    
    // Sort: boosted products first, then by created_at desc
    return combined.sort((a, b) => {
      const aIsBoosted = boostedProductIds.includes(a.marketplaceProductId || a.product.id);
      const bIsBoosted = boostedProductIds.includes(b.marketplaceProductId || b.product.id);
      
      // Boosted products come first
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
      
      // Then sort by created_at desc
      return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime();
    });
  }, [products, marketplaceProducts, isGameAccount, slug, boostedProductIds]);

  // Helper function to convert account_info to key-value object
  const getAccountInfoAsObject = (accountInfo: any): Record<string, string> => {
    if (!accountInfo) return {};
    
    // If it's an array of {name, value} objects
    if (Array.isArray(accountInfo)) {
      const result: Record<string, string> = {};
      accountInfo.forEach((item: any) => {
        if (item?.name && item?.value !== undefined) {
          result[item.name] = String(item.value);
        }
      });
      return result;
    }
    
    // If it's already a simple object
    if (typeof accountInfo === 'object') {
      return accountInfo as Record<string, string>;
    }
    
    return {};
  };

  // Filter products for game account style
  const filteredProducts = useMemo(() => {
    if (!isGameAccount) return combinedProducts;

    return combinedProducts.filter(({ product }) => {
      const accountInfo = getAccountInfoAsObject(product.account_info);
      const price = product.price || 0;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(searchLower);
        const matchesSlug = product.slug.toLowerCase().includes(searchLower);
        const matchesInfo = Object.values(accountInfo).some(
          (val) => val?.toString().toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesSlug && !matchesInfo) return false;
      }

      // Rank filter - check multiple possible field names
      if (filters.rank.length > 0) {
        const productRank = accountInfo['Hạng'] || accountInfo['Rank'] || accountInfo['rank'] || '';
        if (!filters.rank.some(r => productRank.toLowerCase().includes(r.toLowerCase()))) {
          return false;
        }
      }

      // Champions filter - check multiple possible field names
      const championsStr = accountInfo['Tướng'] || accountInfo['Số tướng'] || accountInfo['Champions'] || '0';
      const champions = parseInt(championsStr.replace(/\D/g, '')) || 0;
      if (filters.minChampions && champions < parseInt(filters.minChampions)) return false;
      if (filters.maxChampions && champions > parseInt(filters.maxChampions)) return false;

      // Skins filter - check multiple possible field names
      const skinsStr = accountInfo['Trang phục'] || accountInfo['Skin'] || accountInfo['Skins'] || '0';
      const skins = parseInt(skinsStr.replace(/\D/g, '')) || 0;
      if (filters.minSkins && skins < parseInt(filters.minSkins)) return false;
      if (filters.maxSkins && skins > parseInt(filters.maxSkins)) return false;

      // Price filter
      if (filters.minPrice && price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && price > parseInt(filters.maxPrice)) return false;

      return true;
    });
  }, [combinedProducts, filters, isGameAccount]);

  // Extract available ranks from products
  const availableRanks = useMemo(() => {
    if (!isGameAccount) return [];
    const ranks = new Set<string>();
    combinedProducts.forEach(({ product }) => {
      const accountInfo = getAccountInfoAsObject(product.account_info);
      const rank = accountInfo['Hạng'] || accountInfo['Rank'] || accountInfo['rank'];
      if (rank) ranks.add(rank);
    });
    return Array.from(ranks);
  }, [combinedProducts, isGameAccount]);

  const displayProducts = isGameAccount ? filteredProducts : combinedProducts;
  const isLoadingAll = isLoading || (isGameAccount && loadingMarketplace);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(displayProducts, { itemsPerPage: 24 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [filters, slug]);

  if (!category && !isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Danh mục không tồn tại</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header for Game Topup Style */}
      {isGameTopup ? (
        <div className="bg-gradient-to-b from-orange-500/10 to-background">
          <div className="container py-6">
            <div className="flex items-start gap-4">
              {category?.image_url && (
                <img 
                  src={category.image_url} 
                  alt={category?.name} 
                  className="w-20 h-20 object-contain rounded-xl"
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {category?.name}
                </h1>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-sm">
                  <Zap className="h-4 w-4" />
                  Giao hàng ngay lập tức
                </div>
                {category?.description && (
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : isGameAccount ? (
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <div className="container py-6">
            <div className="flex items-start gap-4">
              {category?.image_url && (
                <img 
                  src={category.image_url} 
                  alt={category?.name} 
                  className="w-20 h-20 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  Tài khoản {category?.name}
                </h1>
                {category?.description && (
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Breadcrumb for Premium Style */}
          <div className="border-b border-border/50">
            <div className="container py-4">
              <nav className="flex items-center gap-2 text-sm">
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Trang chủ
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{category?.name}</span>
              </nav>
            </div>
          </div>

          {/* Header for Premium Style */}
          <section className="py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            <div className="container relative">
              <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">
                Danh mục
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{category?.name}</h1>
              {category?.description && (
                <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* Filter for Game Account */}
      {isGameAccount && (
        <div className="container py-4">
          <GameAccountFilter
            filters={filters}
            onFiltersChange={setFilters}
            availableRanks={availableRanks.length > 0 ? availableRanks : undefined}
          />
        </div>
      )}

      {/* Products */}
      <section className={isGameAccount || isGameTopup ? "py-4" : "py-12"}>
        <div className="container">
          {isLoadingAll ? (
            <div className={`grid gap-3 md:gap-4 ${isGameAccount ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:gap-6 lg:grid-cols-4 xl:grid-cols-6'}`}>
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : displayProducts && displayProducts.length > 0 ? (
            <>
              <StaggerContainer className={`grid gap-3 md:gap-4 ${isGameAccount ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : isGameTopup ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 md:gap-6 lg:grid-cols-4 xl:grid-cols-6'}`}>
                {paginatedItems.map((item) => {
                  const isBoosted = boostedProductIds.includes(item.marketplaceProductId || item.product.id);
                  const productFlashSale = item.marketplaceProductId ? flashSaleMap.get(item.marketplaceProductId) : null;
                  return (
                    <StaggerItem key={item.id}>
                      {isGameAccount ? (
                        <GameAccountCard 
                          product={item.product} 
                          seller={item.seller}
                          isMarketplace={item.isMarketplace}
                          marketplaceProductId={item.marketplaceProductId}
                          marketplaceCategory={item.marketplaceCategory}
                          isBoosted={isBoosted}
                          flashSale={productFlashSale}
                        />
                      ) : (
                        <ProductCard product={item.product} />
                      )}
                    </StaggerItem>
                  );
                })}
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
                {isGameAccount && (filters.search || filters.rank.length > 0 || filters.minChampions || filters.maxChampions || filters.minSkins || filters.maxSkins || filters.minPrice || filters.maxPrice)
                  ? 'Không tìm thấy acc phù hợp với bộ lọc'
                  : 'Chưa có sản phẩm trong danh mục này'
                }
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryPage;
