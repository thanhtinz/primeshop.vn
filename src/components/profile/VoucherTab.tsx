import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Copy, Check, Clock, Gift, AlertCircle } from 'lucide-react';
import { useVouchers, DbVoucher } from '@/hooks/useVouchers';
import { useUserVouchers } from '@/hooks/useUserVouchers';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const VoucherTab = () => {
  const { data: systemVouchers, isLoading: systemLoading } = useVouchers(true);
  const { data: userVouchers, isLoading: userLoading } = useUserVouchers();
  const { formatPrice } = useCurrency();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã voucher');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountText = (voucher: DbVoucher) => {
    if (voucher.discount_type === 'percentage') {
      const text = `Giảm ${voucher.discount_value}%`;
      if (voucher.max_discount) {
        return `${text} (tối đa ${formatPrice(voucher.max_discount)})`;
      }
      return text;
    }
    return `Giảm ${formatPrice(voucher.discount_value)}`;
  };

  const isVoucherValid = (voucher: DbVoucher) => {
    if (!voucher.is_active) return false;
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) return false;
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return false;
    return true;
  };

  const isLoading = systemLoading || userLoading;

  // Filter public vouchers (system-wide)
  const publicVouchers = systemVouchers?.filter(v => isVoucherValid(v)) || [];

  // User's personal vouchers
  const personalVouchers = userVouchers?.filter(uv => {
    if (uv.is_used) return false;
    if (uv.expires_at && new Date(uv.expires_at) < new Date()) return false;
    return uv.voucher?.is_active;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Personal Vouchers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Voucher của tôi
          </CardTitle>
          <CardDescription>Voucher được tặng riêng cho bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {personalVouchers.length > 0 ? (
            <div className="space-y-3">
              {personalVouchers.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-lg">{item.voucher?.code}</span>
                        <Badge variant="secondary" className="text-xs">Riêng tư</Badge>
                      </div>
                      <p className="text-sm text-primary font-medium">
                        {item.voucher && getDiscountText(item.voucher)}
                      </p>
                      {item.voucher?.min_order_value && (
                        <p className="text-xs text-muted-foreground">
                          Đơn tối thiểu: {formatPrice(item.voucher.min_order_value)}
                        </p>
                      )}
                      {item.expires_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          HSD: {format(new Date(item.expires_at), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(item.voucher?.code || '')}
                    className="shrink-0"
                  >
                    {copiedCode === item.voucher?.code ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Sao chép
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Chưa có voucher riêng</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Vouchers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-foreground" />
            Voucher hệ thống
          </CardTitle>
          <CardDescription>Voucher công khai có thể sử dụng</CardDescription>
        </CardHeader>
        <CardContent>
          {publicVouchers.length > 0 ? (
            <div className="space-y-3">
              {publicVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Ticket className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono font-bold text-lg">{voucher.code}</span>
                      <p className="text-sm text-primary font-medium">
                        {getDiscountText(voucher)}
                      </p>
                      {voucher.min_order_value && (
                        <p className="text-xs text-muted-foreground">
                          Đơn tối thiểu: {formatPrice(voucher.min_order_value)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {voucher.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            HSD: {format(new Date(voucher.expires_at), 'dd/MM/yyyy')}
                          </span>
                        )}
                        {voucher.usage_limit && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Còn {voucher.usage_limit - voucher.used_count} lượt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(voucher.code)}
                    className="shrink-0"
                  >
                    {copiedCode === voucher.code ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Sao chép
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Ticket className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Chưa có voucher hệ thống</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherTab;
