import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  useGroupBadges, 
  useCreateGroupBadge, 
  useUpdateGroupBadge, 
  useDeleteGroupBadge,
  GroupBadge 
} from '@/hooks/useGroupBadges';
import { Plus, Edit, Trash2, Award, Star, Shield, Heart, Flame, Trophy, Crown, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupBadgeManagerProps {
  groupId: string;
}

const iconOptions = [
  { value: 'award', label: 'Award', icon: Award },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'flame', label: 'Flame', icon: Flame },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
  { value: 'crown', label: 'Crown', icon: Crown },
  { value: 'zap', label: 'Zap', icon: Zap },
];

const colorOptions = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
];

const criteriaTypes = [
  { value: 'posts_count', label: 'Số bài viết' },
  { value: 'comments_count', label: 'Số bình luận' },
  { value: 'contribution_points', label: 'Điểm đóng góp' },
  { value: 'member_days', label: 'Ngày tham gia' },
];

export function GroupBadgeManager({ groupId }: GroupBadgeManagerProps) {
  const { data: badges, isLoading } = useGroupBadges(groupId);
  const createBadge = useCreateGroupBadge();
  const updateBadge = useUpdateGroupBadge();
  const deleteBadge = useDeleteGroupBadge();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<GroupBadge | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('award');
  const [color, setColor] = useState('#3b82f6');
  const [criteria, setCriteria] = useState('');
  const [isAuto, setIsAuto] = useState(false);
  const [autoCriteriaType, setAutoCriteriaType] = useState('');
  const [autoCriteriaValue, setAutoCriteriaValue] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('award');
    setColor('#3b82f6');
    setCriteria('');
    setIsAuto(false);
    setAutoCriteriaType('');
    setAutoCriteriaValue('');
    setEditingBadge(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (badge: GroupBadge) => {
    setEditingBadge(badge);
    setName(badge.name);
    setDescription(badge.description || '');
    setIcon(badge.icon);
    setColor(badge.color);
    setCriteria(badge.criteria || '');
    setIsAuto(badge.is_auto);
    setAutoCriteriaType(badge.auto_criteria_type || '');
    setAutoCriteriaValue(badge.auto_criteria_value?.toString() || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên huy hiệu');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      criteria: criteria.trim() || undefined,
      is_auto: isAuto,
      auto_criteria_type: isAuto ? autoCriteriaType : undefined,
      auto_criteria_value: isAuto && autoCriteriaValue ? parseInt(autoCriteriaValue) : undefined,
    };

    if (editingBadge) {
      updateBadge.mutate({
        badgeId: editingBadge.id,
        data,
      }, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createBadge.mutate({
        ...data,
        group_id: groupId,
      }, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = (badge: GroupBadge) => {
    if (confirm(`Xác nhận xóa huy hiệu "${badge.name}"?`)) {
      deleteBadge.mutate({ badgeId: badge.id, groupId });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconConfig = iconOptions.find(i => i.value === iconName);
    return iconConfig?.icon || Award;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Quản lý huy hiệu</h3>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Tạo huy hiệu
        </Button>
      </div>

      {/* Badges list */}
      <div className="grid gap-3">
        {badges?.map((badge) => {
          const IconComponent = getIconComponent(badge.icon);
          return (
            <Card key={badge.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: badge.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{badge.name}</span>
                      {badge.is_auto && (
                        <Badge variant="secondary" className="text-xs">Tự động</Badge>
                      )}
                    </div>
                    {badge.description && (
                      <p className="text-sm text-muted-foreground truncate">{badge.description}</p>
                    )}
                    {badge.criteria && (
                      <p className="text-xs text-muted-foreground">Tiêu chí: {badge.criteria}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(badge)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(badge)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!badges || badges.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có huy hiệu nào</p>
              <p className="text-sm">Tạo huy hiệu để trao cho thành viên</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBadge ? 'Chỉnh sửa huy hiệu' : 'Tạo huy hiệu mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên huy hiệu *</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Thành viên tích cực"
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về huy hiệu này..."
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Màu sắc</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: opt.value }}
                          />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiêu chí nhận huy hiệu</Label>
              <Input 
                value={criteria} 
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="VD: Đóng góp 100 bài viết"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Tự động cấp huy hiệu</Label>
              <Switch checked={isAuto} onCheckedChange={setIsAuto} />
            </div>

            {isAuto && (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label className="text-sm">Loại tiêu chí</Label>
                  <Select value={autoCriteriaType} onValueChange={setAutoCriteriaType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {criteriaTypes.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Giá trị cần đạt</Label>
                  <Input 
                    type="number"
                    value={autoCriteriaValue} 
                    onChange={(e) => setAutoCriteriaValue(e.target.value)}
                    placeholder="VD: 100"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="p-3 rounded-lg bg-muted/50">
              <Label className="text-sm text-muted-foreground mb-2 block">Xem trước</Label>
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = getIconComponent(icon);
                  return (
                    <Badge 
                      className="gap-1 px-2 py-1"
                      style={{ 
                        backgroundColor: `${color}20`,
                        color: color,
                        borderColor: `${color}40`,
                      }}
                    >
                      <IconComponent className="h-3 w-3" />
                      {name || 'Tên huy hiệu'}
                    </Badge>
                  );
                })()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createBadge.isPending || updateBadge.isPending}
            >
              {(createBadge.isPending || updateBadge.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {editingBadge ? 'Lưu thay đổi' : 'Tạo huy hiệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
