import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileKey } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LicenseType {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  description: string | null;
  price_multiplier: number;
  includes_commercial_use: boolean;
  includes_exclusive_rights: boolean;
  includes_source_files: boolean;
  sort_order: number;
  is_active: boolean;
}

export default function AdminDesignLicenses() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LicenseType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    description: '',
    price_multiplier: 1,
    includes_commercial_use: false,
    includes_exclusive_rights: false,
    includes_source_files: false,
    sort_order: 0,
    is_active: true,
  });

  const { data: licenses, isLoading } = useQuery({
    queryKey: ['admin-design-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_license_types')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as LicenseType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('design_license_types').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-licenses'] });
      toast.success('Đã tạo loại license');
      handleClose();
    },
    onError: () => toast.error('Lỗi khi tạo'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase.from('design_license_types').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-licenses'] });
      toast.success('Đã cập nhật');
      handleClose();
    },
    onError: () => toast.error('Lỗi khi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('design_license_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-licenses'] });
      toast.success('Đã xóa');
    },
    onError: () => toast.error('Lỗi khi xóa'),
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setFormData({
      code: '',
      name: '',
      name_en: '',
      description: '',
      price_multiplier: 1,
      includes_commercial_use: false,
      includes_exclusive_rights: false,
      includes_source_files: false,
      sort_order: 0,
      is_active: true,
    });
  };

  const handleEdit = (item: LicenseType) => {
    setEditing(item);
    setFormData({
      code: item.code,
      name: item.name,
      name_en: item.name_en || '',
      description: item.description || '',
      price_multiplier: item.price_multiplier,
      includes_commercial_use: item.includes_commercial_use,
      includes_exclusive_rights: item.includes_exclusive_rights,
      includes_source_files: item.includes_source_files,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileKey className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Loại License</h1>
            <p className="text-muted-foreground">Quản lý các loại license cho dịch vụ thiết kế</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Thêm mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa license' : 'Thêm license mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã code</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Hệ số giá</Label>
                  <Input type="number" step="0.1" value={formData.price_multiplier} onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tên tiếng Anh</Label>
                  <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.includes_commercial_use} onCheckedChange={(c) => setFormData({ ...formData, includes_commercial_use: c })} />
                  <Label>Sử dụng thương mại</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.includes_exclusive_rights} onCheckedChange={(c) => setFormData({ ...formData, includes_exclusive_rights: c })} />
                  <Label>Quyền độc quyền</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.includes_source_files} onCheckedChange={(c) => setFormData({ ...formData, includes_source_files: c })} />
                  <Label>Bao gồm source</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                  <Label>Kích hoạt</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Hệ số giá</TableHead>
                <TableHead>Quyền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : licenses?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Chưa có dữ liệu</TableCell></TableRow>
              ) : (
                licenses?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>x{item.price_multiplier}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.includes_commercial_use && <Badge variant="secondary">Commercial</Badge>}
                        {item.includes_exclusive_rights && <Badge variant="secondary">Exclusive</Badge>}
                        {item.includes_source_files && <Badge variant="secondary">Source</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Hoạt động' : 'Tạm ẩn'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
