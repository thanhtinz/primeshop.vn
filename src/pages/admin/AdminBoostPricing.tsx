import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Rocket, TrendingUp, Star, Pin } from 'lucide-react';

interface BoostPricing {
  id: string;
  boost_type: string;
  price_per_day: number;
  is_active: boolean;
}

const boostTypeLabels: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  marketplace_top: {
    label: 'Top Marketplace',
    description: 'Hiển thị sản phẩm ở đầu trang chợ',
    icon: <Rocket className="h-5 w-5 text-orange-500" />,
  },
  category_top: {
    label: 'Top Danh mục',
    description: 'Hiển thị đầu danh mục sản phẩm',
    icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
  },
  recommended: {
    label: 'Đề xuất',
    description: 'Hiển thị trong phần sản phẩm đề xuất',
    icon: <Star className="h-5 w-5 text-yellow-500" />,
  },
  shop_featured: {
    label: 'Nổi bật trong Shop',
    description: 'Ghim sản phẩm nổi bật trong shop (miễn phí)',
    icon: <Pin className="h-5 w-5 text-green-500" />,
  },
};

const AdminBoostPricing = () => {
  const queryClient = useQueryClient();
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  const { data: pricings, isLoading } = useQuery({
    queryKey: ['admin-boost-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boost_pricing')
        .select('*')
        .order('price_per_day', { ascending: true });

      if (error) throw error;
      return data as BoostPricing[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, price, isActive }: { id: string; price?: number; isActive?: boolean }) => {
      const updateData: Partial<BoostPricing> = {};
      if (price !== undefined) updateData.price_per_day = price;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { error } = await supabase
        .from('boost_pricing')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-boost-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['boost-pricing'] });
      toast.success('Đã cập nhật giá');
    },
    onError: () => {
      toast.error('Lỗi cập nhật');
    },
  });

  const handleSavePrice = (id: string) => {
    const newPrice = editingPrices[id];
    if (newPrice !== undefined) {
      updateMutation.mutate({ id, price: newPrice });
      setEditingPrices(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cấu hình giá Boost sản phẩm</h1>
        <p className="text-muted-foreground">Thiết lập giá thuê ghim sản phẩm cho các vị trí khác nhau</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pricings?.map((pricing) => {
          const typeInfo = boostTypeLabels[pricing.boost_type] || {
            label: pricing.boost_type,
            description: '',
            icon: null,
          };

          return (
            <Card key={pricing.id} className={!pricing.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {typeInfo.icon}
                    <div>
                      <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
                    </div>
                  </div>
                  <Badge variant={pricing.is_active ? 'default' : 'secondary'}>
                    {pricing.is_active ? 'Đang hoạt động' : 'Tắt'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Giá mỗi ngày (VNĐ)</Label>
                    <Input
                      type="number"
                      value={editingPrices[pricing.id] ?? pricing.price_per_day}
                      onChange={(e) => setEditingPrices(prev => ({
                        ...prev,
                        [pricing.id]: Number(e.target.value),
                      }))}
                      className="mt-1"
                    />
                  </div>
                  {editingPrices[pricing.id] !== undefined && (
                    <Button
                      size="sm"
                      onClick={() => handleSavePrice(pricing.id)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Lưu
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Kích hoạt</Label>
                  <Switch
                    checked={pricing.is_active}
                    onCheckedChange={(checked) => updateMutation.mutate({ id: pricing.id, isActive: checked })}
                  />
                </div>

                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <p>Giá hiển thị: <span className="font-medium text-foreground">
                    {pricing.price_per_day.toLocaleString('vi-VN')}đ/ngày
                  </span></p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminBoostPricing;
