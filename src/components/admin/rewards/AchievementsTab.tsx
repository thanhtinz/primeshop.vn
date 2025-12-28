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
import { Plus, Pencil, Trash2, Loader2, Trophy, Coins, Save } from 'lucide-react';
import { 
  useAchievementsAdmin, 
  useSaveAchievement, 
  useDeleteAchievement,
  type Achievement 
} from '@/hooks/useAdminRewards';

export const AchievementsTab = () => {
  const { data: achievements, isLoading } = useAchievementsAdmin();
  const saveAchievement = useSaveAchievement();
  const deleteAchievement = useDeleteAchievement();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Partial<Achievement> | null>(null);

  const handleSave = () => {
    if (editing) {
      saveAchievement.mutate(editing, {
        onSuccess: () => {
          setShowDialog(false);
          setEditing(null);
        }
      });
    }
  };

  const openEdit = (achievement?: Achievement) => {
    setEditing(achievement || { is_active: true, requirement_type: 'purchase_count', badge_color: '#FFD700' });
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
            <CardTitle>Thành tựu / Huy hiệu</CardTitle>
            <CardDescription>Quản lý các thành tựu người dùng có thể đạt được</CardDescription>
          </div>
          <Button onClick={() => openEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm thành tựu
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements?.map((achievement) => (
              <div key={achievement.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${achievement.badge_color}20` }}
                  >
                    <Trophy className="h-5 w-5" style={{ color: achievement.badge_color || '#FFD700' }} />
                  </div>
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{achievement.description}</span>
                      {(achievement.points_reward ?? 0) > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Coins className="h-3 w-3" />
                          +{achievement.points_reward}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={achievement.is_active ? 'default' : 'secondary'}>
                    {achievement.is_active ? 'Bật' : 'Tắt'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(achievement)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAchievement.mutate(achievement.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {(!achievements || achievements.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Chưa có thành tựu nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Sửa thành tựu' : 'Thêm thành tựu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã thành tựu</Label>
                <Input
                  value={editing?.code || ''}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  placeholder="vd: first_purchase"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên thành tựu</Label>
                <Input
                  value={editing?.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
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
                <Label>Loại yêu cầu</Label>
                <Select
                  value={editing?.requirement_type || 'purchase_count'}
                  onValueChange={(value) => setEditing({ ...editing, requirement_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase_count">Số đơn hàng</SelectItem>
                    <SelectItem value="review_count">Số đánh giá</SelectItem>
                    <SelectItem value="total_spent">Tổng chi tiêu</SelectItem>
                    <SelectItem value="referral_count">Số giới thiệu</SelectItem>
                    <SelectItem value="vip_level">Cấp VIP</SelectItem>
                    <SelectItem value="checkin_streak">Streak điểm danh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị yêu cầu</Label>
                <Input
                  type="number"
                  value={editing?.requirement_value || ''}
                  onChange={(e) => setEditing({ ...editing, requirement_value: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Điểm thưởng</Label>
                <Input
                  type="number"
                  value={editing?.points_reward || ''}
                  onChange={(e) => setEditing({ ...editing, points_reward: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Màu huy hiệu</Label>
                <Input
                  type="color"
                  value={editing?.badge_color || '#FFD700'}
                  onChange={(e) => setEditing({ ...editing, badge_color: e.target.value })}
                  className="h-10"
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
            <Button onClick={handleSave} disabled={saveAchievement.isPending}>
              {saveAchievement.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
