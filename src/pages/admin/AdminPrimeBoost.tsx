import { useState, useRef } from 'react';
import { Crown, Plus, Edit, Trash2, Loader2, Palette, Sparkles, Gift, Frame, Upload, Image as ImageIcon, Zap, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAllAvatarFrames, useCreateAvatarFrame, useUpdateAvatarFrame, useDeleteAvatarFrame } from '@/hooks/useAvatarFrames';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

// ============ PRIME PLANS MANAGEMENT ============
const PrimePlansTab = () => {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-prime-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prime_boost_plans')
        .select('*')
        .order('plan_type', { ascending: true })
        .order('duration_days', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_days: 30,
    price: 0,
    discount_percent: 0,
    points_multiplier: 1,
    is_active: true,
    sort_order: 0,
    plan_type: 'boost' as 'basic' | 'boost',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPlan) {
        const { error } = await supabase
          .from('prime_boost_plans')
          .update(data)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prime_boost_plans')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-plans'] });
      setDialogOpen(false);
      toast.success(editingPlan ? 'Cập nhật thành công' : 'Tạo mới thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prime_boost_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-plans'] });
      toast.success('Đã xóa');
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({ name: '', duration_days: 30, price: 0, discount_percent: 0, points_multiplier: 1, is_active: true, sort_order: 0, plan_type: 'boost' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration_days: plan.duration_days,
      price: plan.price,
      discount_percent: plan.discount_percent || 0,
      points_multiplier: plan.points_multiplier || 1,
      is_active: plan.is_active,
      sort_order: plan.sort_order || 0,
      plan_type: plan.plan_type || 'boost',
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // Separate plans by type
  const basicPlans = plans?.filter(p => p.plan_type === 'basic') || [];
  const boostPlans = plans?.filter(p => p.plan_type !== 'basic') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gói Prime</h2>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm gói
        </Button>
      </div>

      {/* Basic Plans */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-blue-500">Gói Basic</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {basicPlans.map((plan) => (
            <Card key={plan.id} className={`border-blue-500/30 ${!plan.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      {plan.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">Basic</Badge>
                    {!plan.is_active && <Badge variant="secondary">Ẩn</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-500">{formatPrice(plan.price)}</p>
                  <p className="text-sm text-muted-foreground">{plan.duration_days} ngày</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(plan)}>
                      <Edit className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>Bạn có chắc muốn xóa gói này?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(plan.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {basicPlans.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Chưa có gói Basic nào
            </div>
          )}
        </div>
      </div>

      {/* Boost Plans */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-pink-500" />
          <h3 className="font-semibold text-pink-500">Gói Boost</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boostPlans.map((plan) => (
            <Card key={plan.id} className={`border-pink-500/30 ${!plan.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Diamond className="h-4 w-4 text-pink-500" />
                      {plan.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/30">Boost</Badge>
                    {!plan.is_active && <Badge variant="secondary">Ẩn</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-pink-500">{formatPrice(plan.price)}</p>
                  <p className="text-sm text-muted-foreground">{plan.duration_days} ngày</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(plan)}>
                      <Edit className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>Bạn có chắc muốn xóa gói này?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(plan.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {boostPlans.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Chưa có gói Boost nào
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Sửa gói' : 'Thêm gói mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loại gói</Label>
              <Select 
                value={formData.plan_type} 
                onValueChange={(value: 'basic' | 'boost') => setFormData({ ...formData, plan_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại gói" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Basic
                    </div>
                  </SelectItem>
                  <SelectItem value="boost">
                    <div className="flex items-center gap-2">
                      <Diamond className="h-4 w-4 text-pink-500" />
                      Boost
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tên gói</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số ngày</Label>
                <Input type="number" value={formData.duration_days} onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Giá (VNĐ)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giảm giá (%)</Label>
                <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Nhân điểm</Label>
                <Input type="number" step="0.1" value={formData.points_multiplier} onChange={(e) => setFormData({ ...formData, points_multiplier: parseFloat(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Thứ tự</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label>Hiển thị</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPlan ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ NAME COLORS MANAGEMENT ============
const NameColorsTab = () => {
  const queryClient = useQueryClient();
  const { data: colors, isLoading } = useQuery({
    queryKey: ['admin-name-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('name_colors')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    color_value: '#FFD700',
    is_gradient: false,
    gradient_value: '',
    price: 0,
    is_active: true,
    sort_order: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingColor) {
        const { error } = await supabase.from('name_colors').update(data).eq('id', editingColor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('name_colors').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-name-colors'] });
      setDialogOpen(false);
      toast.success(editingColor ? 'Cập nhật thành công' : 'Tạo mới thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('name_colors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-name-colors'] });
      toast.success('Đã xóa');
    },
  });

  const handleOpenCreate = () => {
    setEditingColor(null);
    setFormData({ name: '', color_value: '#FFD700', is_gradient: false, gradient_value: '', price: 0, is_active: true, sort_order: 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (color: any) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      color_value: color.color_value,
      is_gradient: color.is_gradient || false,
      gradient_value: color.gradient_value || '',
      price: color.price,
      is_active: color.is_active,
      sort_order: color.sort_order || 0,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Màu tên</h2>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm màu
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {colors?.map((color) => (
          <Card key={color.id} className={!color.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div 
                  className="h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                  style={{ 
                    background: color.is_gradient && color.gradient_value ? color.gradient_value : color.color_value,
                    WebkitBackgroundClip: color.is_gradient ? 'text' : undefined,
                    WebkitTextFillColor: color.is_gradient ? 'transparent' : undefined,
                    color: !color.is_gradient ? 'white' : undefined,
                    textShadow: !color.is_gradient ? '0 1px 2px rgba(0,0,0,0.5)' : undefined,
                  }}
                >
                  {color.name}
                </div>
                <p className="text-center font-bold text-primary">{formatPrice(color.price)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(color)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc muốn xóa màu này?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(color.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColor ? 'Sửa màu' : 'Thêm màu mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên màu</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_gradient} onCheckedChange={(checked) => setFormData({ ...formData, is_gradient: checked })} />
              <Label>Gradient</Label>
            </div>
            {formData.is_gradient ? (
              <div className="space-y-2">
                <Label>Gradient CSS</Label>
                <Input 
                  value={formData.gradient_value} 
                  onChange={(e) => setFormData({ ...formData, gradient_value: e.target.value })} 
                  placeholder="linear-gradient(90deg, #ff0000, #00ff00)"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Màu</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={formData.color_value} 
                    onChange={(e) => setFormData({ ...formData, color_value: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <Input value={formData.color_value} onChange={(e) => setFormData({ ...formData, color_value: e.target.value })} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá (VNĐ)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label>Hiển thị</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingColor ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ EFFECTS MANAGEMENT ============
const EffectsTab = () => {
  const queryClient = useQueryClient();
  const { data: effects, isLoading } = useQuery({
    queryKey: ['admin-prime-effects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prime_effects')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEffect, setEditingEffect] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    effect_type: 'background',
    background_url: '',
    price: 0,
    is_active: true,
    sort_order: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        description: data.description,
        effect_type: data.effect_type,
        effect_config: { background_url: data.background_url },
        preview_url: data.background_url,
        price: data.price,
        is_active: data.is_active,
        sort_order: data.sort_order,
      };
      if (editingEffect) {
        const { error } = await supabase.from('prime_effects').update(payload).eq('id', editingEffect.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prime_effects').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-effects'] });
      setDialogOpen(false);
      toast.success(editingEffect ? 'Cập nhật thành công' : 'Tạo mới thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prime_effects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-effects'] });
      toast.success('Đã xóa');
    },
  });

  const handleOpenCreate = () => {
    setEditingEffect(null);
    setFormData({ name: '', description: '', effect_type: 'background', background_url: '', price: 0, is_active: true, sort_order: 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (effect: any) => {
    setEditingEffect(effect);
    setFormData({
      name: effect.name,
      description: effect.description || '',
      effect_type: effect.effect_type || 'background',
      background_url: effect.effect_config?.background_url || effect.preview_url || '',
      price: effect.price,
      is_active: effect.is_active,
      sort_order: effect.sort_order || 0,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Hiệu ứng hồ sơ</h2>
          <p className="text-sm text-muted-foreground">Hình nền trang cá nhân</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm hiệu ứng
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {effects?.map((effect) => {
          const bgUrl = (effect.effect_config as any)?.background_url;
          return (
            <Card key={effect.id} className={!effect.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Preview hình nền hồ sơ */}
                  <div 
                    className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
                    style={bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/50 border-2 border-white" />
                        <div>
                          <div className="text-white text-xs font-semibold">User Name</div>
                          <div className="text-white/70 text-[10px]">@username</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">{effect.name}</h3>
                  </div>
                  <p className="font-bold text-primary">{formatPrice(effect.price)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(effect)}>
                      <Edit className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>Bạn có chắc muốn xóa hiệu ứng này?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(effect.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEffect ? 'Sửa hiệu ứng hồ sơ' : 'Thêm hiệu ứng hồ sơ mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            {formData.background_url && (
              <div 
                className="relative h-32 rounded-lg overflow-hidden"
                style={{ backgroundImage: `url(${formData.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/50 border-2 border-white" />
                    <div>
                      <div className="text-white text-sm font-semibold">User Name</div>
                      <div className="text-white/70 text-xs">@username</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tên hiệu ứng</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <ImageUrlInput
              value={formData.background_url || ''}
              onChange={(url) => setFormData({ ...formData, background_url: url })}
              label="Hình nền"
              folder="prime-effects"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá (VNĐ)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label>Hiển thị</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)} 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingEffect ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ BENEFITS MANAGEMENT ============
const BenefitsTab = () => {
  const queryClient = useQueryClient();
  const { data: benefits, isLoading } = useQuery({
    queryKey: ['admin-prime-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prime_boost_benefits')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<any>(null);
  const [formData, setFormData] = useState({
    benefit_key: '',
    benefit_name: '',
    benefit_name_en: '',
    benefit_value: '',
    is_enabled: true,
    sort_order: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingBenefit) {
        const { error } = await supabase.from('prime_boost_benefits').update(data).eq('id', editingBenefit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prime_boost_benefits').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-benefits'] });
      setDialogOpen(false);
      toast.success(editingBenefit ? 'Cập nhật thành công' : 'Tạo mới thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prime_boost_benefits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prime-benefits'] });
      toast.success('Đã xóa');
    },
  });

  const handleOpenCreate = () => {
    setEditingBenefit(null);
    setFormData({ benefit_key: '', benefit_name: '', benefit_name_en: '', benefit_value: '', is_enabled: true, sort_order: 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (benefit: any) => {
    setEditingBenefit(benefit);
    setFormData({
      benefit_key: benefit.benefit_key || '',
      benefit_name: benefit.benefit_name || '',
      benefit_name_en: benefit.benefit_name_en || '',
      benefit_value: benefit.benefit_value || '',
      is_enabled: benefit.is_enabled,
      sort_order: benefit.sort_order || 0,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Quyền lợi Prime</h2>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm quyền lợi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits?.map((benefit) => (
          <Card key={benefit.id} className={!benefit.is_enabled ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Gift className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{benefit.benefit_name}</h3>
                  {benefit.benefit_value && <p className="text-sm text-muted-foreground">{benefit.benefit_value}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(benefit)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc muốn xóa quyền lợi này?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(benefit.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBenefit ? 'Sửa quyền lợi' : 'Thêm quyền lợi mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Key (mã định danh)</Label>
              <Input value={formData.benefit_key} onChange={(e) => setFormData({ ...formData, benefit_key: e.target.value })} placeholder="animated_avatar" />
            </div>
            <div className="space-y-2">
              <Label>Tên quyền lợi (VN)</Label>
              <Input value={formData.benefit_name} onChange={(e) => setFormData({ ...formData, benefit_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tên quyền lợi (EN)</Label>
              <Input value={formData.benefit_name_en} onChange={(e) => setFormData({ ...formData, benefit_name_en: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Giá trị/Mô tả</Label>
              <Textarea value={formData.benefit_value} onChange={(e) => setFormData({ ...formData, benefit_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Thứ tự</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_enabled} onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })} />
              <Label>Kích hoạt</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingBenefit ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ AVATAR FRAMES TAB ============
interface FrameFormData {
  name: string;
  description: string;
  image_url: string;
  price: number;
  prime_price: number | null;
  is_active: boolean;
  sort_order: number;
  avatar_border_radius: string;
}

const defaultFrameFormData: FrameFormData = {
  name: '',
  description: '',
  image_url: '',
  price: 0,
  prime_price: null,
  is_active: true,
  sort_order: 0,
  avatar_border_radius: '50%',
};

const AvatarFramesTab = () => {
  const { data: frames, isLoading } = useAllAvatarFrames();
  const createFrame = useCreateAvatarFrame();
  const updateFrame = useUpdateAvatarFrame();
  const deleteFrame = useDeleteAvatarFrame();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<any>(null);
  const [formData, setFormData] = useState<FrameFormData>(defaultFrameFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File quá lớn. Tối đa 50MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file hình ảnh');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatar-frames')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatar-frames')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Tải ảnh lên thành công');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingFrame(null);
    setFormData(defaultFrameFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (frame: any) => {
    setEditingFrame(frame);
    setFormData({
      name: frame.name,
      description: frame.description || '',
      image_url: frame.image_url,
      price: frame.price,
      prime_price: frame.prime_price,
      is_active: frame.is_active,
      sort_order: frame.sort_order,
      avatar_border_radius: frame.avatar_border_radius || '50%',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.image_url) return;

    if (editingFrame) {
      updateFrame.mutate(
        { id: editingFrame.id, ...formData },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createFrame.mutate(formData, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteFrame.mutate(id);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Khung Avatar</h2>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm khung
        </Button>
      </div>

      {frames && frames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {frames.map((frame) => (
            <Card key={frame.id} className={!frame.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="aspect-square relative mb-3 bg-secondary/50 rounded-lg flex items-center justify-center">
                  <img src={frame.image_url} alt={frame.name} className="w-full h-full object-contain p-2" />
                  {!frame.is_active && (
                    <Badge variant="secondary" className="absolute top-2 right-2">Ẩn</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold truncate">{frame.name}</h3>
                  <p className="text-lg font-bold text-primary">
                    {frame.price > 0 ? formatPrice(frame.price) : 'Miễn phí'}
                  </p>
                  {frame.prime_price !== null && frame.prime_price > 0 && (
                    <p className="text-sm text-amber-500">Prime: {formatPrice(frame.prime_price)}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(frame)}>
                      <Edit className="h-4 w-4 mr-1" /> Sửa
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>Bạn có chắc muốn xóa khung "{frame.name}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(frame.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Frame className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Chưa có khung avatar nào</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khung đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFrame ? 'Chỉnh sửa khung' : 'Thêm khung mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUrlInput
              value={formData.image_url || ''}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              label="Hình ảnh khung *"
              folder="avatar-frames"
              aspectHint="Hỗ trợ PNG, GIF"
            />
            <div className="space-y-2">
              <Label>Tên khung *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Khung Vàng VIP" />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả ngắn..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Giá (VNĐ)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} min={0} />
              </div>
              <div className="space-y-2">
                <Label>Giá Prime</Label>
                <Input type="number" value={formData.prime_price ?? ''} onChange={(e) => setFormData({ ...formData, prime_price: e.target.value ? parseInt(e.target.value) : null })} min={0} placeholder="Để trống = không giảm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Bo góc</Label>
                <Input value={formData.avatar_border_radius} onChange={(e) => setFormData({ ...formData, avatar_border_radius: e.target.value })} placeholder="50%" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              <Label>Hiển thị</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createFrame.isPending || updateFrame.isPending || !formData.name || !formData.image_url}>
              {(createFrame.isPending || updateFrame.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingFrame ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const AdminPrimeBoost = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" />
          Quản lý Prime Boost
        </h1>
        <p className="text-muted-foreground">Cấu hình gói Prime, màu tên, hiệu ứng, quyền lợi và khung avatar</p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Gói Prime</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Màu tên</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Hiệu ứng</span>
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Quyền lợi</span>
          </TabsTrigger>
          <TabsTrigger value="frames" className="gap-2">
            <Frame className="h-4 w-4" />
            <span className="hidden sm:inline">Khung</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PrimePlansTab />
        </TabsContent>

        <TabsContent value="colors">
          <NameColorsTab />
        </TabsContent>

        <TabsContent value="effects">
          <EffectsTab />
        </TabsContent>

        <TabsContent value="benefits">
          <BenefitsTab />
        </TabsContent>

        <TabsContent value="frames">
          <AvatarFramesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPrimeBoost;
