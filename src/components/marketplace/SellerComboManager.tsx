import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Package, Plus, Trash2, Percent, Edit } from 'lucide-react';
import { useSellerCombos, useCreateCombo, useDeleteCombo, useUpdateCombo } from '@/hooks/useSellerCombos';
import { useMySellerProducts } from '@/hooks/useMarketplace';
import { Seller } from '@/hooks/useMarketplace';

interface SellerComboManagerProps {
  seller: Seller;
}

export const SellerComboManager = ({ seller }: SellerComboManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percent: 10,
    product_ids: [] as string[],
  });

  const { data: combos, isLoading } = useSellerCombos(seller.id);
  const { data: products } = useMySellerProducts();
  const createCombo = useCreateCombo();
  const deleteCombo = useDeleteCombo();
  const updateCombo = useUpdateCombo();

  const availableProducts = products?.filter(p => p.status === 'available') || [];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percent: 10,
      product_ids: [],
    });
    setEditingCombo(null);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên combo');
      return;
    }

    if (formData.product_ids.length < 2) {
      toast.error('Combo cần ít nhất 2 sản phẩm');
      return;
    }

    if (editingCombo) {
      updateCombo.mutate({
        id: editingCombo,
        data: {
          name: formData.name,
          description: formData.description,
          discount_percent: formData.discount_percent,
        },
        productIds: formData.product_ids,
      }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createCombo.mutate({
        seller_id: seller.id,
        name: formData.name,
        description: formData.description,
        discount_percent: formData.discount_percent,
        product_ids: formData.product_ids,
      }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId],
    }));
  };

  const openEdit = (combo: { id: string; name: string; description: string | null; discount_percent: number; items?: { product_id: string }[] }) => {
    setEditingCombo(combo.id);
    setFormData({
      name: combo.name,
      description: combo.description || '',
      discount_percent: combo.discount_percent,
      product_ids: combo.items?.map(i => i.product_id) || [],
    });
    setIsDialogOpen(true);
  };

  const calculateComboPrice = (productIds: string[]) => {
    const total = productIds.reduce((sum, id) => {
      const product = availableProducts.find(p => p.id === id);
      return sum + (product?.price || 0);
    }, 0);
    return total;
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
          <h3 className="text-lg font-semibold">Combo sản phẩm</h3>
          <p className="text-sm text-muted-foreground">
            Gộp nhiều sản phẩm thành combo với giá ưu đãi
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCombo ? 'Sửa Combo' : 'Tạo Combo mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên Combo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Combo tiết kiệm"
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả combo"
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
                  max={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Chọn sản phẩm ({formData.product_ids.length} đã chọn, cần tối thiểu 2)</Label>
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
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {formData.product_ids.length >= 2 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Tổng giá gốc:</span>
                      <span>{calculateComboPrice(formData.product_ids).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-green-500 font-medium">
                      <span>Giá combo ({formData.discount_percent}% off):</span>
                      <span>
                        {(calculateComboPrice(formData.product_ids) * (1 - formData.discount_percent / 100)).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={createCombo.isPending || updateCombo.isPending}
              >
                {(createCombo.isPending || updateCombo.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingCombo ? 'Cập nhật' : 'Tạo Combo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Combos list */}
      {combos?.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có Combo nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {combos?.map(combo => {
            const totalPrice = combo.items?.reduce((sum, item) => sum + (item.product?.price || 0), 0) || 0;
            const comboPrice = totalPrice * (1 - combo.discount_percent / 100);

            return (
              <Card key={combo.id} className={combo.is_active ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{combo.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          -{combo.discount_percent}%
                        </Badge>
                        {!combo.is_active && (
                          <Badge variant="secondary">Tắt</Badge>
                        )}
                      </div>

                      {combo.description && (
                        <p className="text-sm text-muted-foreground mb-2">{combo.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mb-2">
                        {combo.items?.map(item => (
                          <Badge key={item.id} variant="outline" className="text-xs">
                            {item.product?.title} - {item.product?.price.toLocaleString('vi-VN')}đ
                          </Badge>
                        ))}
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground line-through mr-2">
                          {totalPrice.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="font-bold text-green-500">
                          {comboPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(combo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          updateCombo.mutate({
                            id: combo.id,
                            data: { is_active: !combo.is_active },
                          });
                        }}
                      >
                        {combo.is_active ? 'Tắt' : 'Bật'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa Combo này?')) {
                            deleteCombo.mutate(combo.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerComboManager;
