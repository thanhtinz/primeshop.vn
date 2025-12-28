import React, { useState, useEffect } from 'react';
import { useVouchers, useCreateVoucher, useUpdateVoucher, useDeleteVoucher, DbVoucher } from '@/hooks/useVouchers';
import { useAllUserVouchers, useAssignVoucher, useDeleteUserVoucher } from '@/hooks/useUserVouchers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MoreVertical, UserPlus, Users, Search } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
}

const AdminVouchers = () => {
  const { formatDateTime, formatDate } = useDateFormat();
  const { data: vouchers, isLoading } = useVouchers();
  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();
  const deleteVoucher = useDeleteVoucher();
  const { data: userVouchers, isLoading: userVouchersLoading } = useAllUserVouchers();
  const assignVoucher = useAssignVoucher();
  const deleteUserVoucher = useDeleteUserVoucher();
  const { formatPrice } = useCurrency();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<DbVoucher | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_value: null as number | null,
    max_discount: null as number | null,
    usage_limit: null as number | null,
    per_user_limit: null as number | null,
    is_active: true,
    expires_at: '',
  });

  // Assign voucher state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [assignExpiresAt, setAssignExpiresAt] = useState('');

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name')
        .order('email');
      if (!error && data) {
        setUsers(data as Profile[]);
      }
    };
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: null,
      max_discount: null,
      usage_limit: null,
      per_user_limit: null,
      is_active: true,
      expires_at: '',
    });
    setEditingVoucher(null);
  };

  const openDialog = (voucher?: DbVoucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        min_order_value: voucher.min_order_value,
        max_discount: voucher.max_discount,
        usage_limit: voucher.usage_limit,
        per_user_limit: voucher.per_user_limit,
        is_active: voucher.is_active,
        expires_at: voucher.expires_at ? formatDateTime(voucher.expires_at, "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const openAssignDialog = (voucherId?: string) => {
    setSelectedVoucherId(voucherId || '');
    setSelectedUserIds([]);
    setAssignExpiresAt('');
    setUserSearch('');
    setIsAssignDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };
      
      if (editingVoucher) {
        await updateVoucher.mutateAsync({ id: editingVoucher.id, ...data });
        toast.success('Đã cập nhật voucher');
      } else {
        await createVoucher.mutateAsync(data);
        toast.success('Đã tạo voucher mới');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignVoucher = async () => {
    if (!selectedVoucherId || selectedUserIds.length === 0) {
      toast.error('Vui lòng chọn voucher và người dùng');
      return;
    }

    try {
      await assignVoucher.mutateAsync({
        voucherId: selectedVoucherId,
        userIds: selectedUserIds,
        expiresAt: assignExpiresAt ? new Date(assignExpiresAt).toISOString() : undefined,
      });
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      // Error already handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa voucher này?')) {
      try {
        await deleteVoucher.mutateAsync(id);
        toast.success('Đã xóa voucher');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteUserVoucher = async (id: string) => {
    if (confirm('Bạn có chắc muốn thu hồi voucher này?')) {
      try {
        await deleteUserVoucher.mutateAsync(id);
      } catch (error: any) {
        // Error handled in hook
      }
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const filteredUsers = users.filter(u =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
    );
    setSelectedUserIds(filteredUsers.map(u => u.user_id));
  };

  const deselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  const getDiscountText = (voucher: DbVoucher) => {
    const value = voucher.discount_type === 'percentage' 
      ? `${voucher.discount_value}%` 
      : formatPrice(voucher.discount_value);
    return voucher.max_discount ? `${value} (max ${formatPrice(voucher.max_discount)})` : value;
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Vouchers</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => openAssignDialog()} variant="outline" size="sm" className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" /> Gán voucher
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Thêm voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVoucher ? 'Sửa voucher' : 'Thêm voucher mới'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Mã voucher</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: WELCOME10"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại giảm giá</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                        <SelectItem value="fixed">Số tiền cố định</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Giá trị</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Đơn tối thiểu</Label>
                    <Input
                      type="number"
                      value={formData.min_order_value || ''}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Không bắt buộc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giảm tối đa</Label>
                    <Input
                      type="number"
                      value={formData.max_discount || ''}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tổng lượt sử dụng</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Không giới hạn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lượt/người dùng</Label>
                    <Input
                      type="number"
                      value={formData.per_user_limit || ''}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hết hạn</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
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
                  <Button type="submit" disabled={createVoucher.isPending || updateVoucher.isPending}>
                    {editingVoucher ? 'Cập nhật' : 'Tạo mới'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assign Voucher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gán voucher cho người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn voucher</Label>
              <Select value={selectedVoucherId} onValueChange={setSelectedVoucherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn voucher..." />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-60">
                  {vouchers?.filter(v => v.is_active).map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.code} - {getDiscountText(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hạn sử dụng riêng (tùy chọn)</Label>
              <Input
                type="datetime-local"
                value={assignExpiresAt}
                onChange={(e) => setAssignExpiresAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chọn người dùng ({selectedUserIds.length} đã chọn)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllUsers}>
                    Chọn tất cả
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={deselectAllUsers}>
                    Bỏ chọn
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo email hoặc tên..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleUserSelection(user.user_id)}
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(user.user_id)}
                      onCheckedChange={() => toggleUserSelection(user.user_id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      {user.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">Không tìm thấy người dùng</p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleAssignVoucher}
                disabled={assignVoucher.isPending || !selectedVoucherId || selectedUserIds.length === 0}
              >
                <Users className="h-4 w-4 mr-2" />
                Gán cho {selectedUserIds.length} người
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="vouchers" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="vouchers">Danh sách voucher</TabsTrigger>
          <TabsTrigger value="assigned">Đã gán ({userVouchers?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {vouchers?.map((voucher) => (
              <Card key={voucher.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-mono font-bold text-lg">{voucher.code}</p>
                      <p className="text-sm text-primary font-medium">{getDiscountText(voucher)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Đã dùng: {voucher.used_count}{voucher.usage_limit && ` / ${voucher.usage_limit}`}</span>
                      </div>
                      {voucher.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Hết hạn: {formatDate(voucher.expires_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${voucher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {voucher.is_active ? 'Hoạt động' : 'Tắt'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openAssignDialog(voucher.id)}>
                            <UserPlus className="h-4 w-4 mr-2" /> Gán người dùng
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialog(voucher)}>
                            <Pencil className="h-4 w-4 mr-2" /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(voucher.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!vouchers || vouchers.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Chưa có voucher nào
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
                    <TableHead>Mã</TableHead>
                    <TableHead>Giảm giá</TableHead>
                    <TableHead>Đã dùng</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers?.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono font-medium">{voucher.code}</TableCell>
                      <TableCell>{getDiscountText(voucher)}</TableCell>
                      <TableCell>
                        {voucher.used_count}
                        {voucher.usage_limit && ` / ${voucher.usage_limit}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {voucher.expires_at ? formatDate(voucher.expires_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${voucher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {voucher.is_active ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openAssignDialog(voucher.id)} title="Gán người dùng">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDialog(voucher)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!vouchers || vouchers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Chưa có voucher nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle>Voucher đã gán</CardTitle>
              <CardDescription>Danh sách voucher đã được gán cho người dùng cụ thể</CardDescription>
            </CardHeader>
            <CardContent>
              {userVouchersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userVouchers && userVouchers.length > 0 ? (
                <div className="space-y-3">
                  {userVouchers.map((uv) => (
                    <div key={uv.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold">{uv.voucher?.code}</span>
                          {uv.is_used ? (
                            <Badge variant="secondary">Đã dùng</Badge>
                          ) : uv.expires_at && new Date(uv.expires_at) < new Date() ? (
                            <Badge variant="destructive">Hết hạn</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">Còn hiệu lực</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">User ID: {uv.user_id.slice(0, 8)}...</p>
                        {uv.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            HSD: {formatDateTime(uv.expires_at)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUserVoucher(uv.id)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Chưa có voucher nào được gán</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVouchers;
