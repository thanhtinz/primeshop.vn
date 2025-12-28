import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, RefreshCw, ShoppingCart } from 'lucide-react';
import { usePurchaseRevisionPackage } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface RevisionLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  revisionPrice: number;
  onPurchaseSuccess?: () => void;
}

export function RevisionLimitDialog({ 
  open, 
  onOpenChange, 
  orderId, 
  revisionPrice,
  onPurchaseSuccess 
}: RevisionLimitDialogProps) {
  const { formatPrice } = useCurrency();
  const purchasePackage = usePurchaseRevisionPackage();
  const [quantity, setQuantity] = useState(1);

  const handlePurchase = async () => {
    try {
      await purchasePackage.mutateAsync({
        orderId,
        quantity,
        pricePerRevision: revisionPrice,
      });
      toast.success(`Đã mua ${quantity} lượt chỉnh sửa! Bạn có thể yêu cầu chỉnh sửa ngay.`);
      onOpenChange(false);
      setQuantity(1);
      onPurchaseSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể mua gói chỉnh sửa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Hết lượt chỉnh sửa</DialogTitle>
              <DialogDescription className="mt-1">
                Bạn đã sử dụng hết lượt chỉnh sửa miễn phí
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Mua thêm lượt chỉnh sửa</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(revisionPrice)} / lượt
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Số lượng cần mua</Label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Tổng thanh toán:</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(quantity * revisionPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiền sẽ được trừ từ số dư ví của bạn
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Để sau
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={purchasePackage.isPending}
            className="w-full sm:w-auto gap-2"
          >
            {purchasePackage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            Mua ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}