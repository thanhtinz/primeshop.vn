import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Plus, Pencil, Trash2, Loader2
} from 'lucide-react';
import { useMySellerProducts, useDeleteSellerProduct, SellerProduct } from '@/hooks/useMarketplace';
import { SellerProductForm } from '@/components/marketplace/SellerProductForm';
import { toast } from 'sonner';

export default function SellerProductsPage() {
  const { seller, formatPrice } = useOutletContext<any>();
  const { data: products = [], isLoading } = useMySellerProducts();
  const deleteProduct = useDeleteSellerProduct();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);

  const availableProducts = products.filter(p => p.status === 'available').length;

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Xóa sản phẩm thành công');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditProduct = (product: SellerProduct) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
          <p className="text-muted-foreground">{availableProducts} sản phẩm đang bán / {products.length} tổng</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium mb-2">Chưa có sản phẩm nào</p>
            <p className="text-sm text-muted-foreground mb-4">Bắt đầu bán hàng bằng cách thêm sản phẩm đầu tiên</p>
            <Button onClick={() => { setEditingProduct(null); setProductDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium truncate">{product.title}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <Badge variant={product.status === 'available' ? 'default' : product.status === 'sold' ? 'secondary' : 'outline'}>
                        {product.status === 'available' ? 'Đang bán' : product.status === 'sold' ? 'Đã bán' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-lg text-primary">{formatPrice(product.price)}</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditProduct(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={product.status === 'sold'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SellerProductForm 
        seller={seller} 
        editingProduct={editingProduct}
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}
      />
    </div>
  );
}