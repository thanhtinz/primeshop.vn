import { useState, useRef, useEffect, useMemo } from 'react';
import { Ticket, Percent, Tag, ChevronDown, Search, Check, Clock, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useVouchers, DbVoucher } from '@/hooks/useVouchers';
import { useUserVouchers } from '@/hooks/useUserVouchers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

const EXPIRING_SOON_DAYS = 3;

const isExpiringSoon = (expiresAt: string | null | undefined): boolean => {
  if (!expiresAt) return false;
  const daysLeft = differenceInDays(new Date(expiresAt), new Date());
  return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
};

const getDaysLeft = (expiresAt: string): number => {
  return differenceInDays(new Date(expiresAt), new Date());
};

interface VoucherInputProps {
  value: string;
  onChange: (value: string) => void;
  orderAmount: number;
  placeholder?: string;
  className?: string;
  showDiscountPreview?: boolean;
  onApplied?: (voucher: DbVoucher | null, discountAmount: number) => void;
}

export const VoucherInput = ({
  value,
  onChange,
  orderAmount,
  placeholder = 'Voucher',
  className = '',
  showDiscountPreview = true,
  onApplied,
}: VoucherInputProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<DbVoucher | null>(null);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch system vouchers (public)
  const { data: systemVouchers = [] } = useVouchers(true);
  
  // Fetch user-assigned vouchers
  const { data: userVouchers = [] } = useUserVouchers();
  
  // Filter valid vouchers
  const now = new Date();
  
  const validSystemVouchers = systemVouchers.filter(v => {
    if (v.expires_at && new Date(v.expires_at) < now) return false;
    if (v.usage_limit && v.used_count >= v.usage_limit) return false;
    return true;
  });
  
  const validUserVouchers = userVouchers.filter(uv => {
    if (uv.is_used) return false;
    if (uv.expires_at && new Date(uv.expires_at) < now) return false;
    if (uv.voucher?.expires_at && new Date(uv.voucher.expires_at) < now) return false;
    if (uv.voucher?.usage_limit && uv.voucher.used_count >= uv.voucher.usage_limit) return false;
    return uv.voucher?.is_active;
  });

  // Search/filter vouchers
  const filteredSystemVouchers = useMemo(() => {
    if (!searchQuery.trim()) return validSystemVouchers;
    const query = searchQuery.toLowerCase();
    return validSystemVouchers.filter(v => 
      v.code.toLowerCase().includes(query) ||
      v.discount_value.toString().includes(query) ||
      (v.discount_type === 'percentage' && `${v.discount_value}%`.includes(query))
    );
  }, [validSystemVouchers, searchQuery]);

  const filteredUserVouchers = useMemo(() => {
    if (!searchQuery.trim()) return validUserVouchers;
    const query = searchQuery.toLowerCase();
    return validUserVouchers.filter(uv => {
      const voucher = uv.voucher;
      if (!voucher) return false;
      return voucher.code.toLowerCase().includes(query) ||
        voucher.discount_value.toString().includes(query) ||
        (voucher.discount_type === 'percentage' && `${voucher.discount_value}%`.includes(query));
    });
  }, [validUserVouchers, searchQuery]);

  const hasAvailableVouchers = validSystemVouchers.length > 0 || validUserVouchers.length > 0;
  const hasFilteredVouchers = filteredSystemVouchers.length > 0 || filteredUserVouchers.length > 0;

  // Sync with external value
  useEffect(() => {
    if (value && !appliedVoucher) {
      // Check if external value is a valid voucher
      const upperValue = value.toUpperCase();
      const userVoucher = validUserVouchers.find(uv => uv.voucher?.code === upperValue);
      if (userVoucher?.voucher) {
        setAppliedVoucher(userVoucher.voucher);
        setInputValue('');
      } else {
        const systemVoucher = validSystemVouchers.find(v => v.code === upperValue);
        if (systemVoucher) {
          setAppliedVoucher(systemVoucher);
          setInputValue('');
        }
      }
    } else if (!value && appliedVoucher) {
      setAppliedVoucher(null);
      setInputValue('');
    }
  }, [value, validUserVouchers, validSystemVouchers]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateAndApplyVoucher = async (voucherCode: string) => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setIsValidating(true);
    const upperCode = voucherCode.toUpperCase();

    // Check user vouchers first
    const userVoucher = validUserVouchers.find(uv => uv.voucher?.code === upperCode);
    if (userVoucher?.voucher) {
      const voucher = userVoucher.voucher;
      if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
        toast.error(`Đơn tối thiểu: ${formatPrice(voucher.min_order_value)}`);
        setIsValidating(false);
        return;
      }
      const discount = calculateDiscount(voucher);
      setAppliedVoucher(voucher);
      setInputValue('');
      onChange(voucher.code);
      onApplied?.(voucher, discount);
      toast.success('Áp dụng mã thành công!');
      setIsValidating(false);
      return;
    }

    // Check system vouchers
    const systemVoucher = validSystemVouchers.find(v => v.code === upperCode);
    if (systemVoucher) {
      if (systemVoucher.min_order_value && orderAmount < systemVoucher.min_order_value) {
        toast.error(`Đơn tối thiểu: ${formatPrice(systemVoucher.min_order_value)}`);
        setIsValidating(false);
        return;
      }
      const discount = calculateDiscount(systemVoucher);
      setAppliedVoucher(systemVoucher);
      setInputValue('');
      onChange(systemVoucher.code);
      onApplied?.(systemVoucher, discount);
      toast.success('Áp dụng mã thành công!');
      setIsValidating(false);
      return;
    }

    // Check if this is a seller voucher and show specific error
    try {
      const { data: sellerVoucher } = await supabase
        .from('seller_vouchers')
        .select('*, sellers!inner(shop_name)')
        .eq('code', upperCode)
        .maybeSingle();

      if (sellerVoucher) {
        const shopName = (sellerVoucher.sellers as any)?.shop_name || 'shop';
        toast.error(`Mã voucher "${upperCode}" chỉ áp dụng cho các sản phẩm của shop "${shopName}"`);
        setIsValidating(false);
        return;
      }
    } catch (error) {
      // Ignore error, continue with generic message
    }

    toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    setIsValidating(false);
  };
  
  const handleSelectVoucher = (voucher: DbVoucher) => {
    if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
      toast.error(`Đơn tối thiểu: ${formatPrice(voucher.min_order_value)}`);
      return;
    }
    const discount = calculateDiscount(voucher);
    setAppliedVoucher(voucher);
    setInputValue('');
    onChange(voucher.code);
    onApplied?.(voucher, discount);
    setShowDropdown(false);
    setSearchQuery('');
    toast.success('Áp dụng mã thành công!');
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setInputValue('');
    onChange('');
    onApplied?.(null, 0);
  };
  
  const calculateDiscount = (voucher: DbVoucher) => {
    if (voucher.discount_type === 'percentage') {
      const discount = orderAmount * (voucher.discount_value / 100);
      return voucher.max_discount ? Math.min(discount, voucher.max_discount) : discount;
    }
    return voucher.discount_value;
  };
  
  const formatVoucherValue = (voucher: DbVoucher) => {
    if (voucher.discount_type === 'percentage') {
      return `${voucher.discount_value}%`;
    }
    return formatPrice(voucher.discount_value);
  };
  
  const canUseVoucher = (voucher: DbVoucher) => {
    return !voucher.min_order_value || orderAmount >= voucher.min_order_value;
  };

  // If voucher is applied, show applied state
  if (appliedVoucher) {
    const discountAmount = calculateDiscount(appliedVoucher);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <Check className="h-4 w-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-green-700">{appliedVoucher.code}</span>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                {formatVoucherValue(appliedVoucher)}
              </Badge>
            </div>
            <p className="text-sm text-green-600 mt-0.5">
              Giảm: <span className="font-bold">-{formatPrice(discountAmount)}</span>
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRemoveVoucher}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onFocus={() => hasAvailableVouchers && setShowDropdown(true)}
            onKeyDown={(e) => e.key === 'Enter' && validateAndApplyVoucher(inputValue)}
            className={className}
          />
          {hasAvailableVouchers && (
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <Button 
          type="button"
          onClick={() => validateAndApplyVoucher(inputValue)}
          disabled={isValidating || !inputValue.trim()}
          className="shrink-0"
        >
          {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
        </Button>
      </div>
      
      {showDropdown && hasAvailableVouchers && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc giá trị..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* User's personal vouchers */}
            {filteredUserVouchers.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-muted-foreground px-2 mb-1">{t('yourVouchers')}</p>
                {filteredUserVouchers.map((uv) => {
                  const voucher = uv.voucher!;
                  const canUse = canUseVoucher(voucher);
                  const discountAmount = calculateDiscount(voucher);
                  return (
                    <button
                      key={uv.id}
                      type="button"
                      onClick={() => canUse && handleSelectVoucher(voucher)}
                      disabled={!canUse}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        canUse 
                          ? 'hover:bg-primary/10 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs shrink-0">
                            {voucher.discount_type === 'percentage' ? <Percent className="h-3 w-3 mr-0.5" /> : <Tag className="h-3 w-3 mr-0.5" />}
                            {formatVoucherValue(voucher)}
                          </Badge>
                          {isExpiringSoon(uv.expires_at || voucher.expires_at) && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              <Clock className="h-3 w-3 mr-0.5" />
                              {getDaysLeft(uv.expires_at || voucher.expires_at!)}d
                            </Badge>
                          )}
                          <span className="text-sm font-medium truncate">{voucher.code}</span>
                        </div>
                        {canUse && (
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-primary">
                              -{formatPrice(discountAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                      {voucher.min_order_value && !canUse && (
                        <p className="text-xs text-destructive mt-0.5">
                          Tối thiểu: {formatPrice(voucher.min_order_value)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* System vouchers */}
            {filteredSystemVouchers.length > 0 && (
              <div className={`p-2 ${filteredUserVouchers.length > 0 ? 'border-t border-border' : ''}`}>
                {filteredUserVouchers.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground px-2 mb-1">{t('systemVouchers')}</p>
                )}
                {filteredSystemVouchers.map((voucher) => {
                  const canUse = canUseVoucher(voucher);
                  const discountAmount = calculateDiscount(voucher);
                  return (
                    <button
                      key={voucher.id}
                      type="button"
                      onClick={() => canUse && handleSelectVoucher(voucher)}
                      disabled={!canUse}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        canUse 
                          ? 'hover:bg-secondary cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {voucher.discount_type === 'percentage' ? <Percent className="h-3 w-3 mr-0.5" /> : <Tag className="h-3 w-3 mr-0.5" />}
                            {formatVoucherValue(voucher)}
                          </Badge>
                          {isExpiringSoon(voucher.expires_at) && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              <Clock className="h-3 w-3 mr-0.5" />
                              {getDaysLeft(voucher.expires_at!)}d
                            </Badge>
                          )}
                          <span className="text-sm font-medium truncate">{voucher.code}</span>
                        </div>
                        {canUse && (
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-primary">
                              -{formatPrice(discountAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                      {voucher.min_order_value && !canUse && (
                        <p className="text-xs text-destructive mt-0.5">
                          Tối thiểu: {formatPrice(voucher.min_order_value)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {!hasFilteredVouchers && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy voucher</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
