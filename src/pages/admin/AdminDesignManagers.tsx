import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Trash2, Palette } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

interface DesignManager {
  id: string;
  user_id: string;
  full_name: string | null;
  is_active: boolean;
  permissions: any;
  created_at: string;
}

export default function AdminDesignManagers() {
  const queryClient = useQueryClient();
  const { formatDate } = useDateFormat();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');

  const { data: managers, isLoading } = useQuery({
    queryKey: ['admin-design-managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_managers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DesignManager[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      // First find user by email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', userEmail)
        .single();
      
      if (userError || !user) {
        throw new Error('Không tìm thấy người dùng với email này');
      }

      const { error } = await supabase.from('design_managers').insert({
        user_id: user.id,
        full_name: fullName || user.full_name,
        is_active: true,
        permissions: { can_manage_orders: true, can_manage_services: true },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-managers'] });
      toast.success('Đã thêm người quản lý');
      setIsDialogOpen(false);
      setUserEmail('');
      setFullName('');
    },
    onError: (error: any) => toast.error(error.message || 'Lỗi khi thêm người quản lý'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('design_managers')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-managers'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: () => toast.error('Lỗi khi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('design_managers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-design-managers'] });
      toast.success('Đã xóa người quản lý');
    },
    onError: () => toast.error('Lỗi khi xóa'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Người quản lý thiết kế</h1>
            <p className="text-muted-foreground">Quản lý những người có quyền quản lý mục thiết kế</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Thêm người quản lý</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người quản lý mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email người dùng</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tên hiển thị (tuỳ chọn)</Label>
                <Input
                  placeholder="Tên người quản lý"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate()}
                disabled={!userEmail || addMutation.isPending}
              >
                Thêm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Ngày thêm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : managers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Chưa có người quản lý nào</TableCell>
                </TableRow>
              ) : (
                managers?.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">{manager.full_name || 'Chưa đặt tên'}</TableCell>
                    <TableCell>{formatDate(manager.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={manager.is_active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: manager.id, isActive: checked })}
                        />
                        <Badge variant={manager.is_active ? 'default' : 'secondary'}>
                          {manager.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(manager.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
