import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  useSellerRiskSettings, 
  useUpsertRiskSettings,
  type SellerRiskSettings as RiskSettingsType,
  type BuyerRiskScore
} from '@/hooks/useSellerRiskControl';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, UserX, Clock, Ban, Loader2 } from 'lucide-react';

interface SellerRiskSettingsProps {
  sellerId: string;
}

// Hook to get high risk buyers
const useHighRiskBuyers = () => {
  return useQuery({
    queryKey: ['high-risk-buyers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_risk_scores')
        .select('*')
        .eq('is_high_risk', true)
        .order('risk_score', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BuyerRiskScore[];
    }
  });
};

export const SellerRiskSettings = ({ sellerId }: SellerRiskSettingsProps) => {
  const { data: settings, isLoading: isLoadingSettings } = useSellerRiskSettings(sellerId);
  const { data: highRiskBuyers, isLoading: isLoadingBuyers } = useHighRiskBuyers();
  const upsertSettings = useUpsertRiskSettings();

  const [formData, setFormData] = useState({
    block_new_buyers: false,
    new_buyer_threshold_days: 7,
    block_disputed_buyers: false,
    max_disputes_allowed: 2,
    max_concurrent_orders: 5,
    delay_delivery_for_risky: false,
    delay_minutes: 0,
    require_phone_verified: false,
    require_email_verified: true,
    min_buyer_completed_orders: 0,
    blacklisted_countries: [] as string[]
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        block_new_buyers: settings.block_new_buyers,
        new_buyer_threshold_days: settings.new_buyer_threshold_days,
        block_disputed_buyers: settings.block_disputed_buyers,
        max_disputes_allowed: settings.max_disputes_allowed,
        max_concurrent_orders: settings.max_concurrent_orders,
        delay_delivery_for_risky: settings.delay_delivery_for_risky,
        delay_minutes: settings.delay_minutes,
        require_phone_verified: settings.require_phone_verified,
        require_email_verified: settings.require_email_verified,
        min_buyer_completed_orders: settings.min_buyer_completed_orders,
        blacklisted_countries: settings.blacklisted_countries
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await upsertSettings.mutateAsync({
      seller_id: sellerId,
      block_new_buyers: formData.block_new_buyers,
      new_buyer_threshold_days: formData.new_buyer_threshold_days,
      block_disputed_buyers: formData.block_disputed_buyers,
      max_disputes_allowed: formData.max_disputes_allowed,
      max_concurrent_orders: formData.max_concurrent_orders,
      delay_delivery_for_risky: formData.delay_delivery_for_risky,
      delay_minutes: formData.delay_minutes,
      require_phone_verified: formData.require_phone_verified,
      require_email_verified: formData.require_email_verified,
      min_buyer_completed_orders: formData.min_buyer_completed_orders,
      blacklisted_countries: formData.blacklisted_countries
    });
  };

  if (isLoadingSettings) {
    return <p className="text-muted-foreground">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kiểm soát rủi ro</h3>
          <p className="text-sm text-muted-foreground">
            Thiết lập các quy tắc để bảo vệ shop khỏi giao dịch rủi ro
          </p>
        </div>
        <Button onClick={handleSave} disabled={upsertSettings.isPending}>
          {upsertSettings.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserX className="h-5 w-5" />
              Chặn tài khoản mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chặn tài khoản mới</p>
                <p className="text-sm text-muted-foreground">Không cho phép tài khoản mới mua hàng</p>
              </div>
              <Switch
                checked={formData.block_new_buyers}
                onCheckedChange={(checked) => setFormData({ ...formData, block_new_buyers: checked })}
              />
            </div>

            {formData.block_new_buyers && (
              <div>
                <label className="text-sm font-medium">Yêu cầu tuổi tài khoản tối thiểu (ngày)</label>
                <Input
                  type="number"
                  value={formData.new_buyer_threshold_days}
                  onChange={(e) => setFormData({ ...formData, new_buyer_threshold_days: parseInt(e.target.value) || 7 })}
                  min={1}
                  max={365}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-5 w-5" />
              Chặn buyer có dispute
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chặn buyer có dispute</p>
                <p className="text-sm text-muted-foreground">Chặn người mua có lịch sử dispute</p>
              </div>
              <Switch
                checked={formData.block_disputed_buyers}
                onCheckedChange={(checked) => setFormData({ ...formData, block_disputed_buyers: checked })}
              />
            </div>

            {formData.block_disputed_buyers && (
              <div>
                <label className="text-sm font-medium">Số dispute tối đa cho phép</label>
                <Input
                  type="number"
                  value={formData.max_disputes_allowed}
                  onChange={(e) => setFormData({ ...formData, max_disputes_allowed: parseInt(e.target.value) || 2 })}
                  min={0}
                  max={10}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Giới hạn đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Số đơn đồng thời tối đa / buyer</label>
                <Input
                  type="number"
                  value={formData.max_concurrent_orders}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_orders: parseInt(e.target.value) || 5 })}
                min={1}
                max={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Giới hạn số đơn chưa hoàn thành mỗi buyer có thể đặt
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Delay giao acc (phút)</label>
                <Input
                  type="number"
                  value={formData.delay_minutes}
                  onChange={(e) => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
                min={0}
                max={1440}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Trì hoãn giao acc cho buyer rủi ro cao
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Xác thực buyer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Yêu cầu xác thực email</p>
                <p className="text-sm text-muted-foreground">Buyer phải xác thực email</p>
              </div>
              <Switch
                checked={formData.require_email_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, require_email_verified: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Yêu cầu xác thực SĐT</p>
                <p className="text-sm text-muted-foreground">Buyer phải xác thực số điện thoại</p>
              </div>
              <Switch
                checked={formData.require_phone_verified}
                onCheckedChange={(checked) => setFormData({ ...formData, require_phone_verified: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" />
              Yêu cầu bổ sung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delay giao acc cho buyer rủi ro</p>
                <p className="text-sm text-muted-foreground">
                  Trì hoãn giao acc tự động nếu buyer có risk score cao
                </p>
              </div>
              <Switch
                checked={formData.delay_delivery_for_risky}
                onCheckedChange={(checked) => setFormData({ ...formData, delay_delivery_for_risky: checked })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Số đơn hoàn thành tối thiểu</label>
              <Input
                type="number"
                value={formData.min_buyer_completed_orders}
                onChange={(e) => setFormData({ ...formData, min_buyer_completed_orders: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Buyer phải có ít nhất N đơn hoàn thành trước khi mua
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High risk buyers list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Buyer rủi ro cao
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBuyers ? (
            <p className="text-muted-foreground">Đang tải...</p>
          ) : highRiskBuyers && highRiskBuyers.length > 0 ? (
            <div className="space-y-3">
              {highRiskBuyers.map((buyer) => (
                <div key={buyer.id} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div>
                    <p className="font-medium">{buyer.buyer_id.slice(0, 8)}...</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{buyer.total_orders || 0} đơn</span>
                      <span>•</span>
                      <span>{buyer.disputed_orders || 0} dispute</span>
                      <span>•</span>
                      <span>{buyer.cancelled_orders || 0} hủy</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{buyer.risk_score || 0}</p>
                      <p className="text-xs text-muted-foreground">Điểm rủi ro</p>
                    </div>
                    <Badge variant="destructive">Rủi ro cao</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Không có buyer rủi ro cao
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
