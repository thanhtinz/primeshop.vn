import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, Flame } from 'lucide-react';
import { useCheckinSettingsAdmin, useUpdateCheckinSettings } from '@/hooks/useAdminRewards';

export const CheckinSettingsTab = () => {
  const { data: settings, isLoading } = useCheckinSettingsAdmin();
  const updateSettings = useUpdateCheckinSettings();

  const handleUpdate = (updates: Record<string, any>) => {
    if (settings?.id) {
      updateSettings.mutate({ id: settings.id, updates });
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Cài đặt điểm danh hàng ngày
        </CardTitle>
        <CardDescription>
          Thiết lập điểm thưởng và các cột mốc streak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Bật tính năng điểm danh</Label>
            <p className="text-sm text-muted-foreground">
              Cho phép người dùng điểm danh hàng ngày để nhận điểm
            </p>
          </div>
          <Switch
            checked={settings?.is_enabled}
            onCheckedChange={(checked) => handleUpdate({ is_enabled: checked })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Điểm cơ bản mỗi ngày</Label>
            <Input
              type="number"
              value={settings?.base_points || 10}
              onChange={(e) => handleUpdate({ base_points: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hệ số nhân streak</Label>
            <Input
              type="number"
              step="0.1"
              value={settings?.streak_bonus_multiplier || 1.5}
              onChange={(e) => handleUpdate({ streak_bonus_multiplier: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Điểm thưởng streak tối đa</Label>
            <Input
              type="number"
              value={settings?.max_streak_bonus || 100}
              onChange={(e) => handleUpdate({ max_streak_bonus: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Cột mốc Streak (điểm bonus)
          </Label>
          <p className="text-sm text-muted-foreground">
            {settings?.streak_milestones?.map((m: any) => `${m.day} ngày: +${m.bonus} điểm`).join(' | ') || 'Chưa có cột mốc'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
