import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  Wallet, ChevronRight, AlertCircle, Store, Star, BadgeCheck, 
  Clock, RefreshCw, FileType, ShieldCheck, FileText,
  Lock, Briefcase, FileCode, AlertTriangle, TrendingUp,
  X, ChevronLeft, ZoomIn
} from 'lucide-react';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { useDesignService, useCreateDesignOrder } from '@/hooks/useDesignServices';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignLicenseTypes } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DesignOrderForm, OrderFormData } from '@/components/design/DesignOrderForm';

export default function DesignServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { user, profile } = useAuth();
  
  const { data: service, isLoading } = useDesignService(id);
  const createOrder = useCreateDesignOrder();
  const { data: allLicenseTypes } = useDesignLicenseTypes();
  
  // Get platform fee from site settings (same as marketplace)
  const { data: platformFeeSetting } = useSiteSetting('marketplace_platform_fee');
  const platformFeeRate = platformFeeSetting ? Number(platformFeeSetting) : 5;
  
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  
  // Portfolio lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const IMAGES_PER_PAGE = 6;
  const [portfolioPage, setPortfolioPage] = useState(0);
  
  // Get all portfolio images (including first one)
  const allPortfolioImages = service?.portfolio_images || [];
  const totalPortfolioPages = Math.ceil(allPortfolioImages.length / IMAGES_PER_PAGE);
  const currentPortfolioImages = allPortfolioImages.slice(
    portfolioPage * IMAGES_PER_PAGE, 
    (portfolioPage + 1) * IMAGES_PER_PAGE
  );

  // Get available licenses for this service
  const supportedLicenseIds = (service as any)?.supported_license_ids || [];
  const availableLicenses = useMemo(() => {
    if (!allLicenseTypes) return [];
    if (supportedLicenseIds.length === 0) return allLicenseTypes;
    return allLicenseTypes.filter(l => supportedLicenseIds.includes(l.id));
  }, [allLicenseTypes, supportedLicenseIds]);

  // Fetch seller NDA settings
  const { data: sellerNdaSettings } = useQuery({
    queryKey: ['seller-nda-settings', service?.seller_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('design_seller_nda_settings')
        .select('*')
        .eq('seller_id', service?.seller_id)
        .maybeSingle();
      return data;
    },
    enabled: !!service?.seller_id,
  });

  const userBalance = (profile as any)?.balance || 0;
  const servicePrice = service?.price || 0;
  
  // Check if user is the seller of this service
  const isOwnService = user && service?.seller?.user_id === user.id;

  const handleOrderSubmit = async (formData: OrderFormData) => {
    if (!user || !service) return;

    const platformFee = formData.final_amount * (platformFeeRate / 100);
    const sellerAmount = formData.final_amount - platformFee;

    try {
      await createOrder.mutateAsync({
        service_id: service.id,
        seller_id: service.seller_id,
        amount: formData.final_amount,
        platform_fee_rate: platformFeeRate,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        voucher_code: formData.voucher_code,
        voucher_discount: formData.voucher_discount,
        original_amount: formData.original_amount,
        license_type_id: formData.license_type_id,
        requirement_text: formData.requirement_text,
        requirement_colors: formData.requirement_colors,
        requirement_style: formData.requirement_style,
        requirement_size: formData.requirement_size,
        requirement_purpose: formData.requirement_purpose,
        requirement_notes: formData.requirement_notes,
        reference_files: formData.reference_files,
      });
      
      toast.success('Đặt hàng thành công! Vui lòng chờ designer xác nhận.');
      setOrderDialogOpen(false);
      navigate('/settings/orders?tab=design');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-4">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="aspect-[16/9] rounded-lg mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy dịch vụ</h1>
          <Button asChild>
            <Link to="/design">Quay lại</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const heroImage = service.portfolio_images?.[0] || null;

  return (
    <Layout>
      <div className="container py-3 md:py-6">
        {/* Breadcrumb - TOP */}
        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3 overflow-x-auto">
          <Link to="/" className="hover:text-foreground transition-colors whitespace-nowrap">Trang chủ</Link>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          {service.category ? (
            <>
              <Link 
                to={`/design?category=${service.category.slug}`} 
                className="hover:text-foreground transition-colors whitespace-nowrap"
              >
                {service.category.name}
              </Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            </>
          ) : (
            <>
              <Link to="/design" className="hover:text-foreground transition-colors whitespace-nowrap">Thiết kế</Link>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">
            {service.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero Image */}
            <div className="relative rounded-lg overflow-hidden bg-muted">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={service.name}
                  className="w-full aspect-[16/9] object-cover"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/30">{service.name?.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {service.name}
            </h1>

            {/* Service Stats - Grid for mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Thời gian</div>
                  <div className="font-medium text-sm truncate">{service.delivery_days} ngày</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-muted rounded-lg">
                <RefreshCw className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Chỉnh sửa</div>
                  <div className="font-medium text-sm truncate">{service.revision_count} lần</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-muted rounded-lg">
                <FileType className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Định dạng</div>
                  <div className="font-medium text-sm truncate">{service.delivery_formats?.slice(0, 2).join(', ') || 'PNG'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-muted rounded-lg">
                <Star className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Đánh giá</div>
                  <div className="font-medium text-sm truncate">{service.average_rating?.toFixed(1) || '5.0'}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <h2 className="font-semibold mb-2 text-sm sm:text-base">Mô tả dịch vụ</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* License Types Info */}
            {availableLicenses.length > 0 && (
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <h2 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Loại bản quyền
                  </h2>
                  <div className="space-y-2">
                    {availableLicenses.map((license) => (
                      <div key={license.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{license.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {license.includes_commercial_use && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <Briefcase className="h-3 w-3" /> Thương mại
                              </span>
                            )}
                            {license.includes_exclusive_rights && (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <Lock className="h-3 w-3" /> Độc quyền
                              </span>
                            )}
                            {license.includes_source_files && (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <FileCode className="h-3 w-3" /> File gốc
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Images - Improved with pagination and lightbox */}
            {allPortfolioImages.length > 0 && (
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm sm:text-base">Mẫu thiết kế</h2>
                    <span className="text-xs text-muted-foreground">{allPortfolioImages.length} ảnh</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {currentPortfolioImages.map((img, idx) => {
                      const globalIndex = portfolioPage * IMAGES_PER_PAGE + idx;
                      return (
                        <div 
                          key={globalIndex}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted cursor-pointer hover:border-primary/50 transition-all"
                          onClick={() => {
                            setLightboxIndex(globalIndex);
                            setLightboxOpen(true);
                          }}
                        >
                          <img 
                            src={img} 
                            alt={`Portfolio ${globalIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="h-5 w-5 text-white" />
                          </div>
                          <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                            {globalIndex + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pagination */}
                  {totalPortfolioPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={portfolioPage === 0}
                        onClick={() => setPortfolioPage(p => Math.max(0, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPortfolioPages }).map((_, i) => (
                          <button
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all ${
                              i === portfolioPage 
                                ? 'bg-primary w-4' 
                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                            onClick={() => setPortfolioPage(i)}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={portfolioPage >= totalPortfolioPages - 1}
                        onClick={() => setPortfolioPage(p => Math.min(totalPortfolioPages - 1, p + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - giống style bán account game */}
          <div className="space-y-4">
            {/* Price Card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {formatPrice(service.price)}
                  </p>
                </div>
                
                {user ? (
                  <>
                    <Separator />
                    
                    {/* Payment Method Notice */}
                    <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg text-sm">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span>Thanh toán bằng số dư</span>
                    </div>
                    
                    {isOwnService ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Bạn không thể đặt dịch vụ của chính mình
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Button 
                          className="w-full"
                          size="lg"
                          onClick={() => setOrderDialogOpen(true)}
                        >
                          Đặt thiết kế ngay
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          Số dư của bạn: {formatPrice(userBalance)}
                        </p>
                      </>
                    )}
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
            {service.seller && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Link to={`/shops/${service.seller.shop_slug}`} className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={service.seller.shop_avatar_url || undefined} />
                      <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold truncate">{service.seller.shop_name}</h3>
                        {service.seller.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
                        )}
                        {service.seller.is_partner && (
                          <PartnerBadge size="sm" variant="icon-only" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{service.seller.shop_slug}</p>
                    </div>
                  </Link>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="font-bold">{service.completed_orders || 0}</p>
                      <p className="text-xs text-muted-foreground">Đã làm</p>
                    </div>
                    <div>
                      <p className="font-bold flex items-center justify-center gap-0.5">
                        {(service.seller.rating_average || 0).toFixed(1)}
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </p>
                      <p className="text-xs text-muted-foreground">Đánh giá</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-600">{service.seller.trust_score || 0}%</p>
                      <p className="text-xs text-muted-foreground">Uy tín</p>
                    </div>
                  </div>
                  
                  <Link to={`/shops/${service.seller.shop_slug}`}>
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

        {/* Order Form Dialog */}
        <DesignOrderForm
          service={service}
          availableLicenses={availableLicenses}
          sellerNdaSettings={sellerNdaSettings}
          userBalance={userBalance}
          platformFeeRate={platformFeeRate}
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          onSubmit={handleOrderSubmit}
          isSubmitting={createOrder.isPending}
        />

        {/* Portfolio Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
            <DialogTitle className="sr-only">Xem ảnh Portfolio</DialogTitle>
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-20 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Image counter */}
              <div className="absolute top-3 left-3 z-20 text-white text-sm bg-black/50 px-2 py-1 rounded">
                {lightboxIndex + 1} / {allPortfolioImages.length}
              </div>
              
              {/* Main image */}
              <div className="flex items-center justify-center min-h-[300px] max-h-[80vh]">
                <img
                  src={allPortfolioImages[lightboxIndex]}
                  alt={`Portfolio ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
              
              {/* Navigation buttons */}
              {allPortfolioImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10"
                    onClick={() => setLightboxIndex(i => (i - 1 + allPortfolioImages.length) % allPortfolioImages.length)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10"
                    onClick={() => setLightboxIndex(i => (i + 1) % allPortfolioImages.length)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {/* Thumbnails */}
              {allPortfolioImages.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 p-3 bg-black/50 overflow-x-auto">
                  {allPortfolioImages.map((img, idx) => (
                    <button
                      key={idx}
                      className={`h-12 w-12 rounded overflow-hidden shrink-0 transition-all ${
                        idx === lightboxIndex 
                          ? 'ring-2 ring-primary scale-105' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
