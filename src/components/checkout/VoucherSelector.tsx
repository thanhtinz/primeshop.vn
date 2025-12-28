import { useState, useMemo } from 'react';
import { Ticket, Check, Loader2, ChevronDown, ChevronUp, Percent, Tag, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useVouchers, DbVoucher } from '@/hooks/useVouchers';
import { useUserVouchers } from '@/hooks/useUserVouchers';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';

const EXPIRING_SOON_DAYS = 3; // Voucher expiring within 3 days

const isExpiringSoon = (expiresAt: string | null | undefined): boolean => {
  if (!expiresAt) return false;
  const daysLeft = differenceInDays(new Date(expiresAt), new Date());
  return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
};

const getDaysLeft = (expiresAt: string): number => {
  return differenceInDays(new Date(expiresAt), new Date());
};

interface VoucherSelectorProps {
  orderAmount: number;
  appliedVoucher: DbVoucher | null;
  onApplyVoucher: (voucher: DbVoucher) => void;
  onRemoveVoucher: () => void;
}

export const VoucherSelector = ({
  orderAmount,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
}: VoucherSelectorProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  
  const [voucherCode, setVoucherCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);
  
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
  
  const handleApplyCode = async () => {
    if (!voucherCode.trim()) {
      toast.error(t('pleaseEnterVoucher'));
      return;
    }

    setIsApplying(true);
    try {
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !voucher) {
        toast.error(t('voucherNotFound'));
        return;
      }

      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast.error(t('voucherExpired'));
        return;
      }

      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        toast.error(t('voucherUsedUp'));
        return;
      }

      if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
        toast.error(`${t('minOrderValue')} ${formatPrice(voucher.min_order_value)}`);
        return;
      }

      onApplyVoucher(voucher as DbVoucher);
      setVoucherCode('');
      toast.success(t('voucherApplySuccess'));
    } catch (err) {
      toast.error(t('error'));
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleSelectVoucher = (voucher: DbVoucher) => {
    if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
      toast.error(`${t('minOrderValue')} ${formatPrice(voucher.min_order_value)}`);
      return;
    }
    onApplyVoucher(voucher);
    setShowVoucherList(false);
    setSearchQuery('');
    toast.success(t('voucherApplySuccess'));
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
      return `${voucher.discount_value}%${voucher.max_discount ? ` (tối đa ${formatPrice(voucher.max_discount)})` : ''}`;
    }
    return formatPrice(voucher.discount_value);
  };
  
  const canUseVoucher = (voucher: DbVoucher) => {
    return !voucher.min_order_value || orderAmount >= voucher.min_order_value;
  };

  const hasAvailableVouchers = validSystemVouchers.length > 0 || validUserVouchers.length > 0;
  const hasFilteredVouchers = filteredSystemVouchers.length > 0 || filteredUserVouchers.length > 0;

  return (
    <div className="space-y-3">
      {/* Input section */}
      <div className="flex gap-2">
        <Input
          placeholder={t('enterVoucherCode')}
          value={appliedVoucher ? appliedVoucher.code : voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          disabled={!!appliedVoucher}
          className="h-11"
        />
        {appliedVoucher ? (
          <Button
            variant="outline"
            onClick={onRemoveVoucher}
            className="h-11 shrink-0"
          >
            {t('cancel')}
          </Button>
        ) : (
          <Button onClick={handleApplyCode} disabled={isApplying} className="h-11 shrink-0">
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : t('apply')}
          </Button>
        )}
      </div>
      
      {/* Applied voucher display with discount amount */}
      {appliedVoucher && (
        <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Check className="h-5 w-5 shrink-0" />
            <span className="font-medium">
              {t('appliedVoucher')}: <strong>{appliedVoucher.code}</strong>
            </span>
          </div>
          <div className="flex items-center justify-between bg-background/80 rounded-md p-3">
            <span className="text-sm text-muted-foreground">Số tiền được giảm:</span>
            <span className="text-lg font-bold text-primary">
              -{formatPrice(calculateDiscount(appliedVoucher))}
            </span>
          </div>
        </div>
      )}
      
      {/* Available vouchers toggle */}
      {!appliedVoucher && hasAvailableVouchers && (
        <button
          type="button"
          onClick={() => setShowVoucherList(!showVoucherList)}
          className="flex items-center gap-2 text-sm text-primary hover:underline w-full justify-between py-2"
        >
          <span className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            {t('availableVouchers')} ({validSystemVouchers.length + validUserVouchers.length})
          </span>
          {showVoucherList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
      
      {/* Voucher list */}
      {showVoucherList && !appliedVoucher && (
        <div className="space-y-2 rounded-lg border border-border">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã voucher hoặc giá trị giảm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 pt-0">
            {/* User's personal vouchers */}
            {filteredUserVouchers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-2">{t('yourVouchers')}</p>
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
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        canUse 
                          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer' 
                          : 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                              {voucher.discount_type === 'percentage' ? <Percent className="h-3 w-3 mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                              {formatVoucherValue(voucher)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">Cá nhân</Badge>
                            {isExpiringSoon(uv.expires_at || voucher.expires_at) && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                <Clock className="h-3 w-3 mr-1" />
                                Còn {getDaysLeft(uv.expires_at || voucher.expires_at!)} ngày
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{voucher.code}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {voucher.min_order_value && (
                              <span>Đơn tối thiểu: {formatPrice(voucher.min_order_value)}</span>
                            )}
                            {uv.expires_at && (
                              <span className={isExpiringSoon(uv.expires_at) ? 'text-destructive font-medium' : ''}>
                                HSD: {formatDate(uv.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        {canUse && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary whitespace-nowrap">
                              -{formatPrice(discountAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">sẽ được giảm</div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* System vouchers */}
            {filteredSystemVouchers.length > 0 && (
              <div className="space-y-2">
                {filteredUserVouchers.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground px-2 pt-2 border-t border-border">{t('systemVouchers')}</p>
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
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        canUse 
                          ? 'border-border hover:border-primary/50 hover:bg-secondary/50 cursor-pointer' 
                          : 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {voucher.discount_type === 'percentage' ? <Percent className="h-3 w-3 mr-1" /> : <Tag className="h-3 w-3 mr-1" />}
                              {formatVoucherValue(voucher)}
                            </Badge>
                            {isExpiringSoon(voucher.expires_at) && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                <Clock className="h-3 w-3 mr-1" />
                                Còn {getDaysLeft(voucher.expires_at!)} ngày
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm truncate">{voucher.code}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {voucher.min_order_value && (
                              <span>Đơn tối thiểu: {formatPrice(voucher.min_order_value)}</span>
                            )}
                            {voucher.expires_at && (
                              <span className={isExpiringSoon(voucher.expires_at) ? 'text-destructive font-medium' : ''}>
                                HSD: {formatDate(voucher.expires_at)}
                              </span>
                            )}
                            {voucher.usage_limit && (
                              <span>Còn {voucher.usage_limit - voucher.used_count} lượt</span>
                            )}
                          </div>
                        </div>
                        {canUse && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary whitespace-nowrap">
                              -{formatPrice(discountAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">sẽ được giảm</div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {!hasFilteredVouchers && searchQuery && (
              <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy voucher phù hợp</p>
            )}
            
            {!hasAvailableVouchers && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noVouchersAvailable')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
