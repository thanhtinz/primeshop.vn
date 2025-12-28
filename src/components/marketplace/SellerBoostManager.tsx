import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Rocket, TrendingUp, Star, Pin, Clock, X } from 'lucide-react';
import { useBoostPricing, useMyProductBoosts, useCreateBoost, useCancelBoost, ProductBoost } from '@/hooks/useProductBoosts';
import { useMySellerProducts } from '@/hooks/useMarketplace';
import { Seller } from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SellerBoostManagerProps {
  seller: Seller;
}

const boostTypeIcons: Record<string, React.ReactNode> = {
  marketplace_top: <Rocket className="h-4 w-4" />,
  category_top: <TrendingUp className="h-4 w-4" />,
  recommended: <Star className="h-4 w-4" />,
  shop_featured: <Pin className="h-4 w-4" />,
};

const boostTypeLabels: Record<string, string> = {
  marketplace_top: 'Top Marketplace',
  category_top: 'Top Danh mục',
  recommended: 'Đề xuất',
  shop_featured: 'Nổi bật Shop',
};

export const SellerBoostManager = ({ seller }: SellerBoostManagerProps) => {
  const { profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBoostType, setSelectedBoostType] = useState('');
  const [days, setDays] = useState(7);

  const { data: pricing, isLoading: pricingLoading } = useBoostPricing();
  const { data: myBoosts, isLoading: boostsLoading } = useMyProductBoosts();
  const { data: products } = useMySellerProducts();
  const createBoost = useCreateBoost();
  const cancelBoost = useCancelBoost();

  const availableProducts = products?.filter(p => p.status === 'available') || [];
  const activeBoosts = myBoosts?.filter(b => b.status === 'active') || [];

  const selectedPricing = pricing?.find(p => p.boost_type === selectedBoostType);
  const totalCost = selectedPricing ? selectedPricing.price_per_day * days : 0;
  const userBalance = profile?.balance || 0;

  const handleCreateBoost = () => {
    if (!selectedProduct || !selectedBoostType) {
      toast.error('Vui lòng chọn sản phẩm và loại boost');
      return;
    }

    if (userBalance < totalCost) {
      toast.error('Số dư không đủ');
      return;
    }

    createBoost.mutate(
      { productId: selectedProduct, boostType: selectedBoostType, days },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedProduct('');
          setSelectedBoostType('');
          setDays(7);
        },
      }
    );
  };

  if (pricingLoading || boostsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Thuê ghim sản phẩm</h3>
          <p className="text-sm text-muted-foreground">
            Đẩy sản phẩm lên top để tăng khả năng hiển thị
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Rocket className="h-4 w-4 mr-2" />
              Thuê Boost mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thuê Boost sản phẩm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Chọn sản phẩm</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Loại Boost</Label>
                <div className="grid grid-cols-2 gap-2">
                  {pricing?.map(p => (
                    <Button
                      key={p.boost_type}
                      type="button"
                      variant={selectedBoostType === p.boost_type ? 'default' : 'outline'}
                      className="justify-start h-auto py-3"
                      onClick={() => setSelectedBoostType(p.boost_type)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          {boostTypeIcons[p.boost_type]}
                          <span className="text-sm">{boostTypeLabels[p.boost_type]}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {p.price_per_day.toLocaleString('vi-VN')}đ/ngày
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Số ngày</Label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map(d => (
                    <Button
                      key={d}
                      type="button"
                      variant={days === d ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDays(d)}
                    >
                      {d} ngày
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className="mt-2"
                />
              </div>

              {selectedBoostType && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tổng chi phí:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                      <span>Số dư tài khoản:</span>
                      <span className="font-medium text-foreground">{formatPrice(userBalance)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full"
                onClick={handleCreateBoost}
                disabled={!selectedProduct || !selectedBoostType || createBoost.isPending || userBalance < totalCost}
              >
                {createBoost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Xác nhận thuê Boost
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pricing overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pricing?.map(p => (
          <Card key={p.boost_type} className="bg-muted/30">
            <CardContent className="p-3 text-center">
              <div className="flex justify-center mb-2">
                {boostTypeIcons[p.boost_type]}
              </div>
              <p className="text-xs font-medium">{boostTypeLabels[p.boost_type]}</p>
              <p className="text-sm font-bold text-primary">
                {p.price_per_day.toLocaleString('vi-VN')}đ/ngày
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active boosts */}
      <div>
        <h4 className="font-medium mb-3">Đang hoạt động ({activeBoosts.length})</h4>
        {activeBoosts.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center text-muted-foreground">
              Chưa có boost nào đang hoạt động
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeBoosts.map((boost) => (
              <Card key={boost.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {boostTypeIcons[boost.boost_type]}
                      <div>
                        <p className="font-medium">{boost.product?.title || 'Sản phẩm'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {boostTypeLabels[boost.boost_type]}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hết hạn: {format(new Date(boost.end_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn hủy boost này?')) {
                          cancelBoost.mutate(boost.id);
                        }
                      }}
                      disabled={cancelBoost.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {myBoosts && myBoosts.length > activeBoosts.length && (
        <div>
          <h4 className="font-medium mb-3">Lịch sử Boost</h4>
          <div className="space-y-2">
            {myBoosts
              .filter(b => b.status !== 'active')
              .slice(0, 5)
              .map((boost) => (
                <Card key={boost.id} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {boostTypeIcons[boost.boost_type]}
                        <span className="text-sm">{boost.product?.title || 'Sản phẩm'}</span>
                      </div>
                      <Badge variant={boost.status === 'expired' ? 'secondary' : 'destructive'}>
                        {boost.status === 'expired' ? 'Hết hạn' : 'Đã hủy'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerBoostManager;
