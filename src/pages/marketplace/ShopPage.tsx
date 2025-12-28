import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, Star, ShieldCheck, Phone, ChevronDown, Clock, Coins,
  Facebook, MessageCircle, Package, Users, Sparkles, Mail, Send, BadgeCheck,
  ImagePlus, X, Loader2, FileText, Pin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { useSellerBySlug, useSellerProducts, useSellerReviews, useMyPurchases, useCanReviewSeller, useCreateSellerReview, useSellerRecentTransactions, MarketplaceCategory } from '@/hooks/useMarketplace';
import { useMarketplaceCategories } from '@/hooks/useMarketplace';
import { useCreateTicketToSeller } from '@/hooks/useSellerTickets';
import { useActiveBoosts } from '@/hooks/useProductBoosts';
import { useActiveSellerFlashSales } from '@/hooks/useSellerFlashSale';
import { useComboProductIds } from '@/hooks/useSellerCombos';
import { useShopBranding } from '@/hooks/useShopBranding';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { SellerReviewsSection } from '@/components/marketplace/SellerReviewsSection';
import { ChatWithSellerButton } from '@/components/chat/ChatWithSellerButton';
import { ShopPostsTab } from '@/components/marketplace/ShopPostsTab';
import { ThemedShopWrapper, getLayoutClass } from '@/components/marketplace/ThemedShopWrapper';
import { ShopCombosSection } from '@/components/marketplace/ShopCombosSection';
import { ShopVouchersSection } from '@/components/marketplace/ShopVouchersSection';
import { ShopDesignServicesSection } from '@/components/marketplace/ShopDesignServicesSection';
import { ShopDesignTransactionsSection } from '@/components/marketplace/ShopDesignTransactionsSection';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const { formatPrice } = useCurrency();
  const { formatRelative } = useDateFormat();
  const { user } = useAuth();
  const [showPhone, setShowPhone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [contactOpen, setContactOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;
  
  const { data: seller, isLoading } = useSellerBySlug(slug);
  const { data: branding } = useShopBranding(seller?.id || '');
  const { data: products = [] } = useSellerProducts(seller?.id);
  const { data: myPurchases = [] } = useMyPurchases();
  const createTicket = useCreateTicketToSeller();
  const { data: reviews = [] } = useSellerReviews(seller?.id);
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: canReviewData } = useCanReviewSeller(seller?.id);
  const { data: recentTransactions = [] } = useSellerRecentTransactions(seller?.id);
  const createReview = useCreateSellerReview();
  
  // Get active shop_featured boosts for this seller
  const { data: activeBoosts = [] } = useActiveBoosts('shop_featured');
  const shopBoostedProductIds = activeBoosts
    .filter(b => b.product?.seller_id === seller?.id)
    .map(b => b.product_id);
  
  // Get active flash sales for this seller
  const { data: sellerFlashSales = [] } = useActiveSellerFlashSales(seller?.id);
  
  // Create a map of product_id -> flash sale discount
  const flashSaleDiscounts = new Map<string, { discountPercent: number; originalPrice: number; salePrice: number }>();
  sellerFlashSales.forEach(sale => {
    sale.items?.forEach(item => {
      const discount = item.discount_percent || sale.discount_percent;
      const originalPrice = item.product?.price || 0;
      const salePrice = originalPrice * (1 - discount / 100);
      flashSaleDiscounts.set(item.product_id, {
        discountPercent: discount,
        originalPrice,
        salePrice
      });
    });
  });
  
  // Get combo product IDs for this seller
  const comboProductMap = useComboProductIds(seller?.id);
  
  // Filter purchases from this seller
  const purchasesFromSeller = myPurchases.filter(p => p.seller_id === seller?.id);
  
  // Separate boosted and non-boosted products
  const boostedProducts = products.filter(p => shopBoostedProductIds.includes(p.id));
  const regularProducts = products.filter(p => !shopBoostedProductIds.includes(p.id));
  
  // Apply category filter
  const filteredBoostedProducts = boostedProducts.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  );
  const filteredRegularProducts = regularProducts.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  );
  const filteredProducts = [...filteredBoostedProducts, ...filteredRegularProducts];
  
  // Pagination calculations
  const totalProducts = filteredRegularProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredRegularProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );
  
  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);
  
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rev => rev.rating === r).length
  }));
  
  const filteredReviews = reviews.filter(r => 
    ratingFilter === 'all' || r.rating === parseInt(ratingFilter)
  );
  
  // Check if user is the seller
  const isOwnShop = user && seller && seller.user_id === user.id;

  const handleContactSubmit = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để liên hệ shop');
      return;
    }
    if (isOwnShop) {
      toast.error('Bạn không thể tạo ticket cho shop của chính mình');
      return;
    }
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    if (!seller) return;
    
    try {
      await createTicket.mutateAsync({
        sellerId: seller.id,
        orderId: selectedOrderId || undefined,
        subject: ticketSubject,
        message: ticketMessage
      });
      toast.success('Đã gửi tin nhắn đến shop thành công!');
      setContactOpen(false);
      setTicketSubject('');
      setTicketMessage('');
      setSelectedOrderId('');
    } catch (error) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }
    if (isOwnShop) {
      toast.error('Bạn không thể đánh giá shop của chính mình');
      return;
    }
    if (!seller) return;
    
    try {
      await createReview.mutateAsync({
        seller_id: seller.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
        reviewer_name: user.email?.split('@')[0] || 'Người dùng',
        images: reviewImages.length > 0 ? reviewImages : undefined,
      });
      toast.success('Đánh giá của bạn đã được gửi!');
      setReviewOpen(false);
      setReviewRating(5);
      setReviewComment('');
      setReviewImages([]);
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi đánh giá');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (reviewImages.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('Chỉ chấp nhận file ảnh');
          continue;
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error('Ảnh không được quá 50MB');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('seller-reviews')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('seller-reviews')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        setReviewImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!seller) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy cửa hàng</h1>
          <p className="text-muted-foreground mb-4">Cửa hàng này không tồn tại hoặc đã bị ẩn</p>
          <Link to="/shops">
            <Button>Quay lại</Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  // Layout class based on branding
  const layoutClass = getLayoutClass(branding?.layout_style);
  
  return (
    <Layout>
      <ThemedShopWrapper branding={branding} className="min-h-screen">
        {/* Banner */}
        <div 
          className="h-32 md:h-48 relative overflow-hidden"
          style={{ 
            backgroundColor: branding?.background_color || undefined,
            background: !branding?.banner_url && !seller.shop_banner_url 
              ? `linear-gradient(to right, ${branding?.primary_color || 'hsl(var(--primary))'}20, ${branding?.secondary_color || 'hsl(var(--primary))'}10)` 
              : undefined 
          }}
        >
          {branding?.banner_video_url ? (
            <video 
              src={branding.banner_video_url}
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (branding?.banner_url || seller.shop_banner_url) ? (
            <img 
              src={branding?.banner_url || seller.shop_banner_url} 
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        
        <div className="container relative" style={{ color: branding?.text_color || undefined }}>
        {/* Profile Header */}
        <div className="flex flex-col items-center -mt-12 mb-6">
          {/* Avatar - conditionally shown based on branding */}
          {(branding?.show_seller_avatar !== false) && (
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={seller.shop_avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  <Store className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-3">
            <h1 className="text-xl md:text-2xl font-bold">{seller.shop_name}</h1>
            {/* Badges - conditionally shown based on branding */}
            {(branding?.show_badges !== false) && seller.is_verified && (
              <BadgeCheck className="h-6 w-6 text-primary fill-primary/20" />
            )}
            {(branding?.show_badges !== false) && seller.is_partner && (
              <PartnerBadge size="md" variant="icon-only" />
            )}
          </div>
          <p className="text-muted-foreground">@{seller.shop_slug}</p>
          
          {/* Social Links */}
          <div className="flex items-center gap-2 mt-3">
            {seller.facebook_url && (
              <a href={seller.facebook_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Facebook className="h-4 w-4" />
                </Button>
              </a>
            )}
            {seller.zalo_url && (
              <a href={seller.zalo_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
          
          {/* Phone Button */}
          {seller.phone && (
            <div className="flex items-center gap-2 mt-3">
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => setShowPhone(!showPhone)}
              >
                <Phone className="h-4 w-4" />
                {showPhone ? seller.phone : 'Liên hệ'}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowPhone(!showPhone)}>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPhone ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
          
          {/* Chat & Contact Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {/* Chat Button - Always visible */}
            <ChatWithSellerButton sellerId={seller.user_id} sellerName={seller.shop_name} />
            
            {/* Contact Ticket Button - Hide for own shop and design shops */}
            {!isOwnShop && seller.shop_type !== 'design' && (
              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Tạo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Liên hệ với {seller.shop_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Order Selection */}
                  <div className="space-y-2">
                    <Label>Đơn hàng liên quan (tuỳ chọn)</Label>
                    {purchasesFromSeller.length > 0 ? (
                      <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn hàng nếu có..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Không chọn đơn hàng</SelectItem>
                          {purchasesFromSeller.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              #{order.order_number} - {order.product?.title || 'Sản phẩm'} ({formatPrice(order.amount)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Bạn chưa có đơn hàng nào từ shop này
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Tiêu đề</Label>
                    <Input
                      id="subject"
                      placeholder="Nhập tiêu đề tin nhắn..."
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Nội dung</Label>
                    <Textarea
                      id="message"
                      placeholder="Nhập nội dung tin nhắn..."
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    onClick={handleContactSubmit}
                    disabled={createTicket.isPending}
                  >
                    <Send className="h-4 w-4" />
                    {createTicket.isPending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground text-center">
                      Vui lòng <Link to="/auth" className="text-primary hover:underline">đăng nhập</Link> để liên hệ shop
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
          {/* Stats - conditionally shown based on branding */}
          {(branding?.show_stats !== false) && (
            <div className="flex items-center gap-6 mt-4 text-center">
              <div>
                <p className="text-2xl font-bold">{seller.total_sales}</p>
                <p className="text-xs text-muted-foreground">Đã bán</p>
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {seller.rating_average.toFixed(1)}
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </p>
                <p className="text-xs text-muted-foreground">{seller.rating_count} đánh giá</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{seller.trust_score}%</p>
                <p className="text-xs text-muted-foreground">Uy tín</p>
              </div>
            </div>
          )}
          
          {/* Description */}
          {seller.shop_description && (
            <p className="text-center text-sm text-muted-foreground mt-4 max-w-lg">
              {seller.shop_description}
            </p>
          )}
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="shop" className="mb-8">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="shop" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent gap-2"
              style={{ 
                borderColor: 'transparent',
              }}
              data-shop-primary={branding?.primary_color}
            >
              <Store className="h-4 w-4" />
              Cửa hàng
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent gap-2"
            >
              <FileText className="h-4 w-4" />
              Bài viết
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent gap-2"
            >
              <Star className="h-4 w-4" />
              Đánh giá
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="shop" className="mt-6 space-y-6">
            {/* Shop type: design - Show design services as main content */}
            {seller.shop_type === 'design' ? (
              <>
                {/* Design Transactions - Show first */}
                <ShopDesignTransactionsSection sellerId={seller.id} />
                
                {/* Design Services Section (with built-in category filter) */}
                <ShopDesignServicesSection 
                  sellerId={seller.id} 
                  availabilityStatus={seller.availability_status}
                  availabilityReason={seller.availability_reason}
                  availabilityUntil={seller.availability_until}
                />
              </>
            ) : (
              <>
                
                {/* Vouchers Section */}
                <ShopVouchersSection sellerId={seller.id} />
                
                {/* Combos Section */}
                <ShopCombosSection sellerId={seller.id} shopSlug={seller.shop_slug} />
                
                {/* Recent Transactions - Marquee Style */}
                <div>
                  <h2 className="text-lg font-semibold mb-3">Giao dịch tại Shop</h2>
                  {recentTransactions.length > 0 ? (
                    <div className="relative overflow-hidden bg-secondary/30 rounded-lg py-2">
                      <div className="flex animate-marquee gap-4 whitespace-nowrap">
                        {[...recentTransactions, ...recentTransactions].map((tx, idx) => {
                          // Mask email: show first 3 chars + *** 
                          const emailPart = tx.buyer_email?.split('@')[0] || 'Khách';
                          const maskedName = emailPart.length > 3 
                            ? emailPart.slice(0, 3) + '***' 
                            : emailPart + '***';
                          
                          return (
                            <div key={`${tx.id}-${idx}`} className="flex items-center gap-2 text-sm px-3">
                              <span className="text-primary font-medium">{maskedName}</span>
                              <span className="text-muted-foreground">đã mua với giá</span>
                              <span className="text-amber-600 font-semibold">{formatPrice(tx.amount)}</span>
                              <span className="text-muted-foreground text-xs">
                                • {formatRelative(tx.created_at)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
                  )}
                </div>
                
                {/* Categories */}
                <div>
                  <h2 className="text-lg font-semibold mb-3">Danh mục tài khoản</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Tất cả ({products.length})
                    </Button>
                    {categories.filter(c => products.some(p => p.category === c.slug)).map((cat) => (
                      <Button 
                        key={cat.id}
                        variant={selectedCategory === cat.slug ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedCategory(cat.slug)}
                      >
                        {cat.name} ({products.filter(p => p.category === cat.slug).length})
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Boosted Products Section - Only for non-design shops */}
            {seller.shop_type !== 'design' && filteredBoostedProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Sản phẩm nổi bật</h2>
                </div>
                <div className={`${layoutClass} mb-6`}>
                  {filteredBoostedProducts.map((product) => {
                    const productId = product.id.slice(0, 6).toUpperCase();
                    const categoryName = categories.find(c => c.slug === product.category)?.name || product.category;
                    const accountInfo = product.account_info as Record<string, unknown> | unknown[] | null;
                    const flashSale = flashSaleDiscounts.get(product.id);
                    const comboDiscount = comboProductMap.get(product.id);
                    
                    // Helper to render account info properly
                    const renderAccountInfo = () => {
                      if (!accountInfo) return null;
                      
                      // Handle array format: [{name: "Rank", value: "Diamond"}, ...]
                      if (Array.isArray(accountInfo)) {
                        return accountInfo.map((item: any, idx) => {
                          if (typeof item === 'object' && item?.name && item?.value !== undefined) {
                            return (
                              <p key={idx} className="text-xs text-muted-foreground truncate">
                                {item.name}: {String(item.value)}
                              </p>
                            );
                          }
                          return null;
                        });
                      }
                      
                      // Handle object format with nested {name, value} or simple key-value
                      return Object.entries(accountInfo).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null && 'name' in (value as object) && 'value' in (value as object)) {
                          const nested = value as { name: string; value: unknown };
                          return (
                            <p key={key} className="text-xs text-muted-foreground truncate">
                              {nested.name}: {String(nested.value)}
                            </p>
                          );
                        }
                        return (
                          <p key={key} className="text-xs text-muted-foreground truncate">
                            {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        );
                      });
                    };
                    
                    return (
                      <Link 
                        key={product.id} 
                        to={`/shops/${slug}/product/${product.category}_${product.id.split('-')[0]}`}
                        className="group block rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 overflow-hidden transition-all hover:border-amber-500 hover:shadow-lg"
                      >
                        <div className="relative">
                          <div className="aspect-[16/9] overflow-hidden bg-secondary/50">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={`${categoryName} - #${productId}`}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs px-2 py-1 font-mono">
                            #{productId}
                          </Badge>
                          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] gap-1">
                            <Pin className="h-3 w-3" />
                            Ghim
                          </Badge>
                          {flashSale && (
                            <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px]">
                              -{flashSale.discountPercent}%
                            </Badge>
                          )}
                          {comboDiscount && !flashSale && (
                            <Badge className="absolute bottom-2 left-2 bg-purple-500 text-white text-[10px] gap-0.5">
                              <Package className="h-3 w-3" />
                              Combo -{comboDiscount}%
                            </Badge>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <h3 className="font-medium text-sm line-clamp-1">{categoryName}</h3>
                          <div className="space-y-1 text-xs">
                            {renderAccountInfo()}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            {flashSale ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(flashSale.originalPrice)}</span>
                                <span className="text-primary font-bold">{formatPrice(flashSale.salePrice)}</span>
                              </div>
                            ) : (
                              <span className="text-primary font-bold">{formatPrice(product.price)}</span>
                            )}
                            <Badge variant={product.status === 'available' ? 'default' : 'secondary'} className="text-[10px]">
                              {product.status === 'available' ? 'Còn hàng' : product.status === 'sold' ? 'Đã bán' : 'Ẩn'}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Regular Products - Only for non-design shops */}
            {seller.shop_type !== 'design' && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Các tài khoản gần đây</h2>
                
                {filteredRegularProducts.length === 0 && filteredBoostedProducts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
                    </CardContent>
                  </Card>
                ) : paginatedProducts.length > 0 ? (
                  <>
                    <div className={layoutClass}>
                      {paginatedProducts.map((product) => {
                      const productId = product.id.slice(0, 6).toUpperCase();
                      const categoryName = categories.find(c => c.slug === product.category)?.name || product.category;
                      const accountInfo = product.account_info as Record<string, unknown> | unknown[] | null;
                      const flashSale = flashSaleDiscounts.get(product.id);
                      const comboDiscount = comboProductMap.get(product.id);
                      
                      // Helper to render account info properly
                      const renderAccountInfo = () => {
                        if (!accountInfo) return null;
                        
                        // Handle array format: [{name: "Rank", value: "Diamond"}, ...]
                        if (Array.isArray(accountInfo)) {
                          return accountInfo.map((item: any, idx) => {
                            if (typeof item === 'object' && item?.name && item?.value !== undefined) {
                              return (
                                <div key={idx} className="flex justify-between">
                                  <span className="text-muted-foreground">{item.name}</span>
                                  <span className="font-medium text-foreground">{String(item.value)}</span>
                                </div>
                              );
                            }
                            return null;
                          });
                        }
                        
                        // Handle object format with nested {name, value} or simple key-value
                        return Object.entries(accountInfo).map(([key, value]) => {
                          if (typeof value === 'object' && value !== null && 'name' in (value as object) && 'value' in (value as object)) {
                            const nested = value as { name: string; value: unknown };
                            return (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{nested.name}</span>
                                <span className="font-medium text-foreground">{String(nested.value)}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}</span>
                              <span className="font-medium text-foreground">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          );
                        });
                      };
                      
                      return (
                        <Link 
                          key={product.id} 
                          to={`/shops/${slug}/product/${product.category}_${product.id.split('-')[0]}`}
                          className="group block rounded-xl bg-card border border-border overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg"
                        >
                          <div className="relative">
                            <div className="aspect-[16/9] overflow-hidden bg-secondary/50">
                              {product.images?.[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={`${categoryName} - #${productId}`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs px-2 py-1 font-mono">
                              #{productId}
                            </Badge>
                            {shopBoostedProductIds.includes(product.id) && (
                              <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] gap-1">
                                <Pin className="h-3 w-3" />
                                Ghim
                              </Badge>
                            )}
                            {product.is_featured && !shopBoostedProductIds.includes(product.id) && (
                              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
                                HOT
                              </Badge>
                            )}
                            {flashSale && (
                              <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px]">
                                -{flashSale.discountPercent}%
                              </Badge>
                            )}
                            {comboDiscount && !flashSale && (
                              <Badge className="absolute bottom-2 left-2 bg-purple-500 text-white text-[10px] gap-0.5">
                                <Package className="h-3 w-3" />
                                Combo -{comboDiscount}%
                              </Badge>
                            )}
                            <Badge className="absolute bottom-2 right-2 bg-amber-500 text-white text-[10px]">
                              Chợ
                            </Badge>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span>{formatRelative(product.created_at)}</span>
                            </div>
                            {accountInfo && (Array.isArray(accountInfo) ? accountInfo.length > 0 : Object.keys(accountInfo).length > 0) && (
                              <div className="space-y-1 text-xs">
                                {renderAccountInfo()}
                              </div>
                            )}
                            <div className="pt-2 border-t border-border">
                              {flashSale ? (
                                <div className="flex flex-col items-center gap-0.5 bg-red-500/10 rounded-lg py-2">
                                  <span className="text-xs text-muted-foreground line-through">{formatPrice(flashSale.originalPrice)}</span>
                                  <div className="flex items-center gap-1.5 text-red-500">
                                    <Coins className="h-4 w-4" />
                                    <span className="font-bold">{formatPrice(flashSale.salePrice)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 bg-foreground text-background rounded-lg py-2">
                                  <Coins className="h-4 w-4" />
                                  <span className="font-bold">{formatPrice(product.price)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage = page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1;
                            
                            if (!showPage) {
                              if (page === 2 && currentPage > 3) {
                                return <span key={page} className="px-2 text-muted-foreground">...</span>;
                              }
                              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                                return <span key={page} className="px-2 text-muted-foreground">...</span>;
                              }
                              return null;
                            }
                            
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm text-muted-foreground ml-2">
                          {totalProducts} sản phẩm
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-6">
            <ShopPostsTab 
              sellerId={seller.id} 
              shopName={seller.shop_name}
              shopAvatar={seller.shop_avatar_url}
              isVerified={seller.is_verified}
            />
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Review Form - Only for buyers */}
            {canReviewData?.canReview && (
              <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2">
                    <Star className="h-4 w-4" />
                    Viết đánh giá cho shop
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đánh giá {seller?.shop_name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Đánh giá của bạn</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-comment">Nhận xét (tuỳ chọn)</Label>
                      <Textarea
                        id="review-comment"
                        placeholder="Chia sẻ trải nghiệm mua hàng của bạn..."
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Thêm ảnh (tuỳ chọn)</Label>
                      <div className="flex flex-wrap gap-2">
                        {reviewImages.map((url, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeReviewImage(index)}
                              className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        
                        {reviewImages.length < 5 && (
                          <label className={`w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImages}
                            />
                            {uploadingImages ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">Thêm ảnh</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tối đa 5 ảnh, mỗi ảnh không quá 5MB
                      </p>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleReviewSubmit}
                      disabled={createReview.isPending || uploadingImages}
                    >
                      {createReview.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            

            {/* Rating Summary */}
            {seller && (
              <SellerReviewsSection 
                sellerId={seller.id}
                ratingAverage={seller.rating_average}
                ratingCount={seller.rating_count}
              />
            )}
          </TabsContent>
        </Tabs>
        </div>
      </ThemedShopWrapper>
    </Layout>
  );
}
