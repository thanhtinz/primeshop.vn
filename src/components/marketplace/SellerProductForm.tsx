import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  useCreateSellerProduct, useUpdateSellerProduct, 
  SellerProduct, Seller 
} from '@/hooks/useMarketplace';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SellerProductFormProps {
  seller: Seller;
  editingProduct: SellerProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomField {
  id: string;
  name: string;
  value: string;
}

// Helper to parse account_info - supports both array and object format
const parseAccountInfo = (info: any): CustomField[] => {
  if (!info) return [];
  // If already array format
  if (Array.isArray(info)) {
    return info.map((item: { name: string; value: string }) => ({
      id: crypto.randomUUID(),
      name: item.name || '',
      value: item.value || ''
    }));
  }
  // Legacy object format
  return Object.entries(info as Record<string, string>).map(([name, value]) => ({
    id: crypto.randomUUID(),
    name,
    value
  }));
};

export function SellerProductForm({ seller, editingProduct, open, onOpenChange }: SellerProductFormProps) {
  // Get categories with style = 'game_account'
  const { data: allCategories = [] } = useCategories();
  const categories = allCategories.filter(cat => cat.style === 'game_account');
  
  const createProduct = useCreateSellerProduct();
  const updateProduct = useUpdateSellerProduct();
  
  const [form, setForm] = useState({
    description: '',
    category: '',
    price: '',
    account_data: '',
    images: [] as string[]
  });
  
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [uploading, setUploading] = useState(false);

  // Reset form when editingProduct changes or dialog opens
  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setForm({
          description: editingProduct.description || '',
          category: editingProduct.category || '',
          price: editingProduct.price ? String(editingProduct.price) : '',
          account_data: editingProduct.account_data || '',
          images: editingProduct.images || []
        });
        setCustomFields(parseAccountInfo(editingProduct.account_info));
      } else {
        // Reset for new product
        setForm({
          description: '',
          category: '',
          price: '',
          account_data: '',
          images: []
        });
        setCustomFields([]);
      }
    }
  }, [open, editingProduct]);
  
  // Generate product title: Category Name - #ID
  const generateProductTitle = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    const categoryName = category?.name || categorySlug;
    const randomId = Math.floor(100000 + Math.random() * 900000); // 6 digit number
    return `${categoryName} - #${randomId}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const newImages: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${seller.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        newImages.push(publicUrl);
      }
      
      setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
    } catch (error: any) {
      toast.error('Lỗi upload ảnh: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // Custom fields management
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: crypto.randomUUID(), name: '', value: '' }]);
  };

  const updateCustomField = (id: string, field: 'name' | 'value', val: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const moveCustomField = (index: number, direction: 'up' | 'down') => {
    setCustomFields(prev => {
      const newFields = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFields.length) return prev;
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      return newFields;
    });
  };

  const handleSubmit = async () => {
    if (!form.category || !form.price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Store as array to preserve order
    const accountInfo = customFields
      .filter(field => field.name.trim())
      .map(field => ({ name: field.name.trim(), value: field.value }));
    
    // Auto-generate title for new products, keep existing title for edits
    const title = editingProduct?.title || generateProductTitle(form.category);
    
    try {
      const data = {
        seller_id: seller.id,
        title,
        description: form.description,
        category: form.category,
        game_type: null,
        price: parseFloat(form.price),
        original_price: null,
        account_data: form.account_data,
        account_info: accountInfo,
        images: form.images,
        status: 'available' as const,
        is_featured: false
      };
      
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...data });
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Thêm sản phẩm thành công');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Images */}
          <div className="space-y-2">
            <Label>Hình ảnh sản phẩm</Label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              ))}
              <Label htmlFor="product-images" className="cursor-pointer">
                <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center hover:bg-muted transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Label>
              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground">Có thể upload nhiều ảnh</p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Giá bán (VNĐ) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="50000"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả chi tiết</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chi tiết về tài khoản: level, vật phẩm, skin, rank..."
              rows={4}
            />
          </div>

          {/* Custom Fields for Account Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Thông tin tài khoản (hiển thị cho khách)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm trường
              </Button>
            </div>
            
            {customFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Chưa có trường nào. Nhấn "Thêm trường" để tạo.
              </p>
            ) : (
              <div className="space-y-2">
                {customFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveCustomField(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveCustomField(index, 'down')}
                        disabled={index === customFields.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Tên trường (VD: Level, Rank)"
                      value={field.name}
                      onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Giá trị"
                      value={field.value}
                      onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeCustomField(field.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Data (private) */}
          <div className="space-y-2">
            <Label>Thông tin đăng nhập (giao cho khách sau khi mua)</Label>
            <Textarea
              value={form.account_data}
              onChange={(e) => setForm(f => ({ ...f, account_data: e.target.value }))}
              placeholder="Email: xxx@gmail.com&#10;Password: xxx&#10;Mã 2FA (nếu có): xxx"
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Thông tin này chỉ hiển thị cho khách sau khi thanh toán và bạn xác nhận giao hàng
            </p>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {(createProduct.isPending || updateProduct.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
