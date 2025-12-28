import { useState } from 'react';
import { Plus, RefreshCw, Loader2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDesignRevisionPackages, usePurchaseRevisionPackage } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RevisionPackageCardProps {
  orderId: string;
  isBuyer: boolean;
  revisionPrice: number;
  baseRevisions: number;
  usedRevisions: number;
  sellerId: string;
}

export function RevisionPackageCard({ 
  orderId, 
  isBuyer, 
  revisionPrice, 
  baseRevisions, 
  usedRevisions,
  sellerId 
}: RevisionPackageCardProps) {
  const { formatPrice } = useCurrency();
  const { data: packages } = useDesignRevisionPackages(orderId);
  const purchasePackage = usePurchaseRevisionPackage();
  
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Calculate total extra revisions
  const totalExtraRevisions = packages?.reduce((sum, pkg) => sum + pkg.quantity, 0) || 0;
  const usedExtraRevisions = packages?.reduce((sum, pkg) => sum + (pkg.used_count || 0), 0) || 0;
  const remainingExtra = totalExtraRevisions - usedExtraRevisions;
  
  const totalRevisions = baseRevisions + totalExtraRevisions;
  const totalUsed = usedRevisions;
  const remaining = Math.max(0, baseRevisions - usedRevisions) + remainingExtra;

  const handlePurchase = async () => {
    try {
      await purchasePackage.mutateAsync({
        orderId,
        quantity,
        pricePerRevision: revisionPrice,
      });
      toast.success(`Đã mua ${quantity} lượt chỉnh sửa!`);
      setBuyDialogOpen(false);
      setQuantity(1);
    } catch (error: any) {
      toast.error(error?.message || 'Không thể mua gói chỉnh sửa');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Lượt chỉnh sửa
            </div>
            <Badge variant={remaining > 0 ? 'secondary' : 'destructive'}>
              Còn {remaining}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground text-xs">Gói cơ bản</p>
              <p className="font-semibold">{baseRevisions} lượt</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground text-xs">Đã mua thêm</p>
              <p className="font-semibold">{totalExtraRevisions} lượt</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Đã sử dụng</p>
              <p className="font-semibold">{totalUsed}/{totalRevisions}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{remaining}</span>
            </div>
          </div>

          {isBuyer && remaining === 0 && (
            <Button 
              className="w-full gap-2" 
              onClick={() => setBuyDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Mua thêm lượt chỉnh sửa
            </Button>
          )}

          {isBuyer && remaining > 0 && revisionPrice > 0 && (
            <Button 
              variant="outline"
              className="w-full gap-2" 
              onClick={() => setBuyDialogOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              Mua thêm ({formatPrice(revisionPrice)}/lượt)
            </Button>
          )}

          {/* Package History */}
          {packages && packages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Lịch sử mua:</p>
              {packages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                >
                  <span>{pkg.quantity} lượt</span>
                  <span className="text-muted-foreground">
                    Đã dùng: {pkg.used_count || 0}/{pkg.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mua thêm lượt chỉnh sửa</DialogTitle>
            <DialogDescription>
              Giá mỗi lượt chỉnh sửa: {formatPrice(revisionPrice)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số lượng</Label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                >
                  +
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span>Tổng tiền:</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(quantity * revisionPrice)}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchasePackage.isPending}
            >
              {purchasePackage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
