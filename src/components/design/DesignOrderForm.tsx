import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Wallet, AlertCircle, Clock, RefreshCw, FileText, Upload, X,
  Lock, Briefcase, FileCode, Zap, Shield, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle2, Save, Info, ArrowRight, Calendar, Ticket, Loader2
} from 'lucide-react';
import { DesignService } from '@/hooks/useDesignServices';
import { DesignLicenseType } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Blocked keywords for anti-fraud
const BLOCKED_KEYWORDS = [
  'zalo', 'telegram', 'facebook', 'messenger', 'whatsapp', 'viber',
  'sdt', 'số điện thoại', 'phone', 'email:', '@gmail', '@yahoo',
  'liên hệ ngoài', 'giao dịch ngoài', 'thanh toán ngoài'
];

interface DesignServiceLicensePrice {
  id: string;
  service_id: string;
  license_type_id: string;
  price: number;
  is_enabled: boolean;
}

interface DesignOrderFormProps {
  service: DesignService & { 
    extra_revision_price?: number; 
    rush_delivery_fee?: number;
    license_prices?: DesignServiceLicensePrice[];
  };
  availableLicenses: DesignLicenseType[];
  sellerNdaSettings?: any;
  userBalance: number;
  platformFeeRate: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrderFormData) => Promise<void>;
  isSubmitting: boolean;
}

export interface OrderFormData {
  requirement_text: string;
  requirement_colors: string;
  requirement_style: string;
  requirement_size: string;
  requirement_purpose: string;
  requirement_notes: string;
  reference_files: string[];
  license_type_id: string | null;
  extra_revisions: number;
  rush_delivery: boolean;
  rush_days: number;
  requires_nda: boolean;
  deadline_type: 'standard' | 'rush';
  agreed_scope: boolean;
  agreed_revisions: boolean;
  agreed_refund: boolean;
  voucher_code: string | null;
  voucher_discount: number;
  final_amount: number;
  original_amount: number;
}

const STEPS = [
  { id: 1, title: 'Thông tin yêu cầu', icon: FileText },
  { id: 2, title: 'Tùy chọn mở rộng', icon: Zap },
  { id: 3, title: 'Xác nhận & Thanh toán', icon: CheckCircle2 },
];

export function DesignOrderForm({
  service,
  availableLicenses,
  sellerNdaSettings,
  userBalance,
  platformFeeRate,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: DesignOrderFormProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Voucher state
  const [voucherInput, setVoucherInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number; discount_type: string; discount_value: number } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    requirement_text: '',
    requirement_colors: '',
    requirement_style: '',
    requirement_size: '',
    requirement_purpose: '',
    requirement_notes: '',
    reference_files: [],
    license_type_id: availableLicenses[0]?.id || null,
    extra_revisions: 0,
    rush_delivery: false,
    rush_days: service.delivery_days,
    requires_nda: false,
    deadline_type: 'standard',
    agreed_scope: false,
    agreed_revisions: false,
    agreed_refund: false,
    voucher_code: null,
    voucher_discount: 0,
    final_amount: service.price,
    original_amount: service.price,
  });

  // Draft saving
  const DRAFT_KEY = `design_order_draft_${service.id}`;
  
  useEffect(() => {
    // Load draft on mount
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
        toast.info('Đã khôi phục bản nháp trước đó');
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [service.id]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      requirement_text: formData.requirement_text,
      requirement_colors: formData.requirement_colors,
      requirement_style: formData.requirement_style,
      requirement_size: formData.requirement_size,
      requirement_purpose: formData.requirement_purpose,
      requirement_notes: formData.requirement_notes,
      reference_files: formData.reference_files,
    }));
    toast.success('Đã lưu bản nháp');
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  // Pricing calculations - use shop-level prices from seller settings
  const selectedLicense = availableLicenses.find(l => l.id === formData.license_type_id);
  
  // Get shop-level pricing from seller
  const sellerPricing = service.seller;
  
  // Shop-defined prices from seller settings (not per-service!)
  const extraRevisionPrice = sellerPricing?.design_extra_revision_price || 0;
  const rushDeliveryFee = sellerPricing?.design_rush_delivery_fee || 0;
  const commercialLicensePrice = sellerPricing?.design_commercial_license_price || 0;
  const exclusiveLicensePrice = sellerPricing?.design_exclusive_license_price || 0;
  
  // Get license price based on license type - use shop-level settings
  const getLicensePriceByType = (license: typeof availableLicenses[0]) => {
    if (!license) return service.price;
    
    // Check license code to apply shop-level pricing
    const licenseCode = license.code?.toLowerCase() || '';
    
    // Commercial license - add shop's commercial fee to base price
    if (licenseCode.includes('commercial') && commercialLicensePrice > 0) {
      return service.price + commercialLicensePrice;
    }
    
    // Exclusive license - add shop's exclusive fee to base price
    if (licenseCode.includes('exclusive') && exclusiveLicensePrice > 0) {
      return service.price + exclusiveLicensePrice;
    }
    
    // Standard/Personal license - just base price
    if (licenseCode.includes('personal') || licenseCode.includes('standard')) {
      return service.price;
    }
    
    // Fallback to base price * multiplier
    const multiplier = license?.price_multiplier || 1;
    return service.price * multiplier;
  };
  
  // Get currently selected license price
  const getSelectedLicensePrice = () => {
    return getLicensePriceByType(selectedLicense as typeof availableLicenses[0]);
  };
  
  const ndaFee = formData.requires_nda ? (sellerNdaSettings?.nda_fee || 0) : 0;
  
  const basePrice = getSelectedLicensePrice();
  const revisionCost = formData.extra_revisions * extraRevisionPrice;
  const rushCost = formData.rush_delivery ? rushDeliveryFee : 0;
  const subtotal = basePrice + revisionCost + rushCost + ndaFee;
  const finalPrice = Math.max(0, subtotal - formData.voucher_discount);
  
  const insufficientBalance = userBalance < finalPrice;
  
  // Check if rush delivery is available (shop enabled it)
  const rushDeliveryAvailable = rushDeliveryFee > 0;
  
  // Check if extra revisions are available (shop enabled it)
  const extraRevisionsAvailable = extraRevisionPrice > 0;

  // Validate blocked keywords
  const checkBlockedKeywords = (text: string): string[] => {
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    BLOCKED_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    });
    return found;
  };

  // Validate current step
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    if (step === 1) {
      if (!formData.requirement_text.trim()) {
        errors.push('Vui lòng nhập nội dung yêu cầu thiết kế');
      } else if (formData.requirement_text.length < 20) {
        errors.push('Nội dung yêu cầu quá ngắn (tối thiểu 20 ký tự)');
      }
      
      // Check blocked keywords
      const blockedInText = checkBlockedKeywords(formData.requirement_text);
      const blockedInNotes = checkBlockedKeywords(formData.requirement_notes);
      if (blockedInText.length > 0 || blockedInNotes.length > 0) {
        errors.push('Không được nhập thông tin liên hệ ngoài hệ thống');
      }
    }
    
    if (step === 3) {
      if (!formData.agreed_scope) {
        errors.push('Vui lòng xác nhận phạm vi công việc');
      }
      if (!formData.agreed_revisions) {
        errors.push('Vui lòng xác nhận số lần chỉnh sửa');
      }
      if (!formData.agreed_refund) {
        errors.push('Vui lòng xác nhận chính sách hoàn tiền');
      }
    }
    
    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    
    // Show risk warning for rush orders
    if (currentStep === 2 && formData.rush_delivery) {
      setShowRiskWarning(true);
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setValidationErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const errors = validateStep(3);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    if (insufficientBalance) {
      toast.error('Số dư không đủ');
      return;
    }
    
    await onSubmit({
      ...formData,
      final_amount: finalPrice,
      original_amount: subtotal,
    });
    
    clearDraft();
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFiles(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn (tối đa 10MB)`);
          continue;
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error } = await supabase.storage
          .from('design-references')
          .upload(fileName, file);
        
        if (error) {
          console.error('Upload error:', error);
          toast.error(`Lỗi upload ${file.name}`);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('design-references')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
      }
      
      setFormData(prev => ({
        ...prev,
        reference_files: [...prev.reference_files, ...uploadedUrls]
      }));
      
      if (uploadedUrls.length > 0) {
        toast.success(`Đã upload ${uploadedUrls.length} file`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Có lỗi xảy ra khi upload file');
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reference_files: prev.reference_files.filter((_, i) => i !== index)
    }));
  };

  // Apply voucher function
  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    
    setApplyingVoucher(true);
    setVoucherError(null);
    
    try {
      // Check if voucher exists and is valid
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherInput.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error || !voucher) {
        setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        return;
      }
      
      // Check if voucher has expired
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        setVoucherError('Mã giảm giá đã hết hạn');
        return;
      }
      
      // Check if voucher has usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        setVoucherError('Mã giảm giá đã hết lượt sử dụng');
        return;
      }
      
      // Check minimum order amount
      if (voucher.min_order_value && subtotal < voucher.min_order_value) {
        setVoucherError(`Đơn hàng tối thiểu ${formatPrice(voucher.min_order_value)}`);
        return;
      }
      
      // Calculate discount
      let discountAmount = 0;
      if (voucher.discount_type === 'percentage') {
        discountAmount = subtotal * (voucher.discount_value / 100);
        if (voucher.max_discount && discountAmount > voucher.max_discount) {
          discountAmount = voucher.max_discount;
        }
      } else {
        discountAmount = voucher.discount_value;
      }
      
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      
      setAppliedVoucher({
        code: voucher.code,
        discount: discountAmount,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value
      });
      
      setFormData(prev => ({
        ...prev,
        voucher_code: voucher.code,
        voucher_discount: discountAmount
      }));
      
      toast.success(`Đã áp dụng mã giảm giá: -${formatPrice(discountAmount)}`);
    } catch (err) {
      console.error('Voucher error:', err);
      setVoucherError('Có lỗi xảy ra khi áp dụng mã');
    } finally {
      setApplyingVoucher(false);
    }
  };
  
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    setFormData(prev => ({
      ...prev,
      voucher_code: null,
      voucher_discount: 0
    }));
  };

  const getSuggestions = () => {
    const categoryName = (service as any).category?.name?.toLowerCase() || '';
    
    if (categoryName.includes('logo')) {
      return {
        style: 'Minimalist, Modern, Vintage, Abstract',
        colors: 'Xanh dương, Đỏ, Gradient',
        size: '1000x1000px, Vector',
        purpose: 'Thương hiệu, Social media, In ấn'
      };
    }
    if (categoryName.includes('banner')) {
      return {
        style: 'Professional, Eye-catching, Minimal',
        colors: 'Phù hợp với thương hiệu',
        size: '1200x628px (Facebook), 1920x1080px',
        purpose: 'Quảng cáo, Social media, Website'
      };
    }
    return {
      style: 'Hiện đại, Cổ điển, Minimalist',
      colors: 'Tùy theo sở thích',
      size: '1920x1080px',
      purpose: 'Social media, In ấn, Website'
    };
  };
  
  const suggestions = getSuggestions();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Header with Steps */}
          <div className="sticky top-0 bg-background z-10 border-b">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="text-lg">Đặt thiết kế - {service.name}</DialogTitle>
            </DialogHeader>
            
            {/* Step Indicator */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                        currentStep === step.id 
                          ? 'bg-primary text-primary-foreground' 
                          : currentStep > step.id 
                            ? 'bg-green-500/20 text-green-600' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.id}</span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={(currentStep / 3) * 100} className="h-1" />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Requirements */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Thông tin yêu cầu thiết kế</h3>
                  <Button variant="outline" size="sm" onClick={saveDraft}>
                    <Save className="h-4 w-4 mr-1" />
                    Lưu nháp
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Nội dung yêu cầu chính <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      value={formData.requirement_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, requirement_text: e.target.value }))}
                      placeholder="Mô tả chi tiết nội dung bạn muốn thiết kế. Ví dụ: Tên thương hiệu, slogan, ý tưởng..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tối thiểu 20 ký tự. Càng chi tiết càng tốt.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Màu sắc mong muốn</Label>
                      <Input
                        value={formData.requirement_colors}
                        onChange={(e) => setFormData(prev => ({ ...prev, requirement_colors: e.target.value }))}
                        placeholder={suggestions.colors}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Phong cách</Label>
                      <Input
                        value={formData.requirement_style}
                        onChange={(e) => setFormData(prev => ({ ...prev, requirement_style: e.target.value }))}
                        placeholder={suggestions.style}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Kích thước</Label>
                      <Input
                        value={formData.requirement_size}
                        onChange={(e) => setFormData(prev => ({ ...prev, requirement_size: e.target.value }))}
                        placeholder={suggestions.size}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Mục đích sử dụng</Label>
                      <Input
                        value={formData.requirement_purpose}
                        onChange={(e) => setFormData(prev => ({ ...prev, requirement_purpose: e.target.value }))}
                        placeholder={suggestions.purpose}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">File tham khảo</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.psd,.ai"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="reference-files"
                        disabled={uploadingFiles}
                      />
                      <label 
                        htmlFor="reference-files" 
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {uploadingFiles ? 'Đang upload...' : 'Kéo thả hoặc click để upload'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PNG, JPG, PDF, PSD, AI (tối đa 10MB/file)
                        </span>
                      </label>
                    </div>
                    
                    {formData.reference_files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.reference_files.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={url} 
                              alt={`Reference ${idx + 1}`}
                              className="h-16 w-16 object-cover rounded border"
                            />
                            <button
                              onClick={() => removeFile(idx)}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Ghi chú thêm</Label>
                    <Textarea
                      value={formData.requirement_notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, requirement_notes: e.target.value }))}
                      placeholder="Các yêu cầu khác, lưu ý đặc biệt..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Extended Options */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Tùy chọn mở rộng</h3>

                {/* License Type */}
                {availableLicenses.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="font-medium flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4" />
                        Loại bản quyền
                      </Label>
                      <RadioGroup 
                        value={formData.license_type_id || ''} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, license_type_id: val }))}
                        className="space-y-2"
                      >
                        {availableLicenses.map((license) => (
                          <div 
                            key={license.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.license_type_id === license.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, license_type_id: license.id }))}
                          >
                            <RadioGroupItem value={license.id} id={license.id} className="mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <label htmlFor={license.id} className="font-medium text-sm cursor-pointer">
                                  {license.name}
                                </label>
                                <span className="text-sm font-semibold text-primary">
                                  {formatPrice(getLicensePriceByType(license))}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {license.includes_commercial_use && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Briefcase className="h-3 w-3 mr-1" /> Thương mại
                                  </Badge>
                                )}
                                {license.includes_exclusive_rights && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" /> Độc quyền
                                  </Badge>
                                )}
                                {license.includes_source_files && (
                                  <Badge variant="secondary" className="text-xs">
                                    <FileCode className="h-3 w-3 mr-1" /> File gốc
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                )}

                {/* Deadline Options - Only show if rush delivery is available */}
                {rushDeliveryAvailable ? (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="font-medium flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4" />
                        Thời gian giao hàng
                      </Label>
                      <RadioGroup 
                        value={formData.deadline_type} 
                        onValueChange={(val: 'standard' | 'rush') => setFormData(prev => ({ 
                          ...prev, 
                          deadline_type: val,
                          rush_delivery: val === 'rush'
                        }))}
                        className="space-y-2"
                      >
                        <div 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                            formData.deadline_type === 'standard' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, deadline_type: 'standard', rush_delivery: false }))}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <div>
                              <label htmlFor="standard" className="font-medium text-sm cursor-pointer">
                                Tiêu chuẩn
                              </label>
                              <p className="text-xs text-muted-foreground">{service.delivery_days} ngày làm việc</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">Miễn phí</span>
                        </div>
                        
                        <div 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                            formData.deadline_type === 'rush' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, deadline_type: 'rush', rush_delivery: true }))}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="rush" id="rush" />
                            <div>
                              <label htmlFor="rush" className="font-medium text-sm cursor-pointer flex items-center gap-1">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Giao gấp
                              </label>
                              <p className="text-xs text-muted-foreground">{Math.ceil(service.delivery_days / 2)} ngày làm việc</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-amber-600">+{formatPrice(rushDeliveryFee)}</span>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="font-medium flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4" />
                        Thời gian giao hàng
                      </Label>
                      <p className="text-sm">{service.delivery_days} ngày làm việc</p>
                    </CardContent>
                  </Card>
                )}

                {/* Extra Revisions - Only show if shop supports */}
                {extraRevisionsAvailable && (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="font-medium flex items-center gap-2 mb-3">
                        <RefreshCw className="h-4 w-4" />
                        Mua thêm lượt chỉnh sửa
                      </Label>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">Bao gồm: {service.revision_count} lượt miễn phí</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(extraRevisionPrice)}/lượt thêm</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, extra_revisions: Math.max(0, prev.extra_revisions - 1) }))}
                            disabled={formData.extra_revisions === 0}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{formData.extra_revisions}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, extra_revisions: prev.extra_revisions + 1 }))}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      {formData.extra_revisions > 0 && (
                        <p className="text-sm text-primary mt-2">
                          +{formData.extra_revisions} lượt = {formatPrice(formData.extra_revisions * extraRevisionPrice)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* NDA Option */}
                {sellerNdaSettings?.requires_nda !== undefined && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          id="nda"
                          checked={formData.requires_nda}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_nda: !!checked }))}
                        />
                        <div className="flex-1">
                          <label htmlFor="nda" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            Yêu cầu NDA (Bảo mật)
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Designer cam kết không sử dụng thiết kế vào portfolio và bảo mật thông tin
                          </p>
                          <p className="text-sm text-primary mt-1">+{formatPrice(sellerNdaSettings?.nda_fee || 100000)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Price Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Tóm tắt giá</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>
                          {selectedLicense ? `Giá ${selectedLicense.name}` : 'Giá dịch vụ'}
                        </span>
                        <span>{formatPrice(basePrice)}</span>
                      </div>
                      {formData.extra_revisions > 0 && (
                        <div className="flex justify-between">
                          <span>+{formData.extra_revisions} lượt chỉnh sửa</span>
                          <span>+{formatPrice(revisionCost)}</span>
                        </div>
                      )}
                      {formData.rush_delivery && (
                        <div className="flex justify-between text-amber-600">
                          <span>Phụ phí giao gấp</span>
                          <span>+{formatPrice(rushCost)}</span>
                        </div>
                      )}
                      {formData.requires_nda && (
                        <div className="flex justify-between text-green-600">
                          <span>Phí NDA</span>
                          <span>+{formatPrice(ndaFee)}</span>
                        </div>
                      )}
                      {formData.voucher_discount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            Mã giảm giá
                          </span>
                          <span>-{formatPrice(formData.voucher_discount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{formatPrice(finalPrice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Xác nhận đơn hàng</h3>

                {/* Order Summary */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium">Thông tin đơn hàng</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Dịch vụ:</div>
                      <div className="font-medium">{service.name}</div>
                      
                      <div className="text-muted-foreground">Designer:</div>
                      <div className="font-medium">{(service as any).seller?.shop_name}</div>
                      
                      <div className="text-muted-foreground">Deadline:</div>
                      <div className="font-medium">
                        {formData.rush_delivery 
                          ? `${Math.ceil(service.delivery_days / 2)} ngày (Gấp)`
                          : `${service.delivery_days} ngày`
                        }
                      </div>
                      
                      <div className="text-muted-foreground">Lượt chỉnh sửa:</div>
                      <div className="font-medium">{service.revision_count + formData.extra_revisions} lượt</div>
                      
                      {selectedLicense && (
                        <>
                          <div className="text-muted-foreground">Bản quyền:</div>
                          <div className="font-medium">{selectedLicense.name}</div>
                        </>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Price Breakdown */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giá dịch vụ:</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {formData.voucher_discount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            Mã giảm giá ({formData.voucher_code}):
                          </span>
                          <span>-{formatPrice(formData.voucher_discount)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Tổng thanh toán:</span>
                      <span className="text-primary text-lg">{formatPrice(finalPrice)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Terms Confirmation */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium">Xác nhận điều khoản</h4>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="scope"
                        checked={formData.agreed_scope}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreed_scope: !!checked }))}
                      />
                      <label htmlFor="scope" className="text-sm cursor-pointer">
                        Tôi đã hiểu <strong>phạm vi công việc</strong> bao gồm trong dịch vụ này
                      </label>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="revisions"
                        checked={formData.agreed_revisions}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreed_revisions: !!checked }))}
                      />
                      <label htmlFor="revisions" className="text-sm cursor-pointer">
                        Tôi đồng ý với <strong>số lần chỉnh sửa</strong> ({service.revision_count + formData.extra_revisions} lượt)
                      </label>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="refund"
                        checked={formData.agreed_refund}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreed_refund: !!checked }))}
                      />
                      <label htmlFor="refund" className="text-sm cursor-pointer">
                        Tôi đã đọc và đồng ý <strong>chính sách hoàn tiền</strong> của nền tảng
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Flow Preview */}
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-blue-600" />
                      Các bước tiếp theo sau khi đặt đơn
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</div>
                        <span>Designer xác nhận đơn hàng (trong 24h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</div>
                        <span>Designer bắt đầu thiết kế</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</div>
                        <span>Bạn nhận bản nháp và phản hồi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</div>
                        <span>Nhận file hoàn thiện và xác nhận hoàn tất</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Voucher Input */}
                <Card>
                  <CardContent className="p-4">
                    <Label className="font-medium flex items-center gap-2 mb-3">
                      <Ticket className="h-4 w-4" />
                      Mã giảm giá
                    </Label>
                    
                    {appliedVoucher ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700 dark:text-green-400">{appliedVoucher.code}</span>
                          <span className="text-green-600">-{formatPrice(appliedVoucher.discount)}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleRemoveVoucher}
                          className="h-7 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nhập mã giảm giá"
                            value={voucherInput}
                            onChange={(e) => {
                              setVoucherInput(e.target.value.toUpperCase());
                              setVoucherError(null);
                            }}
                            className="flex-1"
                          />
                          <Button 
                            variant="secondary" 
                            onClick={handleApplyVoucher}
                            disabled={applyingVoucher || !voucherInput.trim()}
                          >
                            {applyingVoucher ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Áp dụng'
                            )}
                          </Button>
                        </div>
                        {voucherError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {voucherError}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Balance Info */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-sm">Số dư hiện tại:</span>
                  </div>
                  <span className={`font-bold ${insufficientBalance ? 'text-destructive' : 'text-green-600'}`}>
                    {formatPrice(userBalance)}
                  </span>
                </div>

                {insufficientBalance && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Số dư không đủ. Vui lòng nạp thêm {formatPrice(finalPrice - userBalance)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={currentStep === 1 ? () => onOpenChange(false) : handlePrevStep}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentStep === 1 ? 'Đóng' : 'Quay lại'}
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={handleNextStep}>
                  Tiếp tục
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || insufficientBalance || !formData.agreed_scope || !formData.agreed_revisions || !formData.agreed_refund}
                  className="min-w-[140px]"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Warning Dialog */}
      <Dialog open={showRiskWarning} onOpenChange={setShowRiskWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo đơn gấp
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bạn đang chọn giao hàng gấp. Điều này có nghĩa:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>Thời gian rút ngắn còn {Math.ceil(service.delivery_days / 2)} ngày</span>
              </li>
              <li className="flex items-start gap-2">
                <Wallet className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>Phụ phí thêm {formatPrice(rushDeliveryFee)}</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>Designer có thể từ chối nếu không đủ thời gian</span>
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setFormData(prev => ({ ...prev, deadline_type: 'standard', rush_delivery: false }));
              setShowRiskWarning(false);
            }}>
              Chọn tiêu chuẩn
            </Button>
            <Button className="flex-1" onClick={() => {
              setShowRiskWarning(false);
              setCurrentStep(3);
            }}>
              Tiếp tục giao gấp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
