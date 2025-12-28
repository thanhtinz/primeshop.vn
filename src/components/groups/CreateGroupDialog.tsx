import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateGroup } from '@/hooks/useGroups';

interface CreateGroupDialogProps {
  trigger?: React.ReactNode;
}

export function CreateGroupDialog({ trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private' | 'hidden',
    join_type: 'open' as 'open' | 'approval' | 'link' | 'code' | 'conditional',
    category: '',
    entry_fee: 0,
    monthly_fee: 0,
    require_approval: false,
  });
  
  const createGroup = useCreateGroup();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate slug from name
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    await createGroup.mutateAsync({
      name: formData.name,
      slug,
      description: formData.description || undefined,
      visibility: formData.visibility,
      join_type: formData.join_type,
      category: formData.category || undefined,
      entry_fee: formData.entry_fee || undefined,
      monthly_fee: formData.monthly_fee || undefined,
    });
    
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      visibility: 'public',
      join_type: 'open',
      category: '',
      entry_fee: 0,
      monthly_fee: 0,
      require_approval: false,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Group mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên group *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên group"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Giới thiệu về group"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="VD: MMO, Trading, Team..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quyền riêng tư</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(v) => setFormData({ ...formData, visibility: v as any })}
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
                onValueChange={(v) => setFormData({ ...formData, join_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Tự do</SelectItem>
                  <SelectItem value="approval">Duyệt</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="code">Mã code</SelectItem>
                  <SelectItem value="conditional">Điều kiện</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_fee">Phí vào (VNĐ)</Label>
              <Input
                id="entry_fee"
                type="number"
                min={0}
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Phí tháng (VNĐ)</Label>
              <Input
                id="monthly_fee"
                type="number"
                min={0}
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="require_approval">Yêu cầu duyệt bài</Label>
            <Switch
              id="require_approval"
              checked={formData.require_approval}
              onCheckedChange={(checked) => setFormData({ ...formData, require_approval: checked })}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={createGroup.isPending || !formData.name}>
              {createGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
