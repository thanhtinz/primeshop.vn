import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package as PackageIcon, Tag, Box, ShoppingCart, CreditCard, FileText, Shield, BookOpen, CheckCircle, Clock, ZoomIn, Zap, Home, Grid3X3, AlertCircle, Wallet, Loader2, LogIn, Star, ChevronDown, Heart, Bell, BellOff } from 'lucide-react';
import { PaymentLoadingOverlay } from '@/components/payment/PaymentLoadingOverlay';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuickCheckoutModal } from '@/components/checkout/QuickCheckoutModal';
import { VoucherInput } from '@/components/checkout/VoucherInput';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCartAnimation } from '@/components/cart/CartAnimation';
import { useFlashSalePrices, getFlashSalePrice } from '@/hooks/useFlashSalePrice';
import { useConfetti } from '@/hooks/useConfetti';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { rpc } from '@/lib/api-client';
import { useProduct, DbProductPackage } from '@/hooks/useProducts';
import { useAvailableAccountCount } from '@/hooks/useGameAccountInventory';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist, useToggleWishlistNotification } from '@/hooks/useWishlist';
import { RecommendedProducts } from '@/components/product/RecommendedProducts';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductReviews } from '@/components/product/ProductReviews';
import { sendDiscordNotification } from '@/hooks/useDiscordNotify';
import { useDateFormat } from '@/hooks/useDateFormat';
import { processAutoDelivery } from '@/hooks/useAutoDelivery';
import { sanitizeHtml } from '@/lib/sanitize';

// Collapsible Content Component with HTML rendering and smooth animation
const CollapsibleContent = ({ content, maxHeight = 200, t }: { content: string; maxHeight?: number; t: (key: string) => string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(maxHeight);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML content to prevent XSS
  const sanitizedContent = sanitizeHtml(content);

  useEffect(() => {
    if (innerRef.current) {
      const fullHeight = innerRef.current.scrollHeight;
      setNeedsExpansion(fullHeight > maxHeight);
      setContentHeight(isExpanded ? fullHeight : maxHeight);
    }
  }, [content, maxHeight, isExpanded]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: `${contentHeight}px` }}
      >
        <div
          ref={innerRef}
          className="prose prose-sm max-w-none text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-bold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-4 [&_audio]:w-full [&_audio]:my-2 [&_hr]:border-border [&_hr]:my-4"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
      <div 
        className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none transition-opacity duration-300 ${needsExpansion && !isExpanded ? 'opacity-100' : 'opacity-0'}`}
      />
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1 w-full mt-3 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-all duration-300 hover:bg-primary/5 rounded-lg group"
        >
          <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown className="h-4 w-4" />
          </span>
          <span className="transition-all duration-200">
            {isExpanded ? t('collapse') : t('viewMore')}
          </span>
        </button>
      )}
    </div>
  );
};

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { addToCart, setAppliedVoucher, appliedVoucher: cartAppliedVoucher, setAppliedReferralCode } = useCart();
  const { user, profile, vipLevel, refreshProfile, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { data: siteSettings } = useSiteSettings();
  const { triggerAnimation } = useCartAnimation();
  const { data: flashSalePrices } = useFlashSalePrices();
  const { fireSuccess } = useConfetti();
  const { playSuccessSound } = useNotificationSound();
  const { formatDateTime } = useDateFormat();
  
  // Wishlist hooks
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const toggleWishlistNotification = useToggleWishlistNotification();
  
  const [selectedPackage, setSelectedPackage] = useState<DbProductPackage | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [buyNowEmail, setBuyNowEmail] = useState('');
  const [buyNowVoucher, setBuyNowVoucher] = useState(cartAppliedVoucher || '');
  const [buyNowReferral, setBuyNowReferral] = useState('');
  const [showVoucherInput, setShowVoucherInput] = useState(!!cartAppliedVoucher);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'payos' | 'paypal'>('payos');
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyNowCustomerName, setBuyNowCustomerName] = useState('');
  const [buyNowCustomerPhone, setBuyNowCustomerPhone] = useState('');

  // Initialize customer fields from profile
  useEffect(() => {
    if (profile) {
      setBuyNowCustomerName(profile.full_name || '');
      setBuyNowCustomerPhone(profile.phone || '');
    }
  }, [profile]);

  // Auto-apply referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !buyNowReferral) {
      setBuyNowReferral(refCode.toUpperCase());
      toast.success(`Đã áp dụng mã giới thiệu: ${refCode.toUpperCase()}`);
    }
  }, [searchParams]);

  // Sync voucher from cart context
  useEffect(() => {
    if (cartAppliedVoucher && !buyNowVoucher) {
      setBuyNowVoucher(cartAppliedVoucher);
      setShowVoucherInput(true);
    }
  }, [cartAppliedVoucher]);

  // Handler to update voucher and save to cart context
  const handleVoucherChange = (code: string) => {
    setBuyNowVoucher(code);
    setAppliedVoucher(code);
  };
  
  const { currency, convertToUSD } = useCurrency();
  const paypalEnabled = siteSettings?.paypal_enabled ?? false;

  // Auto-select payment method based on currency
  useEffect(() => {
    if (currency === 'USD') {
      // When USD is selected, force PayPal (PayOS only supports VND)
      if (paypalEnabled) {
        setPaymentMethod('paypal');
      }
    } else {
      // When VND is selected, default to PayOS if currently on PayPal
      if (paymentMethod === 'paypal') {
        setPaymentMethod('payos');
      }
    }
  }, [currency, paypalEnabled]);

  const isGameAccount = (product?.style || 'premium') === 'game_account';
  const isGameTopup = product?.style === 'game_topup';
  const accountInfo = product?.account_info as Record<string, string> | null;
  
  // Wishlist state
  const wishlistItem = product?.id ? wishlist?.find(w => w.product_id === product.id) : null;
  const isInWishlist = !!wishlistItem;
  
  const handleToggleWishlist = () => {
    if (!user) {
      toast.error(t('pleaseLogin'));
      return;
    }
    if (!product?.id) return;
    
    if (isInWishlist) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate({ productId: product.id, notifyOnSale: false });
    }
  };
  
  const handleToggleNotification = () => {
    if (!user) {
      toast.error(t('pleaseLogin'));
      return;
    }
    if (!product?.id) return;
    
    if (isInWishlist) {
      // Already in wishlist - toggle notification
      toggleWishlistNotification.mutate({
        productId: product.id,
        notifyOnSale: !wishlistItem?.notify_on_sale,
      });
    } else {
      // Not in wishlist - must add to wishlist first
      toast.error(t('addToWishlistFirst'));
    }
  };
  
  // Get available account count for game_account products
  const { data: availableAccountCount } = useAvailableAccountCount(isGameAccount && product?.id ? product.id : '');

  // Check if all packages are out of stock (for premium and game_topup)
  const allPackagesOutOfStock = !isGameAccount && product?.packages?.length > 0 && 
    product.packages.every(pkg => pkg.is_in_stock === false);

  // Get all images for cart (including primary)
  const allImages = product?.images?.length 
    ? product.images.sort((a, b) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      }).map(img => img.image_url)
    : product?.image_url 
      ? [product.image_url] 
      : ['/placeholder.svg'];
  
  // Get gallery images - exclude primary image (used as logo/thumbnail only)
  const galleryImages = product?.images?.length 
    ? product.images
        .filter(img => !img.is_primary) // Exclude primary image from gallery
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => img.image_url)
    : [];
  
  // If no non-primary images, fall back to product.image_url or placeholder
  const displayGalleryImages = galleryImages.length > 0 
    ? galleryImages 
    : product?.image_url 
      ? [product.image_url] 
      : ['/placeholder.svg'];

  useEffect(() => {
    if (product?.packages?.length && !selectedPackage && !isGameAccount) {
      // Auto-select first in-stock package, or first package if all out of stock
      const inStockPkg = product.packages.find(pkg => pkg.is_in_stock !== false);
      setSelectedPackage(inStockPkg || product.packages[0]);
    }
  }, [product, selectedPackage, isGameAccount]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [slug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-secondary/30">
          <div className="bg-background">
            <div className="aspect-[4/3] bg-muted animate-pulse" />
          </div>
          <div className="p-4 space-y-4">
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-10 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h1 className="text-xl font-bold mb-2">{t('productNotFound')}</h1>
          <p className="text-sm text-muted-foreground mb-4">{t('productMayDeleted')}</p>
          <Link to="/">
            <Button size="sm">{t('returnToHome')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // formatPrice is now from useCurrency context

  const getPrice = () => {
    if (isGameAccount) {
      const flashPrice = getFlashSalePrice(flashSalePrices, product.id, null);
      return flashPrice ? flashPrice.salePrice : (product.price || 0);
    }
    if (selectedPackage) {
      const flashPrice = getFlashSalePrice(flashSalePrices, product.id, selectedPackage.id);
      return flashPrice ? flashPrice.salePrice : selectedPackage.price;
    }
    return 0;
  };

  const getOriginalPrice = () => {
    if (isGameAccount) {
      const flashPrice = getFlashSalePrice(flashSalePrices, product.id, null);
      return flashPrice ? flashPrice.originalPrice : null;
    }
    if (selectedPackage) {
      const flashPrice = getFlashSalePrice(flashSalePrices, product.id, selectedPackage.id);
      return flashPrice ? flashPrice.originalPrice : selectedPackage.original_price;
    }
    return null;
  };

  const getFlashSaleInfo = () => {
    if (isGameAccount) {
      return getFlashSalePrice(flashSalePrices, product.id, null);
    }
    if (selectedPackage) {
      return getFlashSalePrice(flashSalePrices, product.id, selectedPackage.id);
    }
    return undefined;
  };

  const validateCustomFields = () => {
    if (isGameAccount) return true;
    const errors: Record<string, string> = {};
    let isValid = true;
    let firstErrorFieldId: string | null = null;
    
    for (const field of product.custom_fields || []) {
      if (field.is_required && !customFields[field.id]?.trim()) {
        errors[field.id] = `${t('pleaseEnter')} ${field.field_name}`;
        isValid = false;
        if (!firstErrorFieldId) {
          firstErrorFieldId = field.id;
        }
      }
    }
    
    setFieldErrors(errors);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      
      // Scroll to first error field and add shake animation
      if (firstErrorFieldId) {
        const errorElement = document.getElementById(`custom-field-${firstErrorFieldId}`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.classList.add('animate-shake');
          setTimeout(() => errorElement.classList.remove('animate-shake'), 500);
        }
      }
    }
    return isValid;
  };

  // Real-time validation handlers
  const handleFieldChange = (fieldId: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (fieldId: string, fieldName: string, isRequired: boolean) => {
    if (isRequired && !customFields[fieldId]?.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldId]: `${t('pleaseEnter')} ${fieldName}`
      }));
    }
  };

  // Handler to open buy now dialog - validates custom fields first
  const handleOpenBuyNow = () => {
    if (!isGameAccount && !selectedPackage) {
      toast.error(t('pleaseSelectPackage'));
      return;
    }
    if (!validateCustomFields()) return;
    setBuyNowOpen(true);
  };

  const handleAddToCart = () => {
    if (!isGameAccount && !selectedPackage) {
      toast.error(t('pleaseSelectPackage'));
      return;
    }
    if (!validateCustomFields()) return;

    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.description?.substring(0, 100) || '',
      categoryId: product.category_id || '',
      images: allImages,
      packages: isGameAccount ? [{
        id: product.id,
        name: product.name,
        description: '',
        price: product.price || 0,
        features: [],
      }] : product.packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        originalPrice: pkg.original_price || undefined,
        features: [],
      })),
      customFields: [],
      featured: product.is_featured,
      createdAt: product.created_at,
    };

    const flashSaleInfo = getFlashSaleInfo();
    const cartPackage = isGameAccount ? {
      id: product.id,
      name: product.name,
      description: '',
      price: flashSaleInfo ? flashSaleInfo.salePrice : (product.price || 0),
      features: [],
    } : {
      id: selectedPackage!.id,
      name: selectedPackage!.name,
      description: selectedPackage!.description || '',
      price: flashSaleInfo ? flashSaleInfo.salePrice : selectedPackage!.price,
      originalPrice: flashSaleInfo ? flashSaleInfo.originalPrice : (selectedPackage!.original_price || undefined),
      features: [],
    };

    const flashSalePriceInfo = flashSaleInfo ? {
      salePrice: flashSaleInfo.salePrice,
      originalPrice: flashSaleInfo.originalPrice,
      discountPercent: flashSaleInfo.discountPercent,
    } : undefined;

    addToCart(cartProduct, cartPackage, customFields, flashSalePriceInfo);
    if (buyNowVoucher.trim()) {
      setAppliedVoucher(buyNowVoucher.trim());
    }
    // Also save referral code to cart if present
    if (buyNowReferral.trim()) {
      setAppliedReferralCode(buyNowReferral.trim());
    }
    triggerAnimation();
    toast.success(t('addedToCart'));
  };

  const handleBuyNow = async () => {
    if (!validateCustomFields()) return;
    
    // If user is logged in, use their email
    const email = user ? profile?.email : buyNowEmail;
    
    if (!email) {
      toast.error(t('pleaseEnterEmail'));
      return;
    }

    const flashSaleInfo = getFlashSaleInfo();
    const productPrice = flashSaleInfo 
      ? flashSaleInfo.salePrice 
      : (isGameAccount ? (product?.price || 0) : (selectedPackage?.price || 0));
    const vipDiscountPercent = vipLevel?.discount_percent || 0;
    const vipDiscount = productPrice * (vipDiscountPercent / 100);
    const amountAfterVip = productPrice - vipDiscount;
    
    // Calculate tax from site settings
    const taxRate = siteSettings?.tax_rate || 0;
    const taxAmount = amountAfterVip * (taxRate / 100);
    const finalAmount = amountAfterVip + taxAmount;

    // Determine effective payment method (for non-logged in users, use PayPal if USD)
    const effectivePaymentMethod = !user 
      ? (currency === 'USD' && paypalEnabled ? 'paypal' : 'payos')
      : paymentMethod;

    // Check balance if paying with balance
    if (effectivePaymentMethod === 'balance') {
      if (!user || !profile) {
        toast.error(t('pleaseLoginToPay'));
        return;
      }
      if (profile.balance < finalAmount) {
        toast.error(t('insufficientBalance'));
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Use editable customer info from state
      const customerName = buyNowCustomerName || null;
      const customerPhone = buyNowCustomerPhone || null;

      const productSnapshot = {
        product: {
          id: product?.id,
          name: product?.name,
          slug: product?.slug,
          image_url: product?.image_url,
          style: product?.style,
        },
        selectedPackage: isGameAccount ? {
          id: product?.id,
          name: product?.name,
          price: product?.price || 0,
        } : {
          id: selectedPackage?.id,
          name: selectedPackage?.name,
          price: selectedPackage?.price || 0,
        },
        // Convert field IDs to field names for display in invoice
        customFieldValues: Object.entries(customFields).reduce((acc, [fieldId, value]) => {
          const fieldDef = product?.custom_fields?.find(f => f.id === fieldId);
          const fieldName = fieldDef?.field_name || fieldId;
          acc[fieldName] = value;
          return acc;
        }, {} as Record<string, string>),
        quantity: 1,
        taxRate: taxRate,
        taxAmount: taxAmount,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          customer_email: email,
          customer_name: customerName,
          customer_phone: customerPhone,
          product_snapshot: productSnapshot as any,
          subtotal: productPrice,
          discount_amount: vipDiscount,
          total_amount: finalAmount,
          voucher_code: buyNowVoucher || null,
          referral_code: buyNowReferral || null,
          status: effectivePaymentMethod === 'balance' ? 'PAID' : 'PENDING_PAYMENT',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send Discord notification
      sendDiscordNotification('new_order', {
        order_number: order.order_number,
        customer_email: email,
        product_name: product?.name || '',
        package_name: isGameAccount ? product?.name : selectedPackage?.name,
        total_amount: finalAmount,
      });

      // Create payment record - always start as pending
      const { data: payment } = await supabase.from('payments').insert({
        order_id: order.id,
        amount: finalAmount,
        status: 'pending',
        payment_provider: effectivePaymentMethod,
      }).select().single();

      // If paying with balance, deduct from account
      if (effectivePaymentMethod === 'balance' && user && profile) {
        // Use atomic RPC for balance payment
        const { data: rpcResult, error: rpcError } = await rpc('pay_with_balance', {
          p_user_id: user.id,
          p_amount: finalAmount,
          p_reference_type: 'order',
          p_reference_id: order.id,
          p_note: `Mua sản phẩm: ${product?.name}`
        });

        if (rpcError) throw rpcError;

        const result = rpcResult as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || t('paymentFailed'));
        }

        // Update payment and order status after successful balance deduction
        if (payment) {
          await supabase
            .from('payments')
            .update({ status: 'completed' })
            .eq('id', payment.id);
        }

        // Process auto-delivery for game_topup and game_account
        if (product?.style === 'game_topup' || product?.style === 'game_account') {
          toast.info('Đang xử lý giao hàng...');
          const deliveryResult = await processAutoDelivery(order.id);
          if (deliveryResult.success) {
            toast.success('Giao hàng thành công!');
          } else if (deliveryResult.deliveryType !== 'manual') {
            toast.error(`Lỗi giao hàng: ${deliveryResult.message}. Vui lòng liên hệ hỗ trợ.`);
          }
        }

        await refreshProfile();
        
        // Fire confetti and play success sound
        fireSuccess();
        playSuccessSound();
        
        toast.success(t('paymentSuccess'));
        setBuyNowOpen(false);
        navigate('/order-lookup');
      } else {
        // PayOS or PayPal payment
        try {
          if (payment && payment.payment_provider === 'payos') {
            const { data } = await supabase.functions.invoke('create-order-payment', {
              body: { paymentId: payment.id }
            });
            if (data?.checkoutUrl || data?.data?.checkoutUrl) {
              const url = data.checkoutUrl || data.data.checkoutUrl;
              window.location.href = url;
              return;
            }
          }
        } catch (err) {
          console.error('create-order-payment invoke error:', err);
        }

        fireSuccess();
        playSuccessSound();
        toast.success(t('orderSuccess'));
        setBuyNowOpen(false);
        navigate('/order-lookup');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error(t('orderError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const discount = selectedPackage?.original_price && selectedPackage.price 
    ? Math.round((1 - selectedPackage.price / selectedPackage.original_price) * 100) 
    : 0;

  // Render for Game Account Style
  if (isGameAccount) {
    return (
      <Layout>
        <PaymentLoadingOverlay isProcessing={isProcessing} paymentMethod={paymentMethod} />
        <div className="min-h-screen bg-secondary/30">
          {/* Breadcrumb */}
          <div className="bg-background border-b border-border">
            <div className="container py-3">
              <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Home className="h-4 w-4" /> {t('home')}
                </Link>
                <span className="text-muted-foreground">&gt;</span>
                {product.category && (
                  <>
                    <Link to={`/category/${product.category.slug}`} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Grid3X3 className="h-4 w-4" /> {language === 'en' && product.category.name_en ? product.category.name_en : product.category.name}
                    </Link>
                    <span className="text-muted-foreground">&gt;</span>
                  </>
                )}
                <span className="text-foreground font-medium">{product.name}</span>
              </nav>
            </div>
          </div>

          {/* Desktop 2-column layout / Mobile stacked */}
          <div className="px-2 sm:px-4 lg:container py-4 lg:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* Left Column - Image Gallery */}
              <div className="lg:sticky lg:top-20 lg:self-start">
                {/* Mobile: Combined Card */}
                <div className="bg-background rounded-xl shadow-sm overflow-hidden">
                  <div className="p-2 sm:p-3 lg:p-4">
                    <ProductImageGallery 
                      images={displayGalleryImages} 
                      productName={product.name}
                      autoPlay={true}
                      autoPlayInterval={4000}
                    />
                  </div>
                  
                  {/* Mobile only: Product basic info inside same card */}
                  <div className="lg:hidden border-t border-border p-4">
                    <p className="text-muted-foreground text-sm">{product.short_description || product.name}</p>
                    <h2 className="text-primary font-semibold mt-2">{t('accountInfo')}:</h2>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-3">
                {/* Product Name & Description - Desktop only */}
                <div className="hidden lg:block bg-background rounded-xl p-4 shadow-sm">
                  <p className="text-muted-foreground text-sm">{product.short_description || product.name}</p>
                  <h2 className="text-primary font-semibold mt-2">{t('accountInfo')}:</h2>
                </div>

                {/* Account Info Table */}
                <div className="bg-background rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableBody>
                      {accountInfo && Object.entries(accountInfo).map(([key, value], idx) => (
                        <TableRow key={key} className={idx % 2 === 1 ? 'bg-secondary/30' : ''}>
                          <TableCell className="font-medium text-muted-foreground py-3">{key}</TableCell>
                          <TableCell className="text-right font-semibold py-3">{value}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className={Object.keys(accountInfo || {}).length % 2 === 1 ? 'bg-secondary/30' : ''}>
                        <TableCell className="font-medium text-muted-foreground py-3">{t('postedTime')}</TableCell>
                        <TableCell className="text-right font-semibold py-3">
                          {formatDateTime(product.created_at, 'HH:mm:ss - dd/MM/yyyy')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Price */}
                <div className="bg-background rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{t('sellingPrice')}</p>
                      <p className="text-3xl font-bold mt-1">{formatPrice(product.price || 0)}</p>
                    </div>
                    {isGameAccount && availableAccountCount !== undefined && (
                      <Badge variant={availableAccountCount > 0 ? "default" : "destructive"} className="text-sm px-3 py-1">
                        {availableAccountCount > 0 ? `${t('available')} ${availableAccountCount} acc` : t('outOfStock')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Voucher Section */}
                <div className="bg-background rounded-xl p-4 shadow-sm">
                  <button 
                    onClick={() => setShowVoucherInput(!showVoucherInput)}
                    className="flex items-center gap-2 text-primary w-full"
                  >
                    <Tag className="h-5 w-5" />
                    <span className="font-semibold">{t('applyPromoCode')}</span>
                  </button>
                  {showVoucherInput && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder={t('enterDiscountCode')}
                        value={buyNowVoucher}
                        onChange={(e) => setBuyNowVoucher(e.target.value)}
                        className="h-10"
                      />
                      <Button variant="outline" className="h-10 px-4">
                        {t('apply')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-background rounded-xl p-4 shadow-sm">
                  {!user && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 rounded-lg mb-3">
                      <LogIn className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{t('pleaseLoginToBuy')}</span>
                      <Link to="/auth" className="ml-auto">
                        <Button size="sm" variant="outline" className="h-8">
                          {t('signIn')}
                        </Button>
                      </Link>
                    </div>
                  )}
                  <div className="flex gap-2 sm:gap-3">
                    <Button 
                      onClick={() => user ? handleOpenBuyNow() : navigate('/auth')}
                      className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : 'bg-primary hover:bg-primary/90'}`}
                      disabled={!user}
                    >
                      <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
                      {t('buyNow')}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => user ? handleAddToCart() : navigate('/auth')}
                      className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : ''}`}
                      disabled={!user}
                    >
                      <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">{t('addToCart')}</span>
                      <span className="sm:hidden">{t('cart')}</span>
                    </Button>
                    <Button
                      variant={isInWishlist ? "default" : "outline"}
                      size="icon"
                      onClick={() => user ? handleToggleWishlist() : navigate('/auth')}
                      className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : isInWishlist ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                      disabled={!user || addToWishlist.isPending || removeFromWishlist.isPending}
                    >
                      <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-white' : ''}`} />
                    </Button>
                    <Button
                      variant={wishlistItem?.notify_on_sale ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        if (!user) {
                          navigate('/auth');
                          return;
                        }
                        if (!isInWishlist && product?.id) {
                          addToWishlist.mutate({ productId: product.id, notifyOnSale: true });
                          toast.success(t('addedToWishlistWithNotify'));
                        } else if (wishlistItem) {
                          handleToggleNotification();
                        }
                      }}
                      className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : wishlistItem?.notify_on_sale ? 'bg-primary hover:bg-primary/90' : ''}`}
                      disabled={!user || addToWishlist.isPending || toggleWishlistNotification.isPending}
                      title={wishlistItem?.notify_on_sale ? t('turnOffSaleNotify') : t('turnOnSaleNotify')}
                    >
                      {wishlistItem?.notify_on_sale ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    🎥 <span className="font-semibold text-destructive">{t('recordAdvice')}</span>
                  </p>
                </div>

                {/* Customer Benefits */}
                <div className="bg-background rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('customerBenefits')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{t('instantDelivery')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{t('refundGuarantee')}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{t('sellerSupport')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Products - Full Width */}
            <div className="mt-6">
              <RecommendedProducts 
                currentProductId={product.id}
                categoryId={product.category_id}
                style="game_account"
              />
            </div>
          </div>
        </div>

        {/* Buy Now Dialog for Game Account */}
        <Dialog open={buyNowOpen} onOpenChange={setBuyNowOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>{t('buyAccount')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="font-semibold">{product.category?.name} #{product.slug.toUpperCase()}</p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {formatPrice(product.price || 0)}
                </p>
                {vipLevel && vipLevel.discount_percent > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {t('vipDiscountLabel')} {vipLevel.discount_percent}%: -{formatPrice((product.price || 0) * vipLevel.discount_percent / 100)}
                  </p>
                )}
                {(siteSettings?.tax_rate || 0) > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('taxLabel')} ({siteSettings?.tax_rate}%): +{formatPrice(((product.price || 0) - ((product.price || 0) * (vipLevel?.discount_percent || 0) / 100)) * ((siteSettings?.tax_rate || 0) / 100))}
                  </p>
                )}
              </div>
              
              {/* Show email input only for non-logged in users */}
              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">{t('emailToReceiveAccount')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={buyNowEmail}
                    onChange={(e) => setBuyNowEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
              )}

              {/* Customer name and phone - editable */}
              {user && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('fullName')}</Label>
                    <Input
                      placeholder={t('enterFullName')}
                      value={buyNowCustomerName}
                      onChange={(e) => setBuyNowCustomerName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('phone')}</Label>
                    <Input
                      placeholder={t('enterPhone')}
                      value={buyNowCustomerPhone}
                      onChange={(e) => setBuyNowCustomerPhone(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              {/* Payment method selection */}
              {user && profile && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">{t('paymentMethod')}</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'balance' | 'payos' | 'paypal')}>
                    <div className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === 'balance' ? 'border-primary bg-primary/5' : 'border-border'} ${profile.balance < (product.price || 0) - ((product.price || 0) * (vipLevel?.discount_percent || 0) / 100) ? 'opacity-50' : ''}`}>
                      <RadioGroupItem value="balance" id="balance" disabled={profile.balance < (product.price || 0) - ((product.price || 0) * (vipLevel?.discount_percent || 0) / 100)} />
                      <Label htmlFor="balance" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{t('balance')}: {formatPrice(profile.balance)}</span>
                        </div>
                      </Label>
                    </div>
                    {currency === 'VND' && (
                      <div className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === 'payos' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <RadioGroupItem value="payos" id="payos" />
                        <Label htmlFor="payos" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">PayOS (VNĐ)</span>
                          </div>
                        </Label>
                      </div>
                    )}
                    {paypalEnabled && (
                      <div className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-[#003087] bg-[#003087]/5' : 'border-border'}`}>
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-[#003087]" />
                            <span className="font-medium text-sm">PayPal (USD)</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ${convertToUSD((product.price || 0) - ((product.price || 0) * (vipLevel?.discount_percent || 0) / 100)).toFixed(2)}
                          </p>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="voucher" className="text-sm font-semibold">{t('voucherCode')}</Label>
                  <VoucherInput
                    value={buyNowVoucher}
                    onChange={handleVoucherChange}
                    orderAmount={product.price || 0}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-sm font-semibold">{t('referralCode')}</Label>
                  <Input
                    id="referral"
                    placeholder="Referral"
                    value={buyNowReferral}
                    onChange={(e) => setBuyNowReferral(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>

              {!user ? (
                <div className="space-y-3">
                  <Button onClick={handleBuyNow} disabled={isProcessing} className="w-full h-14 text-base font-bold">
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CreditCard className="h-5 w-5 mr-2" />}
                    {currency === 'USD' && paypalEnabled ? 'PayPal' : t('payWithPayOSBtn')}
                  </Button>
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('loginToPayWithBalance')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button onClick={handleBuyNow} disabled={isProcessing} className="w-full h-14 text-base font-bold">
                  {isProcessing ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('processing')}</>
                  ) : paymentMethod === 'balance' ? (
                    <><Wallet className="h-5 w-5 mr-2" /> {t('payWithBalanceBtn')}</>
                  ) : paymentMethod === 'paypal' ? (
                    <><CreditCard className="h-5 w-5 mr-2" /> PayPal</>
                  ) : (
                    <><CreditCard className="h-5 w-5 mr-2" /> {t('payWithPayOSBtn')}</>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  // Render for Game Topup Style
  if (isGameTopup) {
    return (
      <Layout>
        <PaymentLoadingOverlay isProcessing={isProcessing} paymentMethod={paymentMethod} />
        <div className="min-h-screen bg-secondary/30">
          {/* Breadcrumb */}
          <div className="bg-background border-b border-border">
            <div className="container py-3">
              <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Home className="h-4 w-4" /> {t('home')}
                </Link>
                <span className="text-muted-foreground">&gt;</span>
                {product.category && (
                  <>
                    <Link to={`/category/${product.category.slug}`} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <Grid3X3 className="h-4 w-4" /> {language === 'en' && product.category.name_en ? product.category.name_en : product.category.name}
                    </Link>
                    <span className="text-muted-foreground">&gt;</span>
                  </>
                )}
                <span className="text-foreground font-medium flex items-center gap-1">
                  <Zap className="h-4 w-4" /> {product.name}
                </span>
              </nav>
            </div>
          </div>

          {/* Product Header */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white">
            <div className="container py-6">
              <div className="flex items-center gap-4">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-24 h-24 rounded-xl object-cover" />
                )}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">{product.name}</h1>
                  {/* Dynamic tags from database */}
                  {product.tags?.includes('giao_nhanh') && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border border-amber-400/50 text-amber-300 text-sm">
                      <Zap className="h-4 w-4" />
                      Giao hàng ngay lập tức
                    </div>
                  )}
                  {product.tags?.includes('dat_hang') && !product.tags?.includes('giao_nhanh') && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border border-blue-400/50 text-blue-300 text-sm">
                      <PackageIcon className="h-4 w-4" />
                      Đặt hàng
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Package Selection */}
          {product.packages?.length > 0 && (
            <div className="bg-background mt-2 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Chọn gói nạp
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {product.packages.map(pkg => {
                  const pkgDiscount = pkg.original_price && pkg.price 
                    ? Math.round((1 - pkg.price / pkg.original_price) * 100) 
                    : 0;
                  const isOutOfStock = pkg.is_in_stock === false;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => !isOutOfStock && setSelectedPackage(pkg)}
                      disabled={isOutOfStock}
                      className={`relative rounded-xl border-2 p-3 transition-all text-left ${
                        isOutOfStock
                          ? 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                          : selectedPackage?.id === pkg.id 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      {isOutOfStock ? (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] px-1.5 bg-muted-foreground text-background">
                          Hết hàng
                        </Badge>
                      ) : pkgDiscount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 text-[10px] px-1.5">
                          -{pkgDiscount}%
                        </Badge>
                      )}
                      <div className="flex flex-col items-center">
                        {pkg.image_url ? (
                          <img src={pkg.image_url} alt={pkg.name} className="w-10 h-10 object-contain mb-2" />
                        ) : (
                          <CreditCard className="w-10 h-10 text-muted-foreground mb-2" strokeWidth={1.5} />
                        )}
                        <h4 className={`font-semibold text-sm text-center line-clamp-2 ${isOutOfStock ? 'text-muted-foreground' : ''}`}>{pkg.name}</h4>
                        <p className={`font-bold mt-1 ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>{formatPrice(pkg.price)}</p>
                        {pkg.original_price && pkgDiscount > 0 && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(pkg.original_price)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {product.custom_fields && product.custom_fields.length > 0 && (
            <div className="bg-background mt-2 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                {t('orderInfo')}
              </h3>
              <div className="space-y-4">
                {product.custom_fields.map(field => (
                  <div key={field.id} id={`custom-field-${field.id}`} className="space-y-1.5">
                    <Label className={`text-sm font-medium ${fieldErrors[field.id] ? 'text-destructive' : ''}`}>
                      {field.field_name} {field.is_required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.field_type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder || `${t('enter')} ${field.field_name.toLowerCase()}`}
                        value={customFields[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        onBlur={() => handleFieldBlur(field.id, field.field_name, field.is_required)}
                        className={`bg-secondary/50 transition-colors ${
                          fieldErrors[field.id] 
                            ? 'border-destructive focus-visible:ring-destructive/50' 
                            : 'border-border'
                        }`}
                      />
                    ) : field.field_type === 'selection' && Array.isArray((field as any).options) ? (
                      <Select
                        value={customFields[field.id] || ''}
                        onValueChange={(value) => {
                          handleFieldChange(field.id, value);
                          handleFieldBlur(field.id, field.field_name, field.is_required);
                        }}
                      >
                        <SelectTrigger className={`bg-secondary/50 h-12 transition-colors ${
                          fieldErrors[field.id] 
                            ? 'border-destructive focus-visible:ring-destructive/50' 
                            : 'border-border'
                        }`}>
                          <SelectValue placeholder={field.placeholder || `${t('select')} ${field.field_name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {((field as any).options as string[]).map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder || `${t('enter')} ${field.field_name.toLowerCase()}`}
                        value={customFields[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        onBlur={() => handleFieldBlur(field.id, field.field_name, field.is_required)}
                        className={`bg-secondary/50 h-12 transition-colors ${
                          fieldErrors[field.id] 
                            ? 'border-destructive focus-visible:ring-destructive/50' 
                            : 'border-border'
                        }`}
                      />
                    )}
                    {fieldErrors[field.id] && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors[field.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voucher Section */}
          <div className="bg-background mt-2 p-4">
            <button 
              onClick={() => setShowVoucherInput(!showVoucherInput)}
              className="flex items-center gap-2 text-primary w-full"
            >
              <Tag className="h-5 w-5" />
              <span className="font-semibold">{t('applyPromoCode')}</span>
            </button>
            {showVoucherInput && (
              <div className="mt-3">
                <VoucherInput
                  value={buyNowVoucher}
                  onChange={handleVoucherChange}
                  orderAmount={selectedPackage?.price || 0}
                  placeholder={t('enterDiscountCode')}
                  className="h-10"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-background mt-2 p-4">
            {allPackagesOutOfStock && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{t('allPackagesOutOfStock')}</span>
              </div>
            )}
            {!user && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 rounded-lg mb-3">
                <LogIn className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{t('pleaseLoginToBuy')}</span>
                <Link to="/auth" className="ml-auto">
                  <Button size="sm" variant="outline" className="h-8">
                    {t('signIn')}
                  </Button>
                </Link>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                onClick={() => user ? handleOpenBuyNow() : navigate('/auth')}
                className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : 'bg-primary hover:bg-primary/90'}`}
                disabled={!user || !selectedPackage || allPackagesOutOfStock}
              >
                <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
                {t('buyNow')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => user ? handleAddToCart() : navigate('/auth')}
                className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : ''}`}
                disabled={!user || !selectedPackage || allPackagesOutOfStock}
              >
                <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('addToCart')}</span>
                <span className="sm:hidden">{t('cart')}</span>
              </Button>
              <Button
                variant={isInWishlist ? "default" : "outline"}
                size="icon"
                onClick={() => user ? handleToggleWishlist() : navigate('/auth')}
                className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : isInWishlist ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                disabled={!user || addToWishlist.isPending || removeFromWishlist.isPending}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-white' : ''}`} />
              </Button>
              <Button
                variant={wishlistItem?.notify_on_sale ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  if (!user) {
                    navigate('/auth');
                    return;
                  }
                  if (!isInWishlist && product?.id) {
                    addToWishlist.mutate({ productId: product.id, notifyOnSale: true });
                    toast.success(t('addedToWishlistWithNotify'));
                  } else if (wishlistItem) {
                    handleToggleNotification();
                  }
                }}
                className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : wishlistItem?.notify_on_sale ? 'bg-primary hover:bg-primary/90' : ''}`}
                disabled={!user || addToWishlist.isPending || toggleWishlistNotification.isPending}
                title={wishlistItem?.notify_on_sale ? t('turnOffSaleNotify') : t('turnOnSaleNotify')}
              >
                {wishlistItem?.notify_on_sale ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-background mt-4 p-4 rounded-lg border border-border">
            <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              {t('productReviews')}
            </h3>
            <ProductReviews productId={product.id} />
          </div>

          <RecommendedProducts currentProductId={product.id} categoryId={product.category_id} style="game_topup" />
          <div className="h-4" />
        </div>

        {/* Buy Now Dialog */}
        <QuickCheckoutModal
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          productName={product.name}
          packageName={selectedPackage?.name}
          packagePrice={selectedPackage?.price || 0}
          vipDiscount={user && vipLevel ? (selectedPackage?.price || 0) * vipLevel.discount_percent / 100 : 0}
          vipDiscountPercent={vipLevel?.discount_percent || 0}
          taxRate={siteSettings?.tax_rate || 0}
          taxAmount={((selectedPackage?.price || 0) - ((selectedPackage?.price || 0) * (vipLevel?.discount_percent || 0) / 100)) * ((siteSettings?.tax_rate || 0) / 100)}
          user={user}
          profile={profile}
          email={buyNowEmail}
          onEmailChange={setBuyNowEmail}
          customerName={buyNowCustomerName}
          onCustomerNameChange={setBuyNowCustomerName}
          customerPhone={buyNowCustomerPhone}
          onCustomerPhoneChange={setBuyNowCustomerPhone}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paypalEnabled={paypalEnabled}
          currency={currency}
          voucherCode={buyNowVoucher}
          onVoucherChange={handleVoucherChange}
          referralCode={buyNowReferral}
          onReferralChange={setBuyNowReferral}
          isProcessing={isProcessing}
          onCheckout={handleBuyNow}
          formatPrice={formatPrice}
          convertToUSD={convertToUSD}
        />
      </Layout>
    );
  }

  // Render for Premium Style (Original)
  return (
    <Layout>
      <PaymentLoadingOverlay isProcessing={isProcessing} paymentMethod={paymentMethod} />
      <div className="min-h-screen bg-secondary/30">
        {/* Breadcrumb */}
        <div className="container py-3 md:py-4">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground overflow-x-auto">
            <Link to="/" className="hover:text-foreground transition-colors whitespace-nowrap">{t('home')}</Link>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            {product.category && (
              <>
                <Link 
                  to={`/category/${product.category.slug}`} 
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {language === 'en' && product.category.name_en ? product.category.name_en : product.category.name}
                </Link>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              </>
            )}
            <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
          </div>
        </div>

        {/* Product Image Gallery + Info (Combined on Mobile) */}
        <div className="bg-background mt-2">
          {/* Image Gallery */}
          <div className="p-3 lg:p-4 lg:container">
                <ProductImageGallery 
                  images={displayGalleryImages} 
                  productName={product.name}
                  autoPlay={true}
                  autoPlayInterval={4000}
                />
              </div>
              
              {/* Product Info - Inside same card */}
              <div className="border-t border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('productLabel')}</p>
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight mb-3">
                  {product.name}
                </h1>

                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('status')}:</span>
                    <span className={allPackagesOutOfStock ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                      {allPackagesOutOfStock ? t('outOfStock') : t('inStock')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">&lt;/&gt;</span>
                    <span className="text-muted-foreground">{t('productCode')}:</span>
                    <span className="font-medium">{product.slug}</span>
                  </div>
                  {product.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('category')}:</span>
                      <Link to={`/category/${product.category.slug}`} className="text-primary font-medium">
                        {language === 'en' && product.category.name_en ? product.category.name_en : product.category.name}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl md:text-3xl font-bold text-foreground">
                      {selectedPackage ? formatPrice(selectedPackage.price) : '--'}
                    </span>
                  </div>
                  {selectedPackage?.original_price && discount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base text-muted-foreground line-through">
                        {formatPrice(selectedPackage.original_price)}
                      </span>
                      <Badge variant="destructive" className="text-xs">-{discount}%</Badge>
                    </div>
                  )}
                </div>
              </div>
        </div>

        {/* Package Selection */}
        {product.packages?.length > 0 && (
          <div className="bg-background mt-2 p-4">
            <h3 className="font-semibold mb-3">{t('usagePeriod')}</h3>
            <div className="flex flex-wrap gap-2">
              {product.packages.map(pkg => {
                const isOutOfStock = pkg.is_in_stock === false;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => !isOutOfStock && setSelectedPackage(pkg)}
                    disabled={isOutOfStock}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border relative ${
                      isOutOfStock
                        ? 'border-border bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed'
                        : selectedPackage?.id === pkg.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary text-foreground'
                    }`}
                  >
                    {pkg.name}
                    {isOutOfStock && <span className="ml-1 text-xs">({t('outOfStockShort')})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {product.custom_fields && product.custom_fields.length > 0 && (
          <div className="bg-background mt-2 p-4">
            <h3 className="font-semibold mb-3">{t('enterAdditionalInfo')}</h3>
            <div className="space-y-3">
              {product.custom_fields.map(field => (
                <div key={field.id} id={`custom-field-${field.id}`} className="space-y-1.5">
                  <Label className={`text-sm font-medium ${fieldErrors[field.id] ? 'text-destructive' : ''}`}>
                    {field.field_name} {field.is_required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.field_type === 'textarea' ? (
                    <Textarea
                      placeholder={field.placeholder || field.field_name}
                      value={customFields[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      onBlur={() => handleFieldBlur(field.id, field.field_name, field.is_required)}
                      className={`bg-secondary/50 transition-colors ${
                        fieldErrors[field.id] 
                          ? 'border-destructive focus-visible:ring-destructive/50' 
                          : 'border-border'
                      }`}
                    />
                  ) : (
                    <Input
                      type={field.field_type === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder || field.field_name}
                      value={customFields[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      onBlur={() => handleFieldBlur(field.id, field.field_name, field.is_required)}
                      className={`bg-secondary/50 h-12 transition-colors ${
                        fieldErrors[field.id] 
                          ? 'border-destructive focus-visible:ring-destructive/50' 
                          : 'border-border'
                      }`}
                    />
                  )}
                  {fieldErrors[field.id] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors[field.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voucher Section */}
        <div className="bg-background mt-2 p-4">
          <button 
            onClick={() => setShowVoucherInput(!showVoucherInput)}
            className="flex items-center gap-2 text-primary w-full"
          >
            <Tag className="h-5 w-5" />
            <span className="font-semibold">{t('applyPromoCode')}</span>
          </button>
          {showVoucherInput && (
            <div className="mt-3">
              <VoucherInput
                value={buyNowVoucher}
                onChange={handleVoucherChange}
                orderAmount={selectedPackage?.price || 0}
                placeholder={t('enterDiscountCode')}
                className="h-10"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-background mt-2 p-4">
          {allPackagesOutOfStock && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Tất cả các gói hiện đang hết hàng. Vui lòng quay lại sau.</span>
            </div>
          )}
          {!user && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 rounded-lg mb-3">
              <LogIn className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{t('pleaseLoginToBuy')}</span>
              <Link to="/auth" className="ml-auto">
                <Button size="sm" variant="outline" className="h-8">
                  {t('signIn')}
                </Button>
              </Link>
            </div>
          )}
          <div className="flex gap-2 sm:gap-3">
            <Button 
              onClick={() => user ? handleOpenBuyNow() : navigate('/auth')}
              className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : 'bg-primary hover:bg-primary/90'}`}
              disabled={!user || allPackagesOutOfStock}
            >
              <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
              {t('buyNow')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => user ? handleAddToCart() : navigate('/auth')}
              className={`flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold ${!user ? 'opacity-60' : ''}`}
              disabled={!user || allPackagesOutOfStock}
            >
              <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">{t('addToCart')}</span>
              <span className="sm:hidden">{t('cart')}</span>
            </Button>
            <Button
              variant={isInWishlist ? "default" : "outline"}
              size="icon"
              onClick={() => user ? handleToggleWishlist() : navigate('/auth')}
              className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : isInWishlist ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              disabled={!user || addToWishlist.isPending || removeFromWishlist.isPending}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-white' : ''}`} />
            </Button>
            <Button
              variant={wishlistItem?.notify_on_sale ? "default" : "outline"}
              size="icon"
              onClick={() => {
                if (!user) {
                  navigate('/auth');
                  return;
                }
                if (!isInWishlist && product?.id) {
                  addToWishlist.mutate({ productId: product.id, notifyOnSale: true });
                  toast.success(t('addedToWishlistWithNotify'));
                } else if (wishlistItem) {
                  handleToggleNotification();
                }
              }}
              className={`h-11 sm:h-12 w-11 sm:w-12 shrink-0 ${!user ? 'opacity-60' : wishlistItem?.notify_on_sale ? 'bg-primary hover:bg-primary/90' : ''}`}
              disabled={!user || addToWishlist.isPending || toggleWishlistNotification.isPending}
              title={wishlistItem?.notify_on_sale ? t('turnOffSaleNotify') : t('turnOnSaleNotify')}
            >
              {wishlistItem?.notify_on_sale ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Product Content Tabs */}
        <div className="bg-background mt-2 p-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-11 bg-secondary/50">
              <TabsTrigger value="description" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4 mr-1.5 hidden md:inline" />
                {t('description')}
              </TabsTrigger>
              <TabsTrigger value="warranty" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-4 w-4 mr-1.5 hidden md:inline" />
                {t('warranty')}
              </TabsTrigger>
              <TabsTrigger value="guide" className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4 mr-1.5 hidden md:inline" />
                {t('guide')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-4">
              {product.description ? (
                <CollapsibleContent content={product.description} maxHeight={200} t={t} />
              ) : (
                <p className="text-muted-foreground text-sm text-center py-6">{t('noData')}</p>
              )}
            </TabsContent>
            
            <TabsContent value="warranty" className="mt-4">
              {product.warranty_info ? (
                <CollapsibleContent content={product.warranty_info} maxHeight={200} t={t} />
              ) : (
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>• {t('warranty')}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guide" className="mt-4">
              {product.usage_guide ? (
                <CollapsibleContent content={product.usage_guide} maxHeight={200} t={t} />
              ) : (
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>{t('usageGuide')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Reviews Section */}
        <div className="bg-background mt-4 p-4 rounded-lg border border-border">
          <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            {t('productReviews')}
          </h3>
          <ProductReviews productId={product.id} />
        </div>

        {/* Recommended Products */}
        <RecommendedProducts 
          currentProductId={product.id}
          categoryId={product.category_id}
          style="premium"
        />

        <div className="h-4" />
      </div>

      {/* Buy Now Dialog */}
      <QuickCheckoutModal
        open={buyNowOpen}
        onOpenChange={setBuyNowOpen}
        productName={product.name}
        packageName={selectedPackage?.name}
        packagePrice={selectedPackage?.price || 0}
        vipDiscount={user && vipLevel ? (selectedPackage?.price || 0) * vipLevel.discount_percent / 100 : 0}
        vipDiscountPercent={vipLevel?.discount_percent || 0}
        taxRate={siteSettings?.tax_rate || 0}
        taxAmount={((selectedPackage?.price || 0) - ((selectedPackage?.price || 0) * (vipLevel?.discount_percent || 0) / 100)) * ((siteSettings?.tax_rate || 0) / 100)}
        user={user}
        profile={profile}
        email={buyNowEmail}
        onEmailChange={setBuyNowEmail}
        customerName={buyNowCustomerName}
        onCustomerNameChange={setBuyNowCustomerName}
        customerPhone={buyNowCustomerPhone}
        onCustomerPhoneChange={setBuyNowCustomerPhone}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paypalEnabled={paypalEnabled}
        currency={currency}
        voucherCode={buyNowVoucher}
        onVoucherChange={handleVoucherChange}
        referralCode={buyNowReferral}
        onReferralChange={setBuyNowReferral}
        isProcessing={isProcessing}
        onCheckout={handleBuyNow}
        formatPrice={formatPrice}
        convertToUSD={convertToUSD}
      />
    </Layout>
  );
};

export default ProductPage;