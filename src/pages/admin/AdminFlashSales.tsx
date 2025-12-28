import React, { useState } from 'react';
import { 
  useAllFlashSales, 
  useCreateFlashSale, 
  useUpdateFlashSale, 
  useDeleteFlashSale,
  useAdminFlashSaleItems,
  useAddFlashSaleItem,
  useUpdateFlashSaleItem,
  useDeleteFlashSaleItem,
  FlashSale,
  FlashSaleItem
} from '@/hooks/useFlashSales';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Zap, Package, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const AdminFlashSales = () => {
  const { data: flashSales, isLoading } = useAllFlashSales();
  const { data: products } = useProducts();
  const createMutation = useCreateFlashSale();
  const updateMutation = useUpdateFlashSale();
  const deleteMutation = useDeleteFlashSale();
  const { formatPrice } = useCurrency();
  
  const [saleDialog, setSaleDialog] = useState<{ open: boolean; sale: FlashSale | null }>({ open: false, sale: null });
  const [itemsDialog, setItemsDialog] = useState<{ open: boolean; saleId: string | null }>({ open: false, saleId: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; saleId: string | null }>({ open: false, saleId: null });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    banner_url: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      banner_url: '',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      is_active: false,
    });
    setSaleDialog({ open: true, sale: null });
  };

  const openEditDialog = (sale: FlashSale) => {
    setFormData({
      name: sale.name,
      description: sale.description || '',
      banner_url: sale.banner_url || '',
      start_date: new Date(sale.start_date).toISOString().slice(0, 16),
      end_date: new Date(sale.end_date).toISOString().slice(0, 16),
      is_active: sale.is_active,
    });
    setSaleDialog({ open: true, sale });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        banner_url: formData.banner_url || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active,
      };

      if (saleDialog.sale) {
        await updateMutation.mutateAsync({ id: saleDialog.sale.id, ...payload });
        toast.success('Cập nhật Flash Sale thành công');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Tạo Flash Sale thành công');
      }
      setSaleDialog({ open: false, sale: null });
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.saleId) return;
    try {
      await deleteMutation.mutateAsync(deleteDialog.saleId);
      toast.success('Đã xóa Flash Sale');
      setDeleteDialog({ open: false, saleId: null });
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getStatus = (sale: FlashSale) => {
    const now = Date.now();
    const start = new Date(sale.start_date).getTime();
    const end = new Date(sale.end_date).getTime();

    if (!sale.is_active) return { label: 'Tắt', variant: 'secondary' as const };
    if (now < start) return { label: 'Sắp diễn ra', variant: 'outline' as const };
    if (now > end) return { label: 'Đã kết thúc', variant: 'destructive' as const };
    return { label: 'Đang diễn ra', variant: 'default' as const };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Flash Sale
        </h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Flash Sale
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flashSales?.map((sale) => {
                      const status = getStatus(sale);
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.name}</p>
                              {sale.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">{sale.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>Bắt đầu: {formatDate(sale.start_date)}</p>
                              <p>Kết thúc: {formatDate(sale.end_date)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setItemsDialog({ open: true, saleId: sale.id })}
                                title="Quản lý sản phẩm"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(sale)}
                                title="Sửa"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteDialog({ open: true, saleId: sale.id })}
                                className="text-destructive hover:text-destructive"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {flashSales?.map((sale) => {
                  const status = getStatus(sale);
                  return (
                    <div key={sale.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{sale.name}</p>
                          {sale.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{sale.description}</p>
                          )}
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(sale.start_date)} - {formatDate(sale.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setItemsDialog({ open: true, saleId: sale.id })}>
                          <Package className="h-4 w-4 mr-2" />
                          Sản phẩm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(sale)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ open: true, saleId: sale.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {flashSales?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có Flash Sale nào
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={saleDialog.open} onOpenChange={(open) => setSaleDialog({ open, sale: open ? saleDialog.sale : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{saleDialog.sale ? 'Sửa Flash Sale' : 'Tạo Flash Sale'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tên Flash Sale *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Flash Sale cuối tuần"
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chương trình..."
                rows={2}
              />
            </div>

            <ImageUrlInput
              value={formData.banner_url}
              onChange={(url) => setFormData({ ...formData, banner_url: url })}
              label="Banner"
              folder="flash-sales"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bắt đầu *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Kết thúc *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Kích hoạt</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialog({ open: false, sale: null })}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {saleDialog.sale ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Items Dialog */}
      <FlashSaleItemsDialog 
        open={itemsDialog.open}
        saleId={itemsDialog.saleId}
        products={products || []}
        onClose={() => setItemsDialog({ open: false, saleId: null })}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, saleId: open ? deleteDialog.saleId : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa Flash Sale này? Tất cả sản phẩm trong chương trình cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Flash Sale Items Management Dialog
const FlashSaleItemsDialog = ({ 
  open, 
  saleId, 
  products,
  onClose 
}: { 
  open: boolean; 
  saleId: string | null; 
  products: any[];
  onClose: () => void;
}) => {
  const { data: items, isLoading } = useAdminFlashSaleItems(saleId || undefined);
  const addMutation = useAddFlashSaleItem();
  const updateMutation = useUpdateFlashSaleItem();
  const deleteMutation = useDeleteFlashSaleItem();
  const { formatPrice } = useCurrency();

  const [addDialog, setAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [packages, setPackages] = useState<any[]>([]);
  const [discountPercent, setDiscountPercent] = useState('10');
  const [quantityLimit, setQuantityLimit] = useState('');

  const handleProductChange = async (productId: string) => {
    setSelectedProduct(productId);
    setSelectedPackage('');
    
    if (productId) {
      const { data } = await supabase
        .from('product_packages')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order');
      setPackages(data || []);
    } else {
      setPackages([]);
    }
  };

  const handleAddItem = async () => {
    if (!saleId || !selectedProduct) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const pkg = packages.find(p => p.id === selectedPackage);
    
    const originalPrice = pkg?.price || product?.price || 0;
    const discount = parseFloat(discountPercent) || 0;
    const salePrice = originalPrice * (1 - discount / 100);

    try {
      await addMutation.mutateAsync({
        flash_sale_id: saleId,
        product_id: selectedProduct,
        package_id: selectedPackage || null,
        discount_percent: discount,
        original_price: originalPrice,
        sale_price: Math.round(salePrice),
        quantity_limit: quantityLimit ? parseInt(quantityLimit) : null,
        quantity_sold: 0,
        sort_order: (items?.length || 0) + 1,
      });
      toast.success('Đã thêm sản phẩm');
      setAddDialog(false);
      setSelectedProduct('');
      setSelectedPackage('');
      setDiscountPercent('10');
      setQuantityLimit('');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa sản phẩm');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };


  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý sản phẩm Flash Sale</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.package?.image_url || (item.product as any)?.image_url || '/placeholder.svg'}
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {(item.product as any)?.name}
                          {item.package && <span className="text-muted-foreground"> - {(item.package as any)?.name}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="destructive">-{item.discount_percent}%</Badge>
                          <span className="text-red-500 font-bold">{formatPrice(item.sale_price)}</span>
                          <span className="text-muted-foreground line-through text-sm">{formatPrice(item.original_price)}</span>
                        </div>
                        {item.quantity_limit && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Đã bán: {item.quantity_sold}/{item.quantity_limit}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Chưa có sản phẩm nào trong Flash Sale này
            </p>
          )}
        </div>

        {/* Add Item Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm sản phẩm giảm giá</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Sản phẩm *</Label>
                <Select value={selectedProduct} onValueChange={handleProductChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {packages.length > 0 && (
                <div>
                  <Label>Gói sản phẩm</Label>
                  <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn gói (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatPrice(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giảm giá (%)</Label>
                  <Input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    min="1"
                    max="99"
                  />
                </div>
                <div>
                  <Label>Giới hạn số lượng</Label>
                  <Input
                    type="number"
                    value={quantityLimit}
                    onChange={(e) => setQuantityLimit(e.target.value)}
                    placeholder="Không giới hạn"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddItem} disabled={addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Thêm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default AdminFlashSales;