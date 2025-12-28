import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, FileText, AlertTriangle, Save, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCompactNumber } from '@/lib/utils';

interface NDASettings {
  requires_nda: boolean;
  no_portfolio_use: boolean;
  confidentiality_period_days: number;
  nda_fee: number;
  violation_penalty: number;
  custom_terms: string;
}

export default function SellerDesignNDAPage() {
  const { seller } = useOutletContext<any>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NDASettings>({
    requires_nda: false,
    no_portfolio_use: false,
    confidentiality_period_days: 365,
    nda_fee: 0,
    violation_penalty: 0,
    custom_terms: '',
  });

  useEffect(() => {
    if (seller?.id) {
      loadSettings();
    }
  }, [seller?.id]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('design_seller_nda_settings' as any)
        .select('*')
        .eq('seller_id', seller.id)
        .maybeSingle();

      if (data) {
        setSettings({
          requires_nda: (data as any).requires_nda || false,
          no_portfolio_use: (data as any).no_portfolio_use || false,
          confidentiality_period_days: (data as any).confidentiality_period_days || 365,
          nda_fee: (data as any).nda_fee || 0,
          violation_penalty: (data as any).violation_penalty || 0,
          custom_terms: (data as any).custom_terms || '',
        });
      }
    } catch (error) {
      console.error('Error loading NDA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!seller?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('design_seller_nda_settings' as any)
        .upsert({
          seller_id: seller.id,
          ...settings,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: 'seller_id',
        });

      if (error) throw error;
      toast.success('Đã lưu cài đặt NDA');
    } catch (error) {
      console.error('Error saving NDA settings:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (!seller) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cài đặt NDA & Bảo mật</h1>
            <p className="text-muted-foreground">Quản lý thỏa thuận bảo mật cho dịch vụ thiết kế</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">NDA là gì?</p>
            <p className="text-muted-foreground">
              NDA (Non-Disclosure Agreement) là thỏa thuận bảo mật thông tin. 
              Khi buyer chọn NDA, cả hai bên cam kết không tiết lộ thông tin dự án cho bên thứ ba.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* NDA Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Cho phép NDA
            </CardTitle>
            <CardDescription>
              Cho phép buyer yêu cầu NDA khi đặt hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Kích hoạt tùy chọn NDA</Label>
              <Switch
                checked={settings.requires_nda}
                onCheckedChange={(checked) => setSettings({ ...settings, requires_nda: checked })}
              />
            </div>
            
            {settings.requires_nda && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Phí NDA (VND)</Label>
                  <Input
                    type="number"
                    value={settings.nda_fee}
                    onChange={(e) => setSettings({ ...settings, nda_fee: parseInt(e.target.value) || 0 })}
                    placeholder="0 = Miễn phí"
                  />
                  <p className="text-xs text-muted-foreground">
                    Phí thêm khi buyer chọn NDA. Để 0 nếu miễn phí.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quyền sử dụng Portfolio
            </CardTitle>
            <CardDescription>
              Cho phép buyer yêu cầu không đăng portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Cho phép tùy chọn không portfolio</Label>
              <Switch
                checked={settings.no_portfolio_use}
                onCheckedChange={(checked) => setSettings({ ...settings, no_portfolio_use: checked })}
              />
            </div>
            
            {settings.no_portfolio_use && (
              <div className="pt-4 border-t">
                <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Buyer có thể yêu cầu bạn không đăng sản phẩm lên portfolio
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confidentiality Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thời hạn bảo mật</CardTitle>
            <CardDescription>
              Thời gian cam kết giữ bí mật thông tin dự án
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Số ngày bảo mật</Label>
              <Input
                type="number"
                value={settings.confidentiality_period_days}
                onChange={(e) => setSettings({ ...settings, confidentiality_period_days: parseInt(e.target.value) || 365 })}
              />
              <p className="text-xs text-muted-foreground">
                Thông thường là 365 ngày (1 năm) hoặc vĩnh viễn (9999 ngày)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Violation Penalty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Phạt vi phạm
            </CardTitle>
            <CardDescription>
              Số tiền phạt nếu vi phạm NDA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mức phạt (VND)</Label>
              <Input
                type="number"
                value={settings.violation_penalty}
                onChange={(e) => setSettings({ ...settings, violation_penalty: parseInt(e.target.value) || 0 })}
              />
              {settings.violation_penalty > 0 && (
                <p className="text-sm font-medium text-destructive">
                  Mức phạt: {formatCompactNumber(settings.violation_penalty)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Terms */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Điều khoản bổ sung</CardTitle>
            <CardDescription>
              Thêm điều khoản riêng cho NDA của bạn (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.custom_terms}
              onChange={(e) => setSettings({ ...settings, custom_terms: e.target.value })}
              placeholder="VD: Bên nhận thông tin cam kết không sao chép, chia sẻ hoặc sử dụng thông tin cho mục đích khác..."
              rows={5}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
