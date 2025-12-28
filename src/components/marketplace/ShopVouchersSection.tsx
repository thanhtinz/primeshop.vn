import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Ticket, Copy, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ShopVouchersSectionProps {
  sellerId: string;
}

interface SellerVoucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_to: string;
}

export function ShopVouchersSection({ sellerId }: ShopVouchersSectionProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { formatPrice } = useCurrency();

  const { data: vouchers = [] } = useQuery({
    queryKey: ['public-seller-vouchers', sellerId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('seller_vouchers')
        .select('id, code, type, value, min_order_amount, max_uses, used_count, valid_from, valid_to')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_to', now)
        .order('value', { ascending: false });
      
      if (error) throw error;
      
      // Filter out fully used vouchers
      return (data as SellerVoucher[]).filter(v => 
        !v.max_uses || v.used_count < v.max_uses
      );
    },
    enabled: !!sellerId
  });

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Đã sao chép mã giảm giá!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  if (vouchers.length === 0) return null;

  const displayVouchers = showAll ? vouchers : vouchers.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">Mã giảm giá của Shop</h2>
        </div>
        {vouchers.length > 3 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAll(!showAll)}
            className="text-xs"
          >
            {showAll ? 'Ẩn bớt' : `Xem tất cả (${vouchers.length})`}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAll ? 'rotate-90' : ''}`} />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {displayVouchers.map(voucher => {
          const isCopied = copiedCode === voucher.code;
          const remaining = voucher.max_uses ? voucher.max_uses - voucher.used_count : null;
          
          return (
            <div 
              key={voucher.id}
              className="flex items-stretch border border-green-500/30 rounded-lg overflow-hidden bg-gradient-to-r from-green-500/5 to-emerald-500/5"
            >
              {/* Left side - discount info */}
              <div className="px-3 py-2 border-r border-dashed border-green-500/30">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {voucher.type === 'percentage' ? `${voucher.value}%` : formatPrice(voucher.value)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">GIẢM</p>
                </div>
              </div>
              
              {/* Right side - code and action */}
              <div className="px-3 py-2 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-semibold">{voucher.code}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(voucher.code)}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {voucher.min_order_amount > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      Đơn tối thiểu {formatPrice(voucher.min_order_amount)}
                    </span>
                  )}
                  {remaining !== null && remaining <= 10 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Còn {remaining}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}