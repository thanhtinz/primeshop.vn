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
import { Plus, Pencil, Trash2, Loader2, Gift, Flame, Coins, Save } from 'lucide-react';
import { 
  useMilestoneRewardsAdmin, 
  useSaveMilestone, 
  useDeleteMilestone,
  type MilestoneReward 
} from '@/hooks/useAdminRewards';

export const MilestoneRewardsTab = () => {
  const { data: milestones, isLoading } = useMilestoneRewardsAdmin();
  const saveMilestone = useSaveMilestone();
  const deleteMilestone = useDeleteMilestone();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Partial<MilestoneReward> | null>(null);

  const handleSave = () => {
    if (editing) {
      saveMilestone.mutate(editing, {
        onSuccess: () => {
          setShowDialog(false);
          setEditing(null);
        }
      });
    }
  };

  const openEdit = (milestone?: MilestoneReward) => {
    setEditing(milestone || { is_active: true, reward_type: 'voucher', bonus_points: 0 });
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
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Quà thưởng theo mốc Streak
            </CardTitle>
            <CardDescription>
              Cài đặt quà tặng cho người dùng đạt các mốc điểm danh liên tục
            </CardDescription>
          </div>
          <Button onClick={() => openEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm quà mốc
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones?.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                <div className="flex items-center gap-4">
                  {milestone.reward_image_url ? (
                    <img src={milestone.reward_image_url} alt={milestone.reward_name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                        <Flame className="h-3 w-3 mr-1" />
                        {milestone.day_milestone} ngày
                      </Badge>
                      <p className="font-medium">{milestone.reward_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                      <Badge variant="secondary">{milestone.reward_type}</Badge>
                      {milestone.bonus_points > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Coins className="h-3 w-3" />
                          +{milestone.bonus_points}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={milestone.is_active ? 'default' : 'secondary'}>
                    {milestone.is_active ? 'Bật' : 'Tắt'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(milestone)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMilestone.mutate(milestone.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!milestones || milestones.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Chưa có quà mốc streak nào</p>
                <p className="text-sm">Thêm quà để khuyến khích người dùng điểm danh liên tục</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Sửa quà mốc streak' : 'Thêm quà mốc streak'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mốc ngày (streak)</Label>
                <Input
                  type="number"
                  min="1"
                  value={editing?.day_milestone || ''}
                  onChange={(e) => setEditing({ ...editing, day_milestone: parseInt(e.target.value) })}
                  placeholder="VD: 7"
                />
              </div>
              <div className="space-y-2">
                <Label>Điểm thưởng thêm</Label>
                <Input
                  type="number"
                  value={editing?.bonus_points || 0}
                  onChange={(e) => setEditing({ ...editing, bonus_points: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tên quà thưởng</Label>
              <Input
                value={editing?.reward_name || ''}
                onChange={(e) => setEditing({ ...editing, reward_name: e.target.value })}
                placeholder="VD: Voucher giảm 50K"
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={editing?.reward_description || ''}
                onChange={(e) => setEditing({ ...editing, reward_description: e.target.value })}
                placeholder="Mô tả chi tiết..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại quà</Label>
                <Select
                  value={editing?.reward_type || 'voucher'}
                  onValueChange={(value) => setEditing({ ...editing, reward_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="points">Điểm</SelectItem>
                    <SelectItem value="badge">Huy hiệu</SelectItem>
                    <SelectItem value="gift">Quà tặng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị</Label>
                <Input
                  value={editing?.reward_value || ''}
                  onChange={(e) => setEditing({ ...editing, reward_value: e.target.value })}
                  placeholder="VD: STREAK7-50K"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hình ảnh (URL)</Label>
              <Input
                value={editing?.reward_image_url || ''}
                onChange={(e) => setEditing({ ...editing, reward_image_url: e.target.value })}
                placeholder="https://..."
              />
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
            <Button onClick={handleSave} disabled={saveMilestone.isPending}>
              {saveMilestone.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
