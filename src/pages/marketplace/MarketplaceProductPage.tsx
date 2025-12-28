import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Store, Star, ShieldCheck, Clock, ShoppingCart, Wallet,
  Sparkles, AlertCircle, Loader2, CheckCircle, BadgeCheck,
  Tag, X, Ticket
} from 'lucide-react';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { supabase } from '@/integrations/supabase/client';
import { usePurchaseFromSeller, SellerProduct, Seller, useMarketplaceCategories } from '@/hooks/useMarketplace';
import { useActiveSellerFlashSales } from '@/hooks/useSellerFlashSale';
import { useCheckPolicyAcceptance } from '@/hooks/useShopPolicies';
import { ShopPoliciesCheck } from '@/components/marketplace/ShopPoliciesCheck';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

export default function MarketplaceProductPage() {
  const { formatRelative } = useDateFormat();
  const { id: rawId, slug: shopSlug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { formatPrice } = useCurrency();
  const { addMarketplaceItem, marketplaceItems, addVoucher } = useCart();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  
  // Extract actual product ID from format: category_shortId
  const shortId = rawId?.includes('_') ? rawId.split('_').pop() : rawId;
  const isShortId = shortId && shortId.length <= 8;
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    type: 'system' | 'seller';
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    value: number;
  } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  
  const purchaseMutation = usePurchaseFromSeller();
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: platformFeePercent } = useSiteSetting('marketplace_platform_fee');
  
  const { data: product, isLoading } = useQuery({
    queryKey: ['marketplace-product', shortId, shopSlug],
    queryFn: async () => {
      if (!shortId) return null;
      
      if (isShortId && shopSlug) {
        // For short ID, fetch products from this shop and find by prefix
        const { data: seller } = await supabase
          .from('sellers')
          .select('id')
          .eq('shop_slug', shopSlug)
          .maybeSingle();
        
        if (!seller) return null;
        
        const { data: products, error } = await supabase
          .from('seller_products')
          .select('*, seller:sellers(*)')
          .eq('seller_id', seller.id);
        
        if (error) throw error;
        
        // Find product by ID prefix
        const found = products?.find(p => p.id.startsWith(shortId));
        return found as SellerProduct & { seller: Seller } | null;
      } else {
        // Full UUID - direct fetch
        const { data, error } = await supabase
          .from('seller_products')
          .select('*, seller:sellers(*)')
          .eq('id', shortId)
          .maybeSingle();
        if (error) throw error;
        return data as SellerProduct & { seller: Seller };
      }
    },
    enabled: !!shortId
  });
  
  // Generate display title: Category Name - #ID
  const displayTitle = product 
    ? `${categories.find(c => c.slug === product.category)?.name || product.category} - #${product.id.slice(0, 6).toUpperCase()}`
    : '';
  
  // Get active flash sales for this seller
  const { data: sellerFlashSales = [] } = useActiveSellerFlashSales(product?.seller_id);
  
  // Check if this product is in flash sale
  const flashSaleItem = sellerFlashSales.flatMap(sale => 
    (sale.items || []).map(item => ({
      ...item,
      saleDiscountPercent: item.discount_percent || sale.discount_percent
    }))
  ).find(item => item.product_id === product?.id);
  
  const flashSaleDiscount = flashSaleItem ? flashSaleItem.saleDiscountPercent : 0;
  
  // Check if buyer has accepted all required policies
  const { data: policyCheck } = useCheckPolicyAcceptance(product?.seller_id || '', user?.id);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  
  // Use balance from AuthContext profile
  const userBalance = profile?.balance || 0;

  // Calculate prices - apply flash sale first, then voucher
  const basePrice = product?.price || 0;
  const flashSalePrice = flashSaleDiscount > 0 ? basePrice * (1 - flashSaleDiscount / 100) : basePrice;
  const voucherDiscountAmount = appliedVoucher?.discount || 0;
  const finalPrice = Math.max(0, flashSalePrice - voucherDiscountAmount);
  
  // Aliases for backward compatibility
  const originalPrice = basePrice;
  const discountAmount = (basePrice - flashSalePrice) + voucherDiscountAmount;

  // Validate voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    if (!product) return;

    setIsValidatingVoucher(true);
    setVoucherError('');

    try {
      // First check seller voucher
      const { data: sellerVoucher } = await supabase
        .from('seller_vouchers')
        .select('*')
        .eq('seller_id', product.seller_id)
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .gte('valid_to', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .maybeSingle();

      if (sellerVoucher) {
        // Check usage limit
        if (sellerVoucher.max_uses && sellerVoucher.used_count >= sellerVoucher.max_uses) {
          setVoucherError('Mã giảm giá đã hết lượt sử dụng');
          setIsValidatingVoucher(false);
          return;
        }
        // Check min order (use flashSalePrice for validation)
        if (sellerVoucher.min_order_amount && flashSalePrice < sellerVoucher.min_order_amount) {
          setVoucherError(`Đơn hàng tối thiểu ${formatPrice(sellerVoucher.min_order_amount)}`);
          setIsValidatingVoucher(false);
          return;
        }

        // Calculate discount on flash sale price
        let discount = 0;
        if (sellerVoucher.type === 'percentage') {
          discount = (flashSalePrice * sellerVoucher.value) / 100;
        } else {
          discount = sellerVoucher.value;
        }

        setAppliedVoucher({
          type: 'seller',
          code: sellerVoucher.code,
          discount,
          discountType: sellerVoucher.type as 'percentage' | 'fixed',
          value: sellerVoucher.value
        });
        setVoucherCode('');
        toast.success('Áp dụng mã shop thành công!');
        setIsValidatingVoucher(false);
        return;
      }

      // Check system voucher
      const { data: systemVoucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (systemVoucher) {
        // Check expiration
        if (systemVoucher.expires_at && new Date(systemVoucher.expires_at) < new Date()) {
          setVoucherError('Mã giảm giá đã hết hạn');
          setIsValidatingVoucher(false);
          return;
        }
        // Check usage limit
        if (systemVoucher.usage_limit && systemVoucher.used_count >= systemVoucher.usage_limit) {
          setVoucherError('Mã giảm giá đã hết lượt sử dụng');
          setIsValidatingVoucher(false);
          return;
        }
        // Check min order (use flashSalePrice for validation)
        if (systemVoucher.min_order_value && flashSalePrice < systemVoucher.min_order_value) {
          setVoucherError(`Đơn hàng tối thiểu ${formatPrice(systemVoucher.min_order_value)}`);
          setIsValidatingVoucher(false);
          return;
        }

        // Calculate discount on flash sale price
        let discount = 0;
        if (systemVoucher.discount_type === 'percentage') {
          discount = (flashSalePrice * systemVoucher.discount_value) / 100;
          if (systemVoucher.max_discount) {
            discount = Math.min(discount, systemVoucher.max_discount);
          }
        } else {
          discount = systemVoucher.discount_value;
        }

        setAppliedVoucher({
          type: 'system',
          code: systemVoucher.code,
          discount,
          discountType: systemVoucher.discount_type as 'percentage' | 'fixed',
          value: systemVoucher.discount_value
        });
        setVoucherCode('');
        toast.success('Áp dụng mã hệ thống thành công!');
        setIsValidatingVoucher(false);
        return;
      }

      setVoucherError('Mã giảm giá không hợp lệ');
    } catch (error) {
      setVoucherError('Có lỗi xảy ra khi kiểm tra mã');
    }
    setIsValidatingVoucher(false);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
  };
  
  // Check if user is the seller of this product
  const isOwnProduct = user && product?.seller?.user_id === user.id;

  const handleBuy = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      navigate('/auth');
      return;
    }
    
    if (!product) return;

    if (isOwnProduct) {
      toast.error('Bạn không thể mua sản phẩm của chính mình');
      return;
    }
    
    if (userBalance < finalPrice) {
      toast.error('Số dư không đủ. Vui lòng nạp thêm tiền.');
      return;
    }
    
    try {
      const feePercent = platformFeePercent ? Number(platformFeePercent) : 5;
      await purchaseMutation.mutateAsync({ 
        product, 
        platformFeePercent: feePercent,
        voucherCode: appliedVoucher?.code,
        discountAmount: appliedVoucher?.discount || 0
      });
      setBuyDialogOpen(false);
      setSuccessDialogOpen(true);
      setAppliedVoucher(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/auth');
      return;
    }
    if (!product) return;

    if (isOwnProduct) {
      toast.error('Bạn không thể thêm sản phẩm của chính mình vào giỏ hàng');
      return;
    }
    
    // Check if already in cart
    if (marketplaceItems.some(i => i.productId === product.id)) {
      toast.info('Sản phẩm đã có trong giỏ hàng');
      return;
    }
    
    addMarketplaceItem({
      productId: product.id,
      sellerId: product.seller_id,
      sellerName: product.seller?.shop_name || 'Shop',
      title: displayTitle,
      price: product.price,
      images: product.images || [],
      category: categories.find(c => c.slug === product.category)?.name || product.category,
      accountInfo: product.account_info as Record<string, any>
    });
    
    // Save applied voucher to cart context
    if (appliedVoucher) {
      addVoucher({
        id: `${appliedVoucher.type}-${appliedVoucher.code}-${product.seller_id}`,
        code: appliedVoucher.code,
        type: appliedVoucher.type,
        sellerId: appliedVoucher.type === 'seller' ? product.seller_id : undefined,
        discountType: appliedVoucher.discountType,
        discountValue: appliedVoucher.value,
        calculatedDiscount: appliedVoucher.discount
      });
    }
    
    toast.success('Đã thêm vào giỏ hàng');
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }
  
  if (!product) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-muted-foreground mb-4">Sản phẩm này không tồn tại hoặc đã bị ẩn</p>
          <Link to="/shops">
            <Button>Quay lại chợ</Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  
  return (
    <Layout>
      <div className="container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link>
          <span>/</span>
          <Link to={`/shops/${product.seller?.shop_slug}`} className="hover:text-foreground">
            {product.seller?.shop_name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{displayTitle}</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {product.is_featured && (
                  <Badge className="absolute top-4 right-4 bg-amber-500">Đề xuất</Badge>
                )}
              </div>
              
              {/* Image thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <img 
                      key={i}
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
            </Card>
            
            {/* Title & Info */}
            <Card>
              <CardContent className="p-4 md:p-6 space-y-4">
                <h1 className="text-xl md:text-2xl font-bold">{displayTitle}</h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatRelative(product.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{product.view_count} lượt xem</span>
                  </div>
                </div>
                
                {/* Account Info */}
                {product.account_info && (
                  Array.isArray(product.account_info) ? product.account_info.length > 0 : Object.keys(product.account_info).length > 0
                ) && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold">Thông tin tài khoản</h3>
                    <div className="space-y-1 text-sm">
                      {Array.isArray(product.account_info) 
                        ? product.account_info.map((item: { name: string; value: string }, idx: number) => (
                            <div key={idx} className="flex justify-between py-1 border-b border-dashed">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="font-medium">{item.value}</span>
                            </div>
                          ))
                        : Object.entries(product.account_info).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-dashed">
                              <span className="text-muted-foreground">{key}</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Mô tả</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:sticky lg:top-4 space-y-4 h-fit">
            {/* Price Card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  {/* Show flash sale badge if applicable */}
                  {flashSaleDiscount > 0 && (
                    <Badge className="bg-red-500 text-white mb-2">
                      Flash Sale -{flashSaleDiscount}%
                    </Badge>
                  )}
                  
                  {(flashSaleDiscount > 0 || appliedVoucher) ? (
                    <>
                      <p className="text-lg text-muted-foreground line-through">{formatPrice(originalPrice)}</p>
                      <p className="text-3xl font-bold text-red-500">{formatPrice(finalPrice)}</p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-primary">{formatPrice(originalPrice)}</p>
                  )}
                </div>

                {user ? (
                  <>
                    {/* Voucher Input */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-1.5">
                        <Ticket className="h-4 w-4" />
                        Mã giảm giá
                      </Label>
                      {appliedVoucher ? (
                        <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{appliedVoucher.code}</span>
                            <Badge variant="secondary" className="text-xs">
                              {appliedVoucher.type === 'seller' ? 'Shop' : 'Hệ thống'}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleRemoveVoucher} className="h-7 w-7 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Nhập mã voucher" 
                            value={voucherCode}
                            onChange={(e) => {
                              setVoucherCode(e.target.value.toUpperCase());
                              setVoucherError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleApplyVoucher}
                            disabled={isValidatingVoucher}
                          >
                            {isValidatingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                          </Button>
                        </div>
                      )}
                      {voucherError && (
                        <p className="text-xs text-destructive">{voucherError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Có thể dùng mã hệ thống hoặc mã của shop</p>
                    </div>

                    <Separator />

                    {/* Price Summary */}
                    {appliedVoucher && (
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Giá gốc</span>
                          <span>{formatPrice(originalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá ({appliedVoucher.discountType === 'percentage' ? `${appliedVoucher.value}%` : formatPrice(appliedVoucher.value)})</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Tổng</span>
                          <span className="text-primary">{formatPrice(finalPrice)}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Notice */}
                    <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg text-sm">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span>Thanh toán bằng số dư</span>
                    </div>
                    
                    {/* Shop Policies */}
                    <ShopPoliciesCheck 
                      sellerId={product.seller_id}
                      onAllAccepted={() => setPoliciesAccepted(true)}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        onClick={handleAddToCart}
                        disabled={product.status !== 'available'}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1.5" />
                        Giỏ hàng
                      </Button>
                      <Button 
                        onClick={() => setBuyDialogOpen(true)}
                        disabled={product.status !== 'available' || (policyCheck?.pendingPolicies?.length > 0 && !policiesAccepted)}
                      >
                        {product.status === 'available' ? 'Mua ngay' : 'Đã bán'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Số dư của bạn: {formatPrice(userBalance)}
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Separator />
                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground">Vui lòng đăng nhập để mua sản phẩm</p>
                      <Link to="/auth" className="block">
                        <Button className="w-full">
                          Đăng nhập để mua
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Seller Card */}
            {product.seller && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Link to={`/shops/${product.seller.shop_slug}`} className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={product.seller.shop_avatar_url || undefined} />
                      <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold">{product.seller.shop_name}</h3>
                        {product.seller.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                        )}
                        {(product.seller as any).is_partner && (
                          <PartnerBadge size="sm" variant="icon-only" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{product.seller.shop_slug}</p>
                    </div>
                  </Link>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="font-bold">{product.seller.total_sales}</p>
                      <p className="text-xs text-muted-foreground">Đã bán</p>
                    </div>
                    <div>
                      <p className="font-bold flex items-center justify-center gap-0.5">
                        {product.seller.rating_average.toFixed(1)}
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </p>
                      <p className="text-xs text-muted-foreground">Đánh giá</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-600">{product.seller.trust_score}%</p>
                      <p className="text-xs text-muted-foreground">Uy tín</p>
                    </div>
                  </div>
                  
                  <Link to={`/shops/${product.seller.shop_slug}`}>
                    <Button variant="outline" className="w-full">
                      Xem cửa hàng
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
            
            {/* Safety Notice */}
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-700">Giao dịch an toàn - Escrow 3 ngày</p>
                  <p className="text-muted-foreground">
                    Tiền sẽ được giữ trong 3 ngày. Nếu có vấn đề, bạn có thể khiếu nại để được hoàn tiền.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Buy Confirmation Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận mua hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">{displayTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Từ: {product.seller?.shop_name}
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Giá sản phẩm</span>
                <span>{formatPrice(originalPrice)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({appliedVoucher.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Tổng thanh toán</span>
                <span className="text-primary">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Thanh toán bằng số dư tài khoản</span>
            </div>
            
            {(userBalance || 0) < finalPrice && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Số dư không đủ ({formatPrice(userBalance || 0)}). Vui lòng nạp thêm tiền.</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setBuyDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleBuy}
                disabled={purchaseMutation.isPending || (userBalance || 0) < finalPrice}
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Xác nhận mua
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Mua hàng thành công!</h2>
            <p className="text-muted-foreground mb-2">
              Đơn hàng của bạn đã được tạo. Người bán sẽ giao tài khoản cho bạn trong thời gian sớm nhất.
            </p>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-700 text-sm mb-4">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Tiền sẽ được giữ trong 3 ngày. Nếu có vấn đề, hãy mở khiếu nại trong thời gian này.
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                setSuccessDialogOpen(false);
                navigate('/shops');
              }}>
                Tiếp tục mua sắm
              </Button>
              <Button onClick={() => {
                setSuccessDialogOpen(false);
                navigate('/settings');
              }}>
                Xem đơn hàng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}