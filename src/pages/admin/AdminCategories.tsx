import React, { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, DbCategory } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, MoreVertical, Package, Gamepad2, Palette } from 'lucide-react';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const AdminCategories = () => {
  const { data: categories, isLoading } = useCategories(false);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DbCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    slug: '',
    description: '',
    description_en: '',
    image_url: '',
    is_active: true,
    sort_order: 0,
    style: 'premium' as 'premium' | 'game_account' | 'design',
  });

  const resetForm = () => {
    setFormData({ name: '', name_en: '', slug: '', description: '', description_en: '', image_url: '', is_active: true, sort_order: 0, style: 'premium' });
    setEditingCategory(null);
  };

  const openDialog = (category?: DbCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        name_en: (category as any).name_en || '',
        slug: category.slug,
        description: category.description || '',
        description_en: (category as any).description_en || '',
        image_url: category.image_url || '',
        is_active: category.is_active,
        sort_order: category.sort_order,
        style: (category.style === 'game_topup' ? 'premium' : category.style) || 'premium',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        image_url: formData.image_url.trim() || null,
        description: formData.description.trim() || null,
        name_en: formData.name_en.trim() || null,
        description_en: formData.description_en.trim() || null,
      };
      
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...submitData });
        toast.success('Đã cập nhật danh mục');
      } else {
        await createCategory.mutateAsync(submitData);
        toast.success('Đã tạo danh mục mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await deleteCategory.mutateAsync(id);
        toast.success('Đã xóa danh mục');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Danh mục</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên danh mục (Tiếng Việt)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: editingCategory ? formData.slug : generateSlug(e.target.value)
                    });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tên danh mục (English)</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Category name in English"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả (Tiếng Việt)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả (English)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  placeholder="Description in English"
                />
              </div>
              <ImageUrlInput
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Hình ảnh"
                folder="categories"
              />
              <div className="space-y-2">
                <Label>Thứ tự sắp xếp</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Loại danh mục</Label>
                <Select 
                  value={formData.style} 
                  onValueChange={(value: 'premium' | 'game_account' | 'design') => setFormData({ ...formData, style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                    <SelectItem value="design">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span>Design</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Hoạt động</Label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {category.image_url && (
                    <img src={category.image_url} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{category.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {category.is_active ? 'Hoạt động' : 'Ẩn'}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => openDialog(category)}>
                        <Pencil className="h-4 w-4 mr-2" /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(category.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!categories || categories.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Chưa có danh mục nào
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {category.image_url && (
                        <img src={category.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {category.is_active ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!categories || categories.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chưa có danh mục nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategories;