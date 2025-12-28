import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist, useIsInWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
}

export const WishlistButton = ({ 
  productId, 
  className,
  size = 'icon',
  variant = 'ghost',
  showText = false
}: WishlistButtonProps) => {
  const { user } = useAuth();
  const isInWishlist = useIsInWishlist(productId);
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    if (isInWishlist) {
      removeFromWishlist.mutate(productId);
    } else {
      addToWishlist.mutate({ productId, notifyOnSale: true });
    }
  };

  const isLoading = addToWishlist.isPending || removeFromWishlist.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all',
        isInWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
    >
      <Heart 
        className={cn(
          'h-5 w-5 transition-all',
          isInWishlist && 'fill-current'
        )} 
      />
      {showText && (
        <span className="ml-2">
          {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </Button>
  );
};
