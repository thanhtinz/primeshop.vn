import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Store, Star, 
  TrendingUp, Package, BadgeCheck, Users, Folder, Gamepad2, Palette
} from 'lucide-react';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { useApprovedSellers, useSellerProducts } from '@/hooks/useMarketplace';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { useDesignServices, useDesignCategories } from '@/hooks/useDesignServices';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { motion } from 'framer-motion';

type ShopType = 'all' | 'game' | 'design';

interface UnifiedShop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_avatar_url: string | null;
  shop_description: string | null;
  is_verified: boolean;
  is_partner: boolean;
  rating_average: number;
  total_sales: number;
  created_at: string;
  type: 'game' | 'design';
  product_count?: number;
  service_count?: number;
  categories?: string[];
}

export default function ShopsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [shopType, setShopType] = useState<ShopType>('all');
  
  const { data: sellers = [], isLoading: loadingSellers } = useApprovedSellers();
  const { data: products = [] } = useSellerProducts();
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: designServices = [], isLoading: loadingDesign } = useDesignServices();
  const { data: designCategories = [] } = useDesignCategories();

  // Create unified shop list
  const unifiedShops = useMemo(() => {
    const shops: UnifiedShop[] = [];
    
    // First, collect all sellers that have design services
    const designSellerMap = new Map<string, { services: typeof designServices, seller: any }>();
    designServices.forEach(service => {
      if (!designSellerMap.has(service.seller_id)) {
        const seller = sellers.find(s => s.id === service.seller_id);
        designSellerMap.set(service.seller_id, { services: [], seller });
      }
      designSellerMap.get(service.seller_id)!.services.push(service);
    });
    
    // Add all approved sellers
    sellers.forEach(seller => {
      const productCount = products.filter(p => p.seller_id === seller.id).length;
      const designData = designSellerMap.get(seller.id);
      const serviceCount = designData?.services.length || 0;
      
      const sellerProducts = products.filter(p => p.seller_id === seller.id);
      const uniqueCategories = [...new Set(sellerProducts.map(p => p.category).filter(Boolean))];
      
      // Determine shop type from seller's shop_type field or based on what they have
      let shopTypeValue: 'game' | 'design' = seller.shop_type === 'design' ? 'design' : 'game';
      let shopCategories: string[] = [];
      
      if (shopTypeValue === 'design' || serviceCount > 0) {
        // Design shop
        if (serviceCount > 0) {
          const serviceCategories = [...new Set(designData!.services.map(s => s.category_id))];
          shopCategories = serviceCategories.slice(0, 3).map(catId => {
            const cat = designCategories.find(c => c.id === catId);
            return cat?.name || 'Thiết kế';
          });
        }
        shopTypeValue = 'design';
      } else {
        // Game shop
        shopCategories = uniqueCategories.slice(0, 3).map(slug => {
          const cat = categories.find(c => c.slug === slug);
          return cat?.name || slug;
        });
      }
      
      shops.push({
        id: seller.id,
        shop_name: seller.shop_name,
        shop_slug: seller.shop_slug,
        shop_avatar_url: seller.shop_avatar_url,
        shop_description: seller.shop_description,
        is_verified: seller.is_verified,
        is_partner: seller.is_partner || false,
        rating_average: seller.rating_average,
        total_sales: seller.total_sales,
        created_at: seller.created_at,
        type: shopTypeValue,
        product_count: productCount > 0 ? productCount : undefined,
        service_count: serviceCount > 0 ? serviceCount : undefined,
        categories: shopCategories
      });
    });
    
    return shops;
  }, [sellers, products, categories, designServices, designCategories]);
  
  // Filter and sort sellers
  const filteredShops = useMemo(() => {
    return unifiedShops
      .filter(shop => {
        const matchesSearch = shop.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.shop_description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filter by shop type
        let matchesType = false;
        if (shopType === 'all') {
          matchesType = true;
        } else if (shopType === 'design') {
          // Show shops that have design services
          matchesType = (shop.service_count && shop.service_count > 0) || shop.type === 'design';
        } else if (shopType === 'game') {
          // Show shops that have game products
          matchesType = (shop.product_count && shop.product_count > 0) || shop.type === 'game';
        }
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating': return b.rating_average - a.rating_average;
          case 'sales': return b.total_sales - a.total_sales;
          case 'products': 
            const aCount = (a.product_count || 0) + (a.service_count || 0);
            const bCount = (b.product_count || 0) + (b.service_count || 0);
            return bCount - aCount;
          case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default: return 0;
        }
      });
  }, [unifiedShops, searchTerm, sortBy, shopType]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredShops, { itemsPerPage: 15 });

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [searchTerm, sortBy, shopType]);

  return (
    <Layout>
      {/* Header Section */}
      <div className="border-b bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Cửa hàng</h1>
              <p className="text-muted-foreground mt-1">
                Khám phá {sellers.length} cửa hàng uy tín
              </p>
            </div>
            
            {/* Search + Open Shop */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm cửa hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Link to="/shops/register">
                <Button className="gap-2 whitespace-nowrap">
                  <Store className="h-4 w-4" />
                  Mở shop
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={shopType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShopType('all')}
              className="gap-1.5"
            >
              <Store className="h-3.5 w-3.5" />
              Tất cả
            </Button>
            <Button
              variant={shopType === 'game' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShopType('game')}
              className="gap-1.5"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              Account Game
            </Button>
            <Button
              variant={shopType === 'design' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShopType('design')}
              className="gap-1.5"
            >
              <Palette className="h-3.5 w-3.5" />
              Thiết kế ảnh
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {startIndex}-{endIndex} / {totalItems} cửa hàng
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
                <SelectItem value="sales">Bán chạy nhất</SelectItem>
                <SelectItem value="products">Nhiều sản phẩm</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Shops List */}
        {loadingSellers || loadingDesign ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-48" />
                    <div className="h-4 bg-muted rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Store className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy cửa hàng</h3>
            <p className="text-muted-foreground mb-6">Thử tìm kiếm với từ khóa khác</p>
            <Link to="/shops/register">
              <Button>Mở cửa hàng của bạn</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedItems.map((shop, index) => (
                <motion.div
                  key={`${shop.id}-${shop.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link 
                    to={`/shops/${shop.shop_slug}`}
                    className="group block"
                  >
                    <div className="rounded-xl border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted overflow-hidden shrink-0 border">
                          {shop.shop_avatar_url ? (
                            <img 
                              src={shop.shop_avatar_url} 
                              alt={shop.shop_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <Store className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                            </div>
                          )}
                        </div>
                        
                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Badge row */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none group-hover:text-primary transition-colors">
                              {shop.shop_name}
                            </h3>
                            {shop.is_verified && (
                              <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                            )}
                            {shop.is_partner && (
                              <PartnerBadge size="sm" variant="icon-only" />
                            )}
                            {/* Shop type badge */}
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 ${
                                shop.type === 'design' 
                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' 
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              }`}
                            >
                              {shop.type === 'design' ? 'Thiết kế' : 'Game'}
                            </Badge>
                          </div>
                          
                          {/* Stats - mobile optimized */}
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                              <span>{shop.rating_average.toFixed(1)}</span>
                            </div>
                            {shop.product_count && shop.product_count > 0 && (
                              <div className="flex items-center gap-1">
                                <Gamepad2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="whitespace-nowrap">{shop.product_count} <span className="hidden xs:inline">sản phẩm</span><span className="xs:hidden">SP</span></span>
                              </div>
                            )}
                            {shop.service_count && shop.service_count > 0 && (
                              <div className="flex items-center gap-1">
                                <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="whitespace-nowrap">{shop.service_count} dịch vụ</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="whitespace-nowrap">{shop.total_sales} đã bán</span>
                            </div>
                          </div>
                          
                          {/* Categories - mobile optimized */}
                          {shop.categories && shop.categories.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Folder className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                              {shop.categories.slice(0, 2).map((cat, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="text-[9px] sm:text-[10px] px-1.5 py-0 max-w-[80px] sm:max-w-none truncate"
                                >
                                  {cat}
                                </Badge>
                              ))}
                              {shop.categories.length > 2 && (
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">+{shop.categories.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Tags - hidden on small mobile */}
                        <div className="hidden md:flex flex-col gap-1.5 shrink-0">
                          {shop.total_sales >= 50 && (
                            <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Bán chạy
                            </Badge>
                          )}
                          {shop.rating_average >= 4.5 && (
                            <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                              <Star className="h-3 w-3 mr-1" />
                              Top đánh giá
                            </Badge>
                          )}
                          {shop.service_count && shop.product_count && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              <Store className="h-3 w-3 mr-1" />
                              Đa dịch vụ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              showInfo={false}
              className="mt-6"
            />
          </>
        )}
      </div>
    </Layout>
  );
}
