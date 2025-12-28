import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const BirthdaySettings = () => {
  const { profile, refreshProfile } = useAuth();
  const [birthday, setBirthday] = useState(
    profile?.birthday ? format(new Date(profile.birthday), 'yyyy-MM-dd') : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ birthday })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Đã cập nhật ngày sinh');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Chương trình sinh nhật
        </CardTitle>
        <CardDescription>
          Nhập ngày sinh để nhận voucher đặc biệt vào ngày sinh nhật của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Gift className="h-8 w-8 text-primary flex-shrink-0" />
          <div>
            <h4 className="font-medium">Quà sinh nhật</h4>
            <p className="text-sm text-muted-foreground">
              Mỗi năm vào ngày sinh nhật, bạn sẽ nhận được voucher giảm giá đặc biệt qua email.
              Chương trình chỉ áp dụng cho tài khoản đã xác thực ngày sinh.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday">Ngày sinh</Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <p className="text-xs text-muted-foreground">
            Lưu ý: Ngày sinh chỉ có thể thay đổi 1 lần. Vui lòng kiểm tra kỹ trước khi lưu.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading || !birthday}>
          {isLoading ? 'Đang lưu...' : 'Lưu ngày sinh'}
        </Button>
      </CardContent>
    </Card>
  );
};
