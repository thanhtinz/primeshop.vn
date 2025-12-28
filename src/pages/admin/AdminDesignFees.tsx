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
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformFee {
  id: string;
  fee_type: string;
  name: string;
  description: string | null;
  fee_percent: number;
  fee_fixed: number;
  min_fee: number;
  max_fee: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminDesignFees() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformFee | null>(null);
  const [formData, setFormData] = useState({
    fee_type: '',
    name: '',
    description: '',
    fee_percent: 0,
    fee_fixed: 0,
    min_fee: 0,
    max_fee: 0,
    is_active: true,
  });

  const { data: fees, isLoading } = useQuery({
    queryKey: ['admin-design-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_platform_fees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PlatformFee[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('design_platform_fees').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-fees'] });
      toast.success('Đã tạo phí platform');
      handleClose();
    },
    onError: () => toast.error('Lỗi khi tạo'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & typeof formData) => {
      const { error } = await supabase.from('design_platform_fees').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-fees'] });
      toast.success('Đã cập nhật');
      handleClose();
    },
    onError: () => toast.error('Lỗi khi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('design_platform_fees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-fees'] });
      toast.success('Đã xóa');
    },
    onError: () => toast.error('Lỗi khi xóa'),
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setFormData({
      fee_type: '',
      name: '',
      description: '',
      fee_percent: 0,
      fee_fixed: 0,
      min_fee: 0,
      max_fee: 0,
      is_active: true,
    });
  };

  const handleEdit = (item: PlatformFee) => {
    setEditing(item);
    setFormData({
      fee_type: item.fee_type,
      name: item.name,
      description: item.description || '',
      fee_percent: item.fee_percent,
      fee_fixed: item.fee_fixed,
      min_fee: item.min_fee,
      max_fee: item.max_fee || 0,
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
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Phí Platform</h1>
            <p className="text-muted-foreground">Quản lý các loại phí cho dịch vụ thiết kế</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Thêm mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa phí' : 'Thêm phí mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại phí</Label>
                  <Input value={formData.fee_type} onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })} required placeholder="commission, escrow..." />
                </div>
                <div className="space-y-2">
                  <Label>Tên hiển thị</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phần trăm (%)</Label>
                  <Input type="number" step="0.01" value={formData.fee_percent} onChange={(e) => setFormData({ ...formData, fee_percent: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Phí cố định</Label>
                  <Input type="number" value={formData.fee_fixed} onChange={(e) => setFormData({ ...formData, fee_fixed: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phí tối thiểu</Label>
                  <Input type="number" value={formData.min_fee} onChange={(e) => setFormData({ ...formData, min_fee: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Phí tối đa</Label>
                  <Input type="number" value={formData.max_fee} onChange={(e) => setFormData({ ...formData, max_fee: parseFloat(e.target.value) })} placeholder="0 = không giới hạn" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                <Label>Kích hoạt</Label>
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
                <TableHead>Loại</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Phần trăm</TableHead>
                <TableHead>Cố định</TableHead>
                <TableHead>Tối thiểu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : fees?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Chưa có dữ liệu</TableCell></TableRow>
              ) : (
                fees?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.fee_type}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.fee_percent}%</TableCell>
                    <TableCell>{item.fee_fixed.toLocaleString()}đ</TableCell>
                    <TableCell>{item.min_fee.toLocaleString()}đ</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Hoạt động' : 'Tạm tắt'}</Badge>
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
