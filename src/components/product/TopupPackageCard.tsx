import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TopupPackageCardProps {
  package_: {
    id: string;
    name: string;
    price: number;
    original_price?: number | null;
    description?: string | null;
    image_url?: string | null;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function TopupPackageCard({ package_, isSelected, onSelect }: TopupPackageCardProps) {
  const { formatPrice } = useCurrency();

  const discount = package_.original_price && package_.price 
    ? Math.round((1 - package_.price / package_.original_price) * 100) 
    : 0;

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-xl border-2 p-3 transition-all text-left ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border hover:border-primary/50 bg-card'
      }`}
    >
      {discount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 text-[10px] px-1.5"
        >
          -{discount}%
        </Badge>
      )}
      
      <div className="flex flex-col items-center">
        {package_.image_url ? (
          <img 
            src={package_.image_url} 
            alt={package_.name}
            className="w-12 h-12 object-contain mb-2"
          />
        ) : (
          <CreditCard className="w-12 h-12 text-muted-foreground mb-2" strokeWidth={1.5} />
        )}
        <h4 className="font-semibold text-sm text-center line-clamp-2">{package_.name}</h4>
        <p className="text-primary font-bold mt-1">{formatPrice(package_.price)}</p>
        {package_.original_price && discount > 0 && (
          <p className="text-xs text-muted-foreground line-through">
            {formatPrice(package_.original_price)}
          </p>
        )}
      </div>
    </button>
  );
}
