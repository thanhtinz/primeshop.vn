import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Ticket, Plus, Pencil, Trash2, Loader2, Percent, DollarSign, Calendar 
} from 'lucide-react';
import { 
  useSellerVouchers, useCreateSellerVoucher, useUpdateSellerVoucher, useDeleteSellerVoucher, 
  SellerVoucher 
} from '@/hooks/useSellerVouchers';
import { Seller } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerVoucherManagerProps {
  seller: Seller;
}

export function SellerVoucherManager({ seller }: SellerVoucherManagerProps) {
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const { data: vouchers = [], isLoading } = useSellerVouchers();
  const createVoucher = useCreateSellerVoucher();
  const updateVoucher = useUpdateSellerVoucher();
  const deleteVoucher = useDeleteSellerVoucher();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<SellerVoucher | null>(null);
  // Helper to format date for datetime-local input (local timezone)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order_amount: '0',
    max_uses: '',
    per_user_limit: '',
    valid_from: formatDateForInput(new Date()),
    valid_to: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    is_active: true
  });

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percentage',
      value: '',
      min_order_amount: '0',
      max_uses: '',
      per_user_limit: '',
      valid_from: formatDateForInput(new Date()),
      valid_to: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      is_active: true
    });
    setEditingVoucher(null);
  };

  const openEdit = (voucher: SellerVoucher) => {
    setEditingVoucher(voucher);
    setForm({
      code: voucher.code,
      type: voucher.type,
      value: String(voucher.value),
      min_order_amount: String(voucher.min_order_amount),
      max_uses: voucher.max_uses ? String(voucher.max_uses) : '',
      per_user_limit: voucher.per_user_limit ? String(voucher.per_user_limit) : '',
      valid_from: formatDateForInput(new Date(voucher.valid_from)),
      valid_to: formatDateForInput(new Date(voucher.valid_to)),
      is_active: voucher.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const data = {
        seller_id: seller.id,
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        per_user_limit: form.per_user_limit ? parseInt(form.per_user_limit) : null,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_to: new Date(form.valid_to).toISOString(),
        is_active: form.is_active
      };

      if (editingVoucher) {
        await updateVoucher.mutateAsync({ id: editingVoucher.id, ...data });
        toast.success('Cập nhật voucher thành công');
      } else {
        await createVoucher.mutateAsync(data);
        toast.success('Tạo voucher thành công');
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
    try {
      await deleteVoucher.mutateAsync(id);
      toast.success('Xóa voucher thành công');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Voucher cửa hàng</h2>
          <p className="text-sm text-muted-foreground">Tạo mã giảm giá riêng cho shop của bạn</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVoucher ? 'Sửa voucher' : 'Tạo voucher mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mã voucher *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="VD: SALE10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại giảm giá</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Số tiền cố định</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị *</Label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'percentage' ? '10' : '50000'}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Đơn tối thiểu</Label>
                  <Input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tổng lượt dùng</Label>
                  <Input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Lượt dùng/người</Label>
                <Input
                  type="number"
                  value={form.per_user_limit}
                  onChange={(e) => setForm(f => ({ ...f, per_user_limit: e.target.value }))}
                  placeholder="Không giới hạn"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu</Label>
                  <Input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm(f => ({ ...f, valid_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc</Label>
                  <Input
                    type="datetime-local"
                    value={form.valid_to}
                    onChange={(e) => setForm(f => ({ ...f, valid_to: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Kích hoạt</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))}
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                className="w-full"
                disabled={createVoucher.isPending || updateVoucher.isPending}
              >
                {(createVoucher.isPending || updateVoucher.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingVoucher ? 'Cập nhật' : 'Tạo voucher'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Chưa có voucher nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vouchers.map((voucher) => (
            <Card key={voucher.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {voucher.type === 'percentage' ? (
                        <Percent className="h-5 w-5 text-primary" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{voucher.code}</span>
                        <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                          {voucher.is_active ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                      </div>
                      <p className="text-sm text-primary font-medium">
                        Giảm {voucher.type === 'percentage' ? `${voucher.value}%` : formatPrice(voucher.value)}
                        {voucher.min_order_amount > 0 && ` (đơn từ ${formatPrice(voucher.min_order_amount)})`}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(voucher.valid_from, 'dd/MM/yy')} - {formatDate(voucher.valid_to, 'dd/MM/yy')}
                        {voucher.max_uses && ` • ${voucher.used_count}/${voucher.max_uses} đã dùng`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(voucher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleDelete(voucher.id)}
                      disabled={deleteVoucher.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
