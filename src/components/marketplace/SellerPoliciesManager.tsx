import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useMyShopPolicies, 
  useCreatePolicy, 
  useUpdatePolicy, 
  useDeletePolicy,
  usePolicyAcceptanceLogs,
  type ShopPolicy 
} from '@/hooks/useShopPolicies';
import { FileText, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerPoliciesManagerProps {
  sellerId: string;
}

export const SellerPoliciesManager = ({ sellerId }: SellerPoliciesManagerProps) => {
  const { data: policies, isLoading } = useMyShopPolicies(sellerId);
  const { data: acceptances } = usePolicyAcceptanceLogs(sellerId);
  const { formatDateTime } = useDateFormat();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ShopPolicy | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_required: true,
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPolicy) {
      await updatePolicy.mutateAsync({
        id: editingPolicy.id,
        title: formData.title,
        content: formData.content,
        is_required: formData.is_required,
        is_active: formData.is_active
      });
    } else {
      await createPolicy.mutateAsync({
        seller_id: sellerId,
        title: formData.title,
        content: formData.content,
        is_required: formData.is_required,
        is_active: formData.is_active,
        sort_order: (policies?.length || 0) + 1
      });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      is_required: true,
      is_active: true
    });
    setEditingPolicy(null);
  };

  const handleEdit = (policy: ShopPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      content: policy.content,
      is_required: policy.is_required,
      is_active: policy.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa điều khoản này?')) {
      await deletePolicy.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Điều khoản & Chính sách Shop</h3>
          <p className="text-sm text-muted-foreground">
            Tạo điều khoản riêng cho shop, buyer phải đồng ý trước khi mua
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm điều khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'Sửa điều khoản' : 'Thêm điều khoản mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Chính sách hoàn tiền"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nội dung</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nhập nội dung điều khoản..."
                  rows={10}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                  />
                  <span className="text-sm">Bắt buộc đồng ý trước khi mua</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm">Kích hoạt</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createPolicy.isPending || updatePolicy.isPending}>
                  {editingPolicy ? 'Cập nhật' : 'Tạo điều khoản'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : policies && policies.length > 0 ? (
        <div className="grid gap-4">
          {policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{policy.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                      {policy.is_required && (
                          <Badge variant="destructive">Bắt buộc</Badge>
                        )}
                        {!policy.is_active && (
                          <Badge variant="outline">Đã tắt</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => handleDelete(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {policy.content}
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {acceptances?.filter(a => a.policy_id === policy.id).length || 0} người đã đồng ý
                  </span>
                  <span>
                    Cập nhật: {formatDateTime(policy.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có điều khoản nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo điều khoản để bảo vệ quyền lợi của bạn
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
