import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, Gift, Coins, Save } from 'lucide-react';
import { 
  usePointsRewardsAdmin, 
  useSaveReward, 
  useDeleteReward,
  type PointsReward 
} from '@/hooks/useAdminRewards';

export const PointsRewardsTab = () => {
  const { data: rewards, isLoading } = usePointsRewardsAdmin();
  const saveReward = useSaveReward();
  const deleteReward = useDeleteReward();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Partial<PointsReward> | null>(null);

  const handleSave = () => {
    if (editing) {
      saveReward.mutate(editing, {
        onSuccess: () => {
          setShowDialog(false);
          setEditing(null);
        }
      });
    }
  };

  const openEdit = (reward?: PointsReward) => {
    setEditing(reward || { is_active: true, reward_type: 'voucher' });
    setShowDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Phần thưởng đổi điểm</CardTitle>
            <CardDescription>Quản lý các phần thưởng có thể đổi bằng điểm</CardDescription>
          </div>
          <Button onClick={() => openEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm phần thưởng
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewards?.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  {reward.image_url && (
                    <img src={reward.image_url} alt={reward.name} className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-medium">{reward.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{reward.reward_type}</Badge>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {reward.points_cost} điểm
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                    {reward.is_active ? 'Bật' : 'Tắt'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(reward)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteReward.mutate(reward.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!rewards || rewards.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Chưa có phần thưởng nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Sửa phần thưởng' : 'Thêm phần thưởng'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên phần thưởng</Label>
              <Input
                value={editing?.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={editing?.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại phần thưởng</Label>
                <Select
                  value={editing?.reward_type || 'voucher'}
                  onValueChange={(value) => setEditing({ ...editing, reward_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="balance">Số dư</SelectItem>
                    <SelectItem value="gift">Quà tặng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Điểm cần đổi</Label>
                <Input
                  type="number"
                  value={editing?.points_cost || ''}
                  onChange={(e) => setEditing({ ...editing, points_cost: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị (VNĐ hoặc %)</Label>
                <Input
                  type="number"
                  value={editing?.reward_value || ''}
                  onChange={(e) => setEditing({ ...editing, reward_value: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn số lượng</Label>
                <Input
                  type="number"
                  value={editing?.quantity_limit || ''}
                  onChange={(e) => setEditing({ ...editing, quantity_limit: parseInt(e.target.value) || null })}
                  placeholder="Không giới hạn"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing?.is_active !== false}
                onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })}
              />
              <Label>Kích hoạt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saveReward.isPending}>
              {saveReward.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
