import React, { useState, useRef } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, ProductWithRelations, useCreatePackage, useUpdatePackage, useDeletePackage, useCreateCustomField, useUpdateCustomField, useDeleteCustomField, DbProductPackage, DbProductCustomField } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductImages, useUploadProductImage, useDeleteProductImage, useSetPrimaryImage, useReorderProductImages } from '@/hooks/useProductImages';
import { useNaperisCategories, useNaperisCategoryProducts, useNaperisSyncStatus, useNaperisSyncPrices } from '@/hooks/useNaperisAdmin';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Package, Settings2, Upload, X, Star, Image as ImageIcon, MoreVertical, Gamepad2, Zap, GripVertical, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AccountInfoEditor } from '@/components/admin/AccountInfoEditor';
import { GameAccountInventoryManager } from '@/components/admin/GameAccountInventoryManager';
import RichTextEditor from '@/components/ui/rich-text-editor';
import ImageUrlInput from '@/components/admin/ImageUrlInput';
const AdminProducts = () => {
  const { data: products, isLoading } = useProducts(false);
  const { data: categories } = useCategories(false);
  
  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(products || [], { itemsPerPage: 10 });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const createCustomField = useCreateCustomField();
  const updateCustomField = useUpdateCustomField();
  const deleteCustomField = useDeleteCustomField();
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();
  const setPrimaryImage = useSetPrimaryImage();
  const reorderImages = useReorderProductImages();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    warranty_info: '',
    usage_guide: '',
    image_url: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    style: 'premium' as 'premium' | 'game_account' | 'game_topup',
    price: null as number | null,
    account_info: null as Record<string, string> | null,
    external_api: null as string | null,
    external_category_id: null as string | null,
    tags: [] as string[],
  });

  // Image management
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<string | null>(null);
  const { data: productImages } = useProductImages(selectedProductForImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  // Package form
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductStyle, setSelectedProductStyle] = useState<string>('premium');
  const [selectedProductExternalCategoryId, setSelectedProductExternalCategoryId] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<DbProductPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: 0,
    original_price: null as number | null,
    is_active: true,
    is_in_stock: true,
    sort_order: 0,
    image_url: null as string | null,
    external_product_id: null as string | null,
    markup_percent: null as number | null,
  });

  // Naperis data for package creation
  const { data: naperisCategories, isLoading: isLoadingNaperisCategories } = useNaperisCategories();
  const [selectedNaperisCategoryId, setSelectedNaperisCategoryId] = useState<string | null>(null);
  const { data: naperisCategoryData, isLoading: isLoadingNaperisProducts } = useNaperisCategoryProducts(selectedNaperisCategoryId);
  
  // Naperis price sync
  const { data: syncStatus, refetch: refetchSyncStatus } = useNaperisSyncStatus();
  const syncPrices = useNaperisSyncPrices();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  // Custom field form
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<DbProductCustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'text',
    is_required: false,
    placeholder: '',
    sort_order: 0,
    options: '' as string, // For selection type: comma-separated options
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', short_description: '', warranty_info: '', usage_guide: '', image_url: '', category_id: '', is_active: true, is_featured: false, sort_order: 0, style: 'premium', price: null, account_info: null, external_api: null, external_category_id: null, tags: [] });
    setEditingProduct(null);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const openDialog = (product?: ProductWithRelations) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        short_description: product.short_description || '',
        warranty_info: product.warranty_info || '',
        usage_guide: product.usage_guide || '',
        image_url: product.image_url || '',
        category_id: product.category_id || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        sort_order: product.sort_order,
        style: product.style || 'premium',
        price: product.price ?? null,
        account_info: product.account_info ?? null,
        external_api: product.external_api ?? null,
        external_category_id: product.external_category_id ?? null,
        tags: (product as any).tags || [],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, category_id: formData.category_id || null };
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...data });
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Đã tạo sản phẩm mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await deleteProduct.mutateAsync(id);
        toast.success('Đã xóa sản phẩm');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const openPackageDialog = (productId: string, productStyle: string, pkg?: DbProductPackage, externalCategoryId?: string | null) => {
    setSelectedProductId(productId);
    setSelectedProductStyle(productStyle || 'premium');
    setSelectedProductExternalCategoryId(externalCategoryId || null);
    
    // If it's a game_topup and has external_category_id, pre-select the Naperis category
    if (productStyle === 'game_topup' && externalCategoryId) {
      setSelectedNaperisCategoryId(externalCategoryId);
    } else {
      setSelectedNaperisCategoryId(null);
    }
    
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price,
        original_price: pkg.original_price,
        is_active: pkg.is_active,
        is_in_stock: pkg.is_in_stock ?? true,
        sort_order: pkg.sort_order,
        image_url: pkg.image_url || null,
        external_product_id: pkg.external_product_id || null,
        markup_percent: pkg.markup_percent ?? null,
      });
    } else {
      setEditingPackage(null);
      setPackageForm({ name: '', description: '', price: 0, original_price: null, is_active: true, is_in_stock: true, sort_order: 0, image_url: null, external_product_id: null, markup_percent: null });
    }
    setPackageDialogOpen(true);
  };

  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      if (editingPackage) {
        await updatePackage.mutateAsync({ id: editingPackage.id, ...packageForm });
        toast.success('Đã cập nhật gói sản phẩm');
      } else {
        await createPackage.mutateAsync({ product_id: selectedProductId, ...packageForm });
        toast.success('Đã thêm gói sản phẩm');
      }
      setPackageDialogOpen(false);
      setEditingPackage(null);
      setPackageForm({ name: '', description: '', price: 0, original_price: null, is_active: true, is_in_stock: true, sort_order: 0, image_url: null, external_product_id: null });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa gói này?')) {
      try {
        await deletePackage.mutateAsync(id);
        toast.success('Đã xóa gói sản phẩm');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const openFieldDialog = (productId: string, field?: DbProductCustomField) => {
    setSelectedProductId(productId);
    if (field) {
      setEditingField(field);
      setFieldForm({
        field_name: field.field_name || field.fieldName || '',
        field_type: field.field_type || field.fieldType || 'text',
        is_required: field.is_required ?? field.isRequired ?? false,
        placeholder: field.placeholder || '',
        sort_order: field.sort_order ?? field.order ?? 0,
        options: Array.isArray(field.options) ? field.options.join(',') : '',
      });
    } else {
      setEditingField(null);
      setFieldForm({ field_name: '', field_type: 'text', is_required: false, placeholder: '', sort_order: 0, options: '' });
    }
    setFieldDialogOpen(true);
  };

  const handleSubmitField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      const fieldData = {
        ...fieldForm,
        options: fieldForm.field_type === 'selection' && fieldForm.options 
          ? fieldForm.options.split(',').map(o => o.trim()).filter(o => o)
          : null,
      };
      if (editingField) {
        await updateCustomField.mutateAsync({ id: editingField.id, ...fieldData });
        toast.success('Đã cập nhật trường tùy chỉnh');
      } else {
        await createCustomField.mutateAsync({ product_id: selectedProductId, ...fieldData });
        toast.success('Đã thêm trường tùy chỉnh');
      }
      setFieldDialogOpen(false);
      setEditingField(null);
      setFieldForm({ field_name: '', field_type: 'text', is_required: false, placeholder: '', sort_order: 0, options: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa trường này?')) {
      try {
        await deleteCustomField.mutateAsync(id);
        toast.success('Đã xóa trường tùy chỉnh');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedProductForImages) return;
    
    for (const file of Array.from(files)) {
      try {
        await uploadImage.mutateAsync({ productId: selectedProductForImages, file });
        toast.success(`Đã upload ${file.name}`);
      } catch (error: any) {
        toast.error(`Lỗi upload ${file.name}: ${error.message}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteImage = async (id: string, imageUrl: string) => {
    if (!selectedProductForImages) return;
    try {
      await deleteImage.mutateAsync({ id, productId: selectedProductForImages, imageUrl });
      toast.success('Đã xóa ảnh');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!selectedProductForImages) return;
    try {
      await setPrimaryImage.mutateAsync({ id, productId: selectedProductForImages });
      toast.success('Đã đặt ảnh chính');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openImageDialog = (productId: string) => {
    setSelectedProductForImages(productId);
    setImageDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Sản phẩm</h1>
        <div className="flex gap-2">
          {/* Naperis Price Sync Button */}
          <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { refetchSyncStatus(); setSyncDialogOpen(true); }}
                className="relative"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync giá Naperis
                {syncStatus && syncStatus.needsUpdate > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {syncStatus.needsUpdate}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Đồng bộ giá từ Naperis</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Trạng thái</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus?.total || 0} gói có markup • {syncStatus?.needsUpdate || 0} cần cập nhật
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        const result = await syncPrices.mutateAsync();
                        toast.success(`Đã cập nhật ${result.updated} gói sản phẩm`);
                        refetchSyncStatus();
                      } catch (error) {
                        toast.error('Lỗi khi sync giá');
                      }
                    }}
                    disabled={syncPrices.isPending || !syncStatus?.needsUpdate}
                  >
                    {syncPrices.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang sync...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync ngay
                      </>
                    )}
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {syncStatus?.packages?.map((pkg) => (
                      <div 
                        key={pkg.id} 
                        className={`p-3 rounded-lg border ${pkg.needsUpdate ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.productName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              Giá nguồn: {pkg.sourcePrice?.toLocaleString() || 'N/A'}đ × (1 + {pkg.markupPercent}%)
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={pkg.needsUpdate ? 'text-red-500 line-through' : ''}>
                                {pkg.currentPrice.toLocaleString()}đ
                              </span>
                              {pkg.needsUpdate && pkg.calculatedPrice && (
                                <>
                                  <span>→</span>
                                  <span className="text-green-600 font-medium">
                                    {pkg.calculatedPrice.toLocaleString()}đ
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!syncStatus?.packages || syncStatus.packages.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Chưa có gói nào được cấu hình markup %
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-100px)] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên sản phẩm</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: editingProduct ? formData.slug : generateSlug(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.style !== 'game_topup' && (
                    <div className="space-y-2">
                      <Label>Danh mục</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                        <SelectContent className="bg-popover">
                          {categories?.filter(cat => cat.style !== 'game_topup').map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <span>{cat.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  cat.style === 'game_account' ? 'bg-purple-100 text-purple-700' : 
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {cat.style === 'game_account' ? 'Acc' : 'Premium'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Loại sản phẩm</Label>
                    <Select 
                      value={formData.style} 
                      onValueChange={(value: 'premium' | 'game_account' | 'game_topup') => setFormData({ ...formData, style: value, category_id: value === 'game_topup' ? '' : formData.category_id })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="premium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Premium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="game_account">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4" />
                            <span>Account</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="game_topup">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Topup</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Price for game_account style */}
                {formData.style === 'game_account' && (
                  <div className="space-y-2">
                    <Label>Giá bán</Label>
                    <Input 
                      type="number" 
                      value={formData.price || ''} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : null })} 
                      placeholder="VD: 50000"
                    />
                  </div>
                )}
                {/* Account Info for game_account style */}
                {formData.style === 'game_account' && (
                  <AccountInfoEditor 
                    value={formData.account_info || {}}
                    onChange={(info) => setFormData({ ...formData, account_info: info })}
                  />
                )}
                {/* Account Inventory for game_account style (only when editing) */}
                {formData.style === 'game_account' && editingProduct?.id && (
                  <GameAccountInventoryManager 
                    productId={editingProduct.id}
                    productName={editingProduct.name}
                  />
                )}
                {/* External API fields for game_topup */}
                {formData.style === 'game_topup' && (
                  <>
                    <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">Cấu hình API nạp game</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>API Provider</Label>
                          <Select 
                            value={formData.external_api || ''} 
                            onValueChange={(value) => setFormData({ ...formData, external_api: value || null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn API" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="naperis">Naperis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category ID (từ API)</Label>
                          <Input 
                            value={formData.external_category_id || ''} 
                            onChange={(e) => setFormData({ ...formData, external_category_id: e.target.value || null })}
                            placeholder="VD: 49"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags for game_topup */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                      <Label className="text-sm font-medium">Tags hiển thị</Label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.tags.includes('giao_nhanh')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, tags: [...formData.tags, 'giao_nhanh'] });
                              } else {
                                setFormData({ ...formData, tags: formData.tags.filter(t => t !== 'giao_nhanh') });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                            Giao nhanh
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.tags.includes('dat_hang')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, tags: [...formData.tags, 'dat_hang'] });
                              } else {
                                setFormData({ ...formData, tags: formData.tags.filter(t => t !== 'dat_hang') });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
                            📦 Đặt hàng
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Tags sẽ hiển thị trên card sản phẩm nạp game</p>
                    </div>
                  </>
                )}
                {formData.style === 'premium' && (
                  <>
                    <div className="space-y-2">
                      <Label>Mô tả chi tiết</Label>
                      <RichTextEditor 
                        content={formData.description} 
                        onChange={(content) => setFormData({ ...formData, description: content })}
                        placeholder="Mô tả đầy đủ về sản phẩm..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mô tả ngắn</Label>
                      <Input value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} placeholder="Hiển thị trên card sản phẩm" maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Thông tin bảo hành</Label>
                      <RichTextEditor 
                        content={formData.warranty_info} 
                        onChange={(content) => setFormData({ ...formData, warranty_info: content })}
                        placeholder="Nhập thông tin bảo hành..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hướng dẫn sử dụng</Label>
                      <RichTextEditor 
                        content={formData.usage_guide} 
                        onChange={(content) => setFormData({ ...formData, usage_guide: content })}
                        placeholder="Nhập hướng dẫn sử dụng..."
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Thứ tự</Label>
                    <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="flex items-center gap-2 sm:pt-6">
                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label>Hoạt động</Label>
                  </div>
                  <div className="flex items-center gap-2 sm:pt-6">
                    <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                    <Label>Nổi bật</Label>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                  <Button type="submit">{editingProduct ? 'Cập nhật' : 'Tạo mới'}</Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPackage ? 'Sửa gói sản phẩm' : 'Thêm gói sản phẩm'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitPackage} className="space-y-4">
            <div className="space-y-2"><Label>Tên gói</Label><Input value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Mô tả</Label><Input value={packageForm.description || ''} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} /></div>
            <ImageUrlInput
              value={packageForm.image_url || ''}
              onChange={(url) => setPackageForm({ ...packageForm, image_url: url || null })}
              label="Ảnh gói"
              folder="product-packages"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Giá bán</Label><Input type="number" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || 0 })} required /></div>
              <div className="space-y-2"><Label>Giá gốc (hiển thị gạch)</Label><Input type="number" value={packageForm.original_price || ''} onChange={(e) => setPackageForm({ ...packageForm, original_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Để trống nếu không cần" /></div>
            </div>
            {selectedProductStyle === 'game_topup' && (
              <div className="space-y-4 p-3 bg-muted/50 rounded-lg border">
                <div className="text-sm font-medium text-muted-foreground">Cấu hình Naperis API</div>
                
                {/* Markup % for auto pricing */}
                <div className="space-y-2">
                  <Label>Markup % (tự động cập nhật giá theo nguồn)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      value={packageForm.markup_percent ?? ''} 
                      onChange={(e) => {
                        const percent = e.target.value ? parseFloat(e.target.value) : null;
                        setPackageForm({ ...packageForm, markup_percent: percent });
                      }} 
                      placeholder="VD: 10 = +10%"
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {packageForm.markup_percent !== null && packageForm.external_product_id && naperisCategoryData?.products && (
                      (() => {
                        const selectedProduct = naperisCategoryData.products.find(p => String(p.id) === packageForm.external_product_id);
                        if (selectedProduct?.price) {
                          const calculatedPrice = Math.round(selectedProduct.price * (1 + (packageForm.markup_percent || 0) / 100));
                          return (
                            <>
                              <span className="text-sm text-green-600 font-medium">
                                → {calculatedPrice.toLocaleString()}đ
                              </span>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                onClick={() => setPackageForm(prev => ({ ...prev, price: calculatedPrice }))}
                              >
                                Áp dụng
                              </Button>
                            </>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Khi nguồn cập nhật giá, hệ thống sẽ tự động tính: Giá nguồn × (1 + %)
                  </p>
                </div>
                
                {/* Naperis Category Selector */}
                <div className="space-y-2">
                  <Label>Danh mục Naperis</Label>
                  <Select 
                    value={selectedNaperisCategoryId || ''} 
                    onValueChange={(value) => {
                      setSelectedNaperisCategoryId(value || null);
                      // Clear product selection when category changes
                      setPackageForm(prev => ({ ...prev, external_product_id: null }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingNaperisCategories ? 'Đang tải...' : 'Chọn danh mục từ Naperis'} />
                    </SelectTrigger>
                    <SelectContent>
                      {naperisCategories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name} (ID: {cat.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProductExternalCategoryId && selectedNaperisCategoryId !== selectedProductExternalCategoryId && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Sản phẩm đang dùng category ID: {selectedProductExternalCategoryId}
                    </p>
                  )}
                </div>

                {/* Naperis Product Selector */}
                {selectedNaperisCategoryId && (
                  <div className="space-y-2">
                    <Label>Sản phẩm Naperis</Label>
                    <Select 
                      value={packageForm.external_product_id || ''} 
                      onValueChange={(value) => {
                        const selectedProduct = naperisCategoryData?.products?.find(p => String(p.id) === value);
                        setPackageForm(prev => ({ 
                          ...prev, 
                          external_product_id: value || null,
                          // Auto-fill name only (price is manually entered)
                          name: prev.name || selectedProduct?.name || '',
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingNaperisProducts ? 'Đang tải...' : 'Chọn sản phẩm từ Naperis'} />
                      </SelectTrigger>
                      <SelectContent>
                        {naperisCategoryData?.products?.map((prod) => (
                          <SelectItem key={prod.id} value={String(prod.id)}>
                            {prod.name} (ID: {prod.id}) - Giá gốc: {prod.price?.toLocaleString()}đ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Chỉ lấy thông tin sản phẩm, giá bán do bạn tự nhập</p>
                  </div>
                )}

                {/* Manual input fallback */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Hoặc nhập ID thủ công</Label>
                  <Input 
                    value={packageForm.external_product_id || ''} 
                    onChange={(e) => setPackageForm({ ...packageForm, external_product_id: e.target.value || null })}
                    placeholder="VD: 234"
                    className="text-sm"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch checked={packageForm.is_active} onCheckedChange={(checked) => setPackageForm({ ...packageForm, is_active: checked })} /><Label>Hoạt động</Label></div>
              <div className="flex items-center gap-2"><Switch checked={packageForm.is_in_stock} onCheckedChange={(checked) => setPackageForm({ ...packageForm, is_in_stock: checked })} /><Label>Còn hàng</Label></div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setPackageDialogOpen(false)}>Hủy</Button><Button type="submit">{editingPackage ? 'Cập nhật' : 'Thêm'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingField ? 'Sửa trường tùy chỉnh' : 'Thêm trường tùy chỉnh'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitField} className="space-y-4">
            <div className="space-y-2"><Label>Tên trường</Label><Input value={fieldForm.field_name} onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={fieldForm.field_type} onValueChange={(value) => setFieldForm({ ...fieldForm, field_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="selection">Selection (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldForm.field_type === 'selection' && (
              <div className="space-y-2">
                <Label>Các lựa chọn</Label>
                <Input 
                  value={fieldForm.options} 
                  onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })} 
                  placeholder="Nhập các lựa chọn, cách nhau bởi dấu phẩy (VD: iOS,Android,PC)"
                />
                <p className="text-xs text-muted-foreground">Các lựa chọn sẽ hiển thị trong dropdown khi khách hàng đặt hàng</p>
              </div>
            )}
            <div className="space-y-2"><Label>Placeholder</Label><Input value={fieldForm.placeholder || ''} onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={fieldForm.is_required} onCheckedChange={(checked) => setFieldForm({ ...fieldForm, is_required: checked })} /><Label>Bắt buộc</Label></div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setFieldDialogOpen(false)}>Hủy</Button><Button type="submit">{editingField ? 'Cập nhật' : 'Thêm'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Management Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quản lý ảnh sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImage.isPending}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadImage.isPending ? 'Đang upload...' : 'Upload ảnh'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              <GripVertical className="h-3 w-3 inline mr-1" />
              Kéo thả để sắp xếp thứ tự ảnh. Ảnh đánh dấu sao (⭐) sẽ dùng làm logo và không hiển thị trong gallery.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {productImages?.map((img, index) => (
                <div 
                  key={img.id} 
                  className={`relative group cursor-move transition-all ${
                    draggedImageId === img.id ? 'opacity-50 scale-95' : ''
                  }`}
                  draggable
                  onDragStart={(e) => {
                    setDraggedImageId(img.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDraggedImageId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedImageId || draggedImageId === img.id || !productImages || !selectedProductForImages) return;
                    
                    const draggedIndex = productImages.findIndex(i => i.id === draggedImageId);
                    const dropIndex = index;
                    
                    if (draggedIndex === -1) return;
                    
                    // Reorder the images
                    const newOrder = [...productImages];
                    const [draggedItem] = newOrder.splice(draggedIndex, 1);
                    newOrder.splice(dropIndex, 0, draggedItem);
                    
                    // Save new order
                    reorderImages.mutate({
                      productId: selectedProductForImages,
                      imageIds: newOrder.map(i => i.id)
                    }, {
                      onSuccess: () => toast.success('Đã cập nhật thứ tự ảnh'),
                      onError: () => toast.error('Lỗi khi cập nhật thứ tự')
                    });
                    
                    setDraggedImageId(null);
                  }}
                >
                  {/* Drag handle */}
                  <div className="absolute top-1/2 left-1 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded p-0.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <img
                    src={img.image_url}
                    alt=""
                    className={`w-full h-32 object-cover rounded-lg border-2 ${img.is_primary ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                  />
                  {img.is_primary && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Star className="h-3 w-3" /> Logo
                    </span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.is_primary && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => handleSetPrimary(img.id)}
                        title="Đặt làm logo sản phẩm"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => handleDeleteImage(img.id, img.image_url)}
                      title="Xóa ảnh"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!productImages || productImages.length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Chưa có ảnh nào. Click "Upload ảnh" để thêm.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Cards - Mobile */}
      <div className="block md:hidden space-y-3">
        {paginatedItems?.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-full h-full rounded object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category?.name || 'Chưa phân loại'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openImageDialog(product.id)}>
                            <ImageIcon className="h-4 w-4 mr-2" /> Quản lý ảnh
                          </DropdownMenuItem>
                          {(product.style || 'premium') !== 'game_account' && (
                            <>
                              <DropdownMenuItem onClick={() => openPackageDialog(product.id, product.style || 'premium', undefined, product.external_category_id)}>
                                <Package className="h-4 w-4 mr-2" /> Thêm gói
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openFieldDialog(product.id)}>
                                <Settings2 className="h-4 w-4 mr-2" /> Thêm trường
                              </DropdownMenuItem>
                            </>
                          )}
                        <DropdownMenuItem onClick={() => openDialog(product)}>
                          <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {product.is_active ? 'Hoạt động' : 'Ẩn'}
                    </span>
                    {product.is_featured && <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Nổi bật</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      (product.style || 'premium') === 'game_account' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 
                      product.style === 'game_topup' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {(product.style || 'premium') === 'game_account' ? 'Account' : product.style === 'game_topup' ? 'Topup' : 'Premium'}
                    </span>
                  </div>
                  {(product.style || 'premium') === 'game_account' && product.price && (
                    <div className="mt-2 text-sm font-medium text-primary">
                      {Number(product.price).toLocaleString()}đ
                    </div>
                  )}
                  {/* Packages - Mobile */}
                  {(product.style || 'premium') !== 'game_account' && product.packages && product.packages.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Gói:</p>
                      {product.packages.map(pkg => (
                        <div key={pkg.id} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-xs">
                          {pkg.image_url && <img src={pkg.image_url} alt="" className="h-6 w-6 rounded object-cover" />}
                          <span className="flex-1 truncate">{pkg.name}: <span className="font-medium">{Number(pkg.price).toLocaleString()}đ</span></span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openPackageDialog(product.id, product.style || 'premium', pkg, product.external_category_id)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePackage(pkg.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Custom Fields - Mobile */}
                  {(product.style || 'premium') !== 'game_account' && product.custom_fields && product.custom_fields.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Trường tuỳ chỉnh:</p>
                      {product.custom_fields.map(field => (
                        <div key={field.id} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1 text-xs">
                          <span className="flex-1 truncate">{field.field_name}{field.is_required && <span className="text-destructive">*</span>}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openFieldDialog(product.id, field)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteField(field.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!paginatedItems || paginatedItems.length === 0) && products && products.length > 0 ? null : (
          (!products || products.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có sản phẩm nào
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Product Table - Desktop */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Sản phẩm</th>
                  <th className="text-left p-4 font-medium">Danh mục</th>
                  <th className="text-left p-4 font-medium">Gói / Trường tuỳ chỉnh</th>
                  <th className="text-left p-4 font-medium">Trạng thái</th>
                  <th className="text-right p-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems?.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{product.category?.name || '-'}</td>
                    <td className="p-4">
                      <div className="text-sm space-y-2">
                        {/* Packages */}
                        {product.packages && product.packages.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Gói:</p>
                            {product.packages.map(pkg => (
                              <div key={pkg.id} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                                {pkg.image_url && <img src={pkg.image_url} alt="" className="h-5 w-5 rounded object-cover" />}
                                <span className="flex-1">{pkg.name}: <span className="font-medium">{Number(pkg.price).toLocaleString()}đ</span></span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openPackageDialog(product.id, product.style || 'premium', pkg, product.external_category_id)} title="Sửa">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeletePackage(pkg.id)} title="Xóa">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Custom Fields */}
                        {product.custom_fields && product.custom_fields.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Trường tuỳ chỉnh:</p>
                            {product.custom_fields.map(field => (
                              <div key={field.id} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                                <span className="flex-1">{field.field_name} ({field.field_type}){field.is_required && <span className="text-destructive">*</span>}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openFieldDialog(product.id, field)} title="Sửa">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteField(field.id)} title="Xóa">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {(!product.packages || product.packages.length === 0) && (!product.custom_fields || product.custom_fields.length === 0) && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {product.is_active ? 'Hoạt động' : 'Ẩn'}
                        </span>
                        {product.is_featured && <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Nổi bật</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openImageDialog(product.id)} title="Quản lý ảnh">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        {(product.style || 'premium') !== 'game_account' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openPackageDialog(product.id, product.style || 'premium', undefined, product.external_category_id)} title="Thêm gói">
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openFieldDialog(product.id)} title="Thêm trường">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openDialog(product)} title="Chỉnh sửa">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} title="Xóa">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!products || products.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có sản phẩm nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        className="mt-4"
      />
    </div>
  );
};

export default AdminProducts;
