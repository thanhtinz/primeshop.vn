import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Globe, Search } from 'lucide-react';
import { 
  useSmmPlatforms, 
  useCreateSmmPlatform, 
  useUpdateSmmPlatform, 
  useDeleteSmmPlatform,
  SmmPlatform 
} from '@/hooks/useSmm';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const AdminSmmPlatforms = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<SmmPlatform | null>(null);
  
  const { data: platforms = [], isLoading } = useSmmPlatforms();
  const createPlatform = useCreateSmmPlatform();
  const updatePlatform = useUpdateSmmPlatform();
  const deletePlatform = useDeleteSmmPlatform();
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon_url: '',
    sort_order: 0,
    is_active: true,
  });

  const filteredPlatforms = platforms.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      icon_url: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingPlatform(null);
  };

  const handleOpenDialog = (platform?: SmmPlatform) => {
    if (platform) {
      setEditingPlatform(platform);
      setFormData({
        name: platform.name,
        slug: platform.slug,
        icon_url: platform.icon_url || '',
        sort_order: platform.sort_order,
        is_active: platform.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      if (editingPlatform) {
        await updatePlatform.mutateAsync({ id: editingPlatform.id, ...formData });
        toast.success('Đã cập nhật nền tảng');
      } else {
        await createPlatform.mutateAsync(formData);
        toast.success('Đã tạo nền tảng mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi lưu nền tảng');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nền tảng này?')) return;
    
    try {
      await deletePlatform.mutateAsync(id);
      toast.success('Đã xóa nền tảng');
    } catch (error) {
      toast.error('Lỗi khi xóa nền tảng');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 md:w-6 md:h-6" />
            Nền tảng SMM
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Quản lý các nền tảng mạng xã hội</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Thêm nền tảng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlatform ? 'Sửa nền tảng' : 'Thêm nền tảng mới'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tên nền tảng</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name,
                      slug: editingPlatform ? formData.slug : generateSlug(name)
                    });
                  }}
                  placeholder="Ví dụ: Facebook"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Ví dụ: facebook"
                />
              </div>

              <div className="space-y-2">
                <ImageUrlInput
                  value={formData.icon_url || ''}
                  onChange={(url) => setFormData({ ...formData, icon_url: url })}
                  label="Icon nền tảng"
                  folder="smm-platforms"
                  aspectHint="Khuyến nghị: 64x64px, PNG hoặc SVG"
                />
              </div>

              <div className="space-y-2">
                <Label>Thứ tự sắp xếp</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Kích hoạt</Label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  {editingPlatform ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm nền tảng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredPlatforms.map((platform) => (
          <Card key={platform.id}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {platform.icon_url ? (
                  <img src={platform.icon_url} alt={platform.name} className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-xs text-muted-foreground">{platform.slug}</div>
                </div>
                <Badge variant={platform.is_active ? 'default' : 'secondary'} className="text-xs">
                  {platform.is_active ? 'Hoạt động' : 'Tắt'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(platform)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(platform.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPlatforms.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có nền tảng nào
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Danh sách nền tảng ({filteredPlatforms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlatforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell>
                    {platform.icon_url ? (
                      <img src={platform.icon_url} alt={platform.name} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{platform.name}</TableCell>
                  <TableCell className="text-muted-foreground">{platform.slug}</TableCell>
                  <TableCell>{platform.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                      {platform.is_active ? 'Hoạt động' : 'Tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(platform)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(platform.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlatforms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Không có nền tảng nào
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

export default AdminSmmPlatforms;
