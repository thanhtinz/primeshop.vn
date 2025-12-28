import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGroupContext } from '@/components/groups/GroupLayout';
import { useUpdateGroup, GroupVisibility, GroupJoinType } from '@/hooks/useGroups';
import { Loader2, Save } from 'lucide-react';

export default function GroupSettingsPage() {
  const { groupId, canManage, group } = useGroupContext();
  const updateGroup = useUpdateGroup();
  
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description || '',
    visibility: group.visibility as GroupVisibility,
    join_type: group.join_type as GroupJoinType,
    entry_fee: group.entry_fee,
    monthly_fee: group.monthly_fee,
    min_level_to_join: group.min_level_to_join,
    min_reputation_to_join: group.min_reputation_to_join,
  });
  
  if (!canManage) {
    return <Navigate to={`/groups/${groupId}`} replace />;
  }
  
  const handleSave = async () => {
    await updateGroup.mutateAsync({
      groupId,
      data: formData,
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Cập nhật thông tin nhóm của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tên nhóm</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hiển thị</Label>
              <Select 
                value={formData.visibility}
                onValueChange={(v) => setFormData({ ...formData, visibility: v as GroupVisibility })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Công khai</SelectItem>
                  <SelectItem value="private">Riêng tư</SelectItem>
                  <SelectItem value="hidden">Ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cách tham gia</Label>
              <Select 
                value={formData.join_type}
                onValueChange={(v) => setFormData({ ...formData, join_type: v as GroupJoinType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Mở</SelectItem>
                  <SelectItem value="approval">Cần duyệt</SelectItem>
                  <SelectItem value="code">Mã mời</SelectItem>
                  <SelectItem value="link">Link mời</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Điều kiện tham gia</CardTitle>
          <CardDescription>Thiết lập yêu cầu để tham gia nhóm</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phí vào nhóm (VNĐ)</Label>
              <Input
                type="number"
                min={0}
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phí hàng tháng (VNĐ)</Label>
              <Input
                type="number"
                min={0}
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Level tối thiểu</Label>
              <Input
                type="number"
                min={0}
                value={formData.min_level_to_join}
                onChange={(e) => setFormData({ ...formData, min_level_to_join: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Điểm uy tín tối thiểu</Label>
              <Input
                type="number"
                min={0}
                value={formData.min_reputation_to_join}
                onChange={(e) => setFormData({ ...formData, min_reputation_to_join: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateGroup.isPending}>
          {updateGroup.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
