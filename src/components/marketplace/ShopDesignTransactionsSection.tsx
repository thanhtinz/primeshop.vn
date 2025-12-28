import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShopDesignTransactionsSectionProps {
  sellerId: string;
}

export function ShopDesignTransactionsSection({ sellerId }: ShopDesignTransactionsSectionProps) {
  const { formatPrice } = useCurrency();
  const { formatRelative } = useDateFormat();
  const { language } = useLanguage();
  
  // Fetch completed design orders for this seller
  const { data: transactions = [] } = useQuery({
    queryKey: ['seller-design-transactions', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          id,
          amount,
          completed_at,
          created_at,
          buyer_id
        `)
        .eq('seller_id', sellerId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Get buyer emails
      if (data && data.length > 0) {
        const buyerIds = [...new Set(data.map(d => d.buyer_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', buyerIds);
        
        const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
        
        return data.map(tx => ({
          ...tx,
          buyer_email: emailMap.get(tx.buyer_id) || null
        }));
      }
      
      return data || [];
    },
    enabled: !!sellerId,
  });
  
  if (transactions.length === 0) {
    return null;
  }
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-green-500" />
        Giao dịch tại Shop
      </h2>
      <div className="relative overflow-hidden bg-secondary/30 rounded-lg py-2">
        <div className="flex animate-marquee gap-4 whitespace-nowrap">
          {[...transactions, ...transactions].map((tx: any, idx) => {
            // Mask email: show first 3 chars + ***
            const emailPart = tx.buyer_email?.split('@')[0] || 'Khách';
            const maskedName = emailPart.length > 3 
              ? emailPart.slice(0, 3) + '***' 
              : emailPart + '***';
            const completedDate = tx.completed_at || tx.created_at;
            
            return (
              <div key={`${tx.id}-${idx}`} className="flex items-center gap-2 text-sm px-3 shrink-0">
                <span className="text-primary font-medium">{maskedName}</span>
                <span className="text-muted-foreground">
                  {language === 'vi' ? 'đã đặt thiết kế' : 'ordered design'}
                </span>
                <span className="text-amber-600 font-semibold">{formatPrice(tx.amount)}</span>
                <span className="text-muted-foreground text-xs">
                  • {formatRelative(completedDate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
