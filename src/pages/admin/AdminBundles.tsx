import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProductBundles, useCreateBundle, useUpdateBundle, useDeleteBundle, useAddBundleItem, useRemoveBundleItem } from '@/hooks/useProductBundles';
import { useProducts } from '@/hooks/useProducts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, Edit, Trash2, Loader2, Package, X, Search, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminBundles = () => {
  const { data: bundles, isLoading } = useProductBundles(false);
  const { data: products } = useProducts();
  const { formatPrice } = useCurrency();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();
  const addItem = useAddBundleItem();
  const removeItem = useRemoveBundleItem();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    discount_percent: 0,
    is_active: true
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [managingBundle, setManagingBundle] = useState<any>(null);

  const handleOpenDialog = (bundle?: any) => {
    if (bundle) {
      setEditingBundle(bundle);
      setFormData({
        name: bundle.name,
        name_en: bundle.name_en || '',
        description: bundle.description || '',
        discount_percent: bundle.discount_percent,
        is_active: bundle.is_active
      });
    } else {
      setEditingBundle(null);
      setFormData({
        name: '',
        name_en: '',
        description: '',
        discount_percent: 0,
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingBundle) {
      await updateBundle.mutateAsync({ id: editingBundle.id, ...formData });
    } else {
      await createBundle.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa combo này?')) {
      await deleteBundle.mutateAsync(id);
    }
  };

  const handleAddItem = async () => {
    if (!selectedProduct || !managingBundle) return;
    await addItem.mutateAsync({
      bundle_id: managingBundle.id,
      product_id: selectedProduct
    });
    setSelectedProduct('');
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem.mutateAsync(itemId);
  };

  const calculateBundlePrice = (bundle: any) => {
    const totalOriginal = bundle.items?.reduce((sum: number, item: any) => {
      const price = item.package?.price || item.product?.price || 0;
      return sum + Number(price) * item.quantity;
    }, 0) || 0;
    const discountedPrice = totalOriginal * (1 - bundle.discount_percent / 100);
    return { original: totalOriginal, discounted: discountedPrice };
  };

  const filteredBundles = bundles?.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Combo/Bundle
          </h1>
          <p className="text-sm text-muted-foreground">Quản lý các gói combo sản phẩm</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Thêm Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBundle ? 'Sửa Combo' : 'Thêm Combo mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên combo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Combo tiết kiệm"
                />
              </div>
              <div>
                <Label>Tên tiếng Anh</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="English name"
                />
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả combo"
                />
              </div>
              <div>
                <Label>Giảm giá (%)</Label>
                <Input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Kích hoạt</Label>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={!formData.name}>
                {createBundle.isPending || updateBundle.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingBundle ? 'Cập nhật' : 'Tạo Combo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm combo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Bundle Items Dialog */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sản phẩm trong "{managingBundle?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} disabled={!selectedProduct} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {managingBundle?.items?.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Chưa có sản phẩm nào</p>
              )}
              {managingBundle?.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.product?.image_url && (
                      <img src={item.product.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.package?.price || item.product?.price || 0)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bundles Grid */}
      <div className="grid gap-4">
        {filteredBundles && filteredBundles.length > 0 ? (
          filteredBundles.map(bundle => {
            const prices = calculateBundlePrice(bundle);
            return (
              <Card key={bundle.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{bundle.name}</h3>
                        <Badge variant={bundle.is_active ? 'default' : 'secondary'} className="text-xs">
                          {bundle.is_active ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          -{bundle.discount_percent}%
                        </Badge>
                      </div>
                      {bundle.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{bundle.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setManagingBundle(bundle);
                            setItemsDialogOpen(true);
                          }}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          {bundle.items?.length || 0} sản phẩm
                        </Button>
                        <div>
                          <span className="font-bold text-primary">{formatPrice(prices.discounted)}</span>
                          <span className="text-muted-foreground line-through ml-2 text-xs">{formatPrice(prices.original)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(bundle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(bundle.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có combo nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminBundles;
