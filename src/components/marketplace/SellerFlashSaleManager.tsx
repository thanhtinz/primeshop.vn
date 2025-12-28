import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Zap, Plus, Trash2, Clock, Percent } from 'lucide-react';
import { useSellerFlashSales, useCreateSellerFlashSale, useDeleteSellerFlashSale, useUpdateSellerFlashSale } from '@/hooks/useSellerFlashSale';
import { useMySellerProducts } from '@/hooks/useMarketplace';
import { Seller } from '@/hooks/useMarketplace';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useCurrency } from '@/contexts/CurrencyContext';

interface SellerFlashSaleManagerProps {
  seller: Seller;
}

export const SellerFlashSaleManager = ({ seller }: SellerFlashSaleManagerProps) => {
  const { formatDateTime } = useDateFormat();
  const { formatPrice } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percent: 20,
    start_time: '',
    end_time: '',
    product_ids: [] as string[],
  });

  const { data: flashSales, isLoading } = useSellerFlashSales(seller.id);
  const { data: products } = useMySellerProducts();
  const createFlashSale = useCreateSellerFlashSale();
  const deleteFlashSale = useDeleteSellerFlashSale();
  const updateFlashSale = useUpdateSellerFlashSale();

  const availableProducts = products?.filter(p => p.status === 'available') || [];

  const handleCreate = () => {
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.product_ids.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }

    createFlashSale.mutate({
      seller_id: seller.id,
      name: formData.name,
      description: formData.description,
      discount_percent: formData.discount_percent,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      product_ids: formData.product_ids,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          name: '',
          description: '',
          discount_percent: 20,
          start_time: '',
          end_time: '',
          product_ids: [],
        });
      },
    });
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  const isActive = (sale: { start_time: string; end_time: string; is_active: boolean }) => {
    const now = new Date();
    return sale.is_active && 
           new Date(sale.start_time) <= now && 
           new Date(sale.end_time) >= now;
  };

  if (isLoading) {
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
          <h3 className="text-lg font-semibold">Flash Sale</h3>
          <p className="text-sm text-muted-foreground">
            Tạo chương trình giảm giá theo thời gian
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo Flash Sale mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên Flash Sale</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Flash Sale cuối tuần"
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chương trình"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Giảm giá (%)</Label>
                <Input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
                  min={1}
                  max={90}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chọn sản phẩm ({formData.product_ids.length} đã chọn)</Label>
                <ScrollArea className="h-40 border rounded-md p-2">
                  <div className="space-y-2">
                    {availableProducts.map(product => (
                      <div key={product.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.product_ids.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <span className="text-sm truncate flex-1">{product.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createFlashSale.isPending}
              >
                {createFlashSale.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Tạo Flash Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flash sales list */}
      {flashSales?.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có Flash Sale nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flashSales?.map(sale => (
            <Card key={sale.id} className={isActive(sale) ? 'border-yellow-500/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className={`h-4 w-4 ${isActive(sale) ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      <h4 className="font-semibold">{sale.name}</h4>
                      {isActive(sale) ? (
                        <Badge className="bg-yellow-500">Đang diễn ra</Badge>
                      ) : new Date(sale.start_time) > new Date() ? (
                        <Badge variant="secondary">Sắp diễn ra</Badge>
                      ) : (
                        <Badge variant="outline">Đã kết thúc</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Giảm {sale.discount_percent}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(sale.start_time, 'dd/MM HH:mm')} - 
                        {formatDateTime(sale.end_time, 'dd/MM HH:mm')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {sale.items?.slice(0, 3).map(item => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.product?.title}
                        </Badge>
                      ))}
                      {(sale.items?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(sale.items?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        updateFlashSale.mutate({
                          id: sale.id,
                          data: { is_active: !sale.is_active },
                        });
                      }}
                    >
                      {sale.is_active ? 'Tắt' : 'Bật'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa Flash Sale này?')) {
                          deleteFlashSale.mutate(sale.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerFlashSaleManager;
