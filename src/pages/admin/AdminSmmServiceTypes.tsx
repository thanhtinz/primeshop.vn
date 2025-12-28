import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layers, Search, Filter } from 'lucide-react';
import { 
  useSmmPlatforms,
  useSmmServiceTypes, 
  useCreateSmmServiceType, 
  useUpdateSmmServiceType, 
  useDeleteSmmServiceType,
  SmmServiceType 
} from '@/hooks/useSmm';

const AdminSmmServiceTypes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState<SmmServiceType | null>(null);
  
  const { data: platforms = [] } = useSmmPlatforms();
  const { data: serviceTypes = [], isLoading } = useSmmServiceTypes();
  const createServiceType = useCreateSmmServiceType();
  const updateServiceType = useUpdateSmmServiceType();
  const deleteServiceType = useDeleteSmmServiceType();
  
  const [formData, setFormData] = useState({
    platform_id: '',
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  const filteredServiceTypes = serviceTypes.filter(st => {
    const matchesPlatform = !platformFilter || st.platform_id === platformFilter;
    const matchesSearch = !searchQuery || 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      platform_id: '',
      name: '',
      slug: '',
      description: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingServiceType(null);
  };

  const handleOpenDialog = (serviceType?: SmmServiceType) => {
    if (serviceType) {
      setEditingServiceType(serviceType);
      setFormData({
        platform_id: serviceType.platform_id,
        name: serviceType.name,
        slug: serviceType.slug,
        description: serviceType.description || '',
        sort_order: serviceType.sort_order,
        is_active: serviceType.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.platform_id || !formData.name || !formData.slug) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      if (editingServiceType) {
        await updateServiceType.mutateAsync({ id: editingServiceType.id, ...formData });
        toast.success('Đã cập nhật loại dịch vụ');
      } else {
        await createServiceType.mutateAsync(formData);
        toast.success('Đã tạo loại dịch vụ mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Lỗi khi lưu loại dịch vụ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa loại dịch vụ này?')) return;
    
    try {
      await deleteServiceType.mutateAsync(id);
      toast.success('Đã xóa loại dịch vụ');
    } catch (error) {
      toast.error('Lỗi khi xóa loại dịch vụ');
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
            <Layers className="w-5 h-5 md:w-6 md:h-6" />
            Loại dịch vụ SMM
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Quản lý các loại dịch vụ (Like, Follow...)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Thêm loại dịch vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingServiceType ? 'Sửa loại dịch vụ' : 'Thêm loại dịch vụ mới'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nền tảng</Label>
                <Select
                  value={formData.platform_id}
                  onValueChange={(value) => setFormData({ ...formData, platform_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nền tảng" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tên loại dịch vụ</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name,
                      slug: editingServiceType ? formData.slug : generateSlug(name)
                    });
                  }}
                  placeholder="Ví dụ: Like, Follow, View..."
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Ví dụ: like, follow, view"
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả loại dịch vụ..."
                  rows={3}
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
                  {editingServiceType ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm loại dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={platformFilter || "all"} onValueChange={(v) => setPlatformFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả nền tảng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nền tảng</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredServiceTypes.map((serviceType) => (
          <Card key={serviceType.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{serviceType.name}</div>
                  <div className="text-xs text-muted-foreground">{serviceType.slug}</div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {serviceType.platform?.name || 'N/A'}
                  </Badge>
                </div>
                <Badge variant={serviceType.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {serviceType.is_active ? 'Hoạt động' : 'Tắt'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(serviceType)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(serviceType.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredServiceTypes.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có loại dịch vụ nào
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Danh sách loại dịch vụ ({filteredServiceTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Nền tảng</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServiceTypes.map((serviceType) => (
                <TableRow key={serviceType.id}>
                  <TableCell className="font-medium">{serviceType.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {serviceType.platform?.name || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{serviceType.slug}</TableCell>
                  <TableCell>{serviceType.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={serviceType.is_active ? 'default' : 'secondary'}>
                      {serviceType.is_active ? 'Hoạt động' : 'Tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(serviceType)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(serviceType.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServiceTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Không có loại dịch vụ nào
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

export default AdminSmmServiceTypes;
