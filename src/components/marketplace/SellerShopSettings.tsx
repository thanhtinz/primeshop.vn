import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Phone, Facebook, MessageCircle, BadgeCheck, Clock, CheckCircle, DollarSign, Zap, RefreshCw, Briefcase, Lock } from 'lucide-react';
import { Seller, useUpdateSeller, useRequestVerification } from '@/hooks/useMarketplace';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface SellerShopSettingsProps {
  seller: Seller;
}

export function SellerShopSettings({ seller }: SellerShopSettingsProps) {
  const updateSeller = useUpdateSeller();
  const requestVerification = useRequestVerification();
  const { formatPrice } = useCurrency();
  const { data: minScoreSetting } = useSiteSetting('marketplace_verification_min_score');
  const minScore = minScoreSetting ? Number(minScoreSetting) : 70;
  
  const isDesignShop = seller.shop_type === 'design';
  
  const [form, setForm] = useState({
    shop_name: seller.shop_name,
    shop_description: seller.shop_description || '',
    phone: seller.phone || '',
    facebook_url: seller.facebook_url || '',
    zalo_url: seller.zalo_url || '',
    // Design shop pricing
    design_rush_delivery_fee: seller.design_rush_delivery_fee || 0,
    design_extra_revision_price: seller.design_extra_revision_price || 0,
    design_commercial_license_price: seller.design_commercial_license_price || 0,
    design_exclusive_license_price: seller.design_exclusive_license_price || 0,
  });

  const handleSave = async () => {
    try {
      await updateSeller.mutateAsync({
        id: seller.id,
        ...form
      });
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
          <CardDescription>Thông tin hiển thị trên trang shop của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên cửa hàng</Label>
              <Input
                value={form.shop_name}
                onChange={(e) => setForm(f => ({ ...f, shop_name: e.target.value }))}
                placeholder="Tên shop của bạn"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (đường dẫn)</Label>
              <Input
                value={seller.shop_slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Không thể thay đổi slug</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả cửa hàng</Label>
            <Textarea
              value={form.shop_description}
              onChange={(e) => setForm(f => ({ ...f, shop_description: e.target.value }))}
              placeholder="Giới thiệu về cửa hàng của bạn..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
          <CardDescription>Khách hàng có thể liên hệ bạn qua các kênh này</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Số điện thoại
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Zalo
              </Label>
              <Input
                value={form.zalo_url}
                onChange={(e) => setForm(f => ({ ...f, zalo_url: e.target.value }))}
                placeholder="https://zalo.me/..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </Label>
            <Input
              value={form.facebook_url}
              onChange={(e) => setForm(f => ({ ...f, facebook_url: e.target.value }))}
              placeholder="https://facebook.com/..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Design Shop Pricing Settings - Only for design shops */}
      {isDesignShop && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cài đặt giá dịch vụ
            </CardTitle>
            <CardDescription>
              Đặt giá một lần, áp dụng cho tất cả dịch vụ thiết kế của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Phí giao hàng gấp
                </Label>
                <Input
                  type="number"
                  value={form.design_rush_delivery_fee}
                  onChange={(e) => setForm(f => ({ ...f, design_rush_delivery_fee: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Phí thêm khi khách chọn giao gấp (để 0 nếu không hỗ trợ)
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Giá mua thêm lượt chỉnh sửa
                </Label>
                <Input
                  type="number"
                  value={form.design_extra_revision_price}
                  onChange={(e) => setForm(f => ({ ...f, design_extra_revision_price: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Giá cho mỗi lượt chỉnh sửa thêm (để 0 nếu không hỗ trợ)
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-500" />
                  Phí License Thương mại
                </Label>
                <Input
                  type="number"
                  value={form.design_commercial_license_price}
                  onChange={(e) => setForm(f => ({ ...f, design_commercial_license_price: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Phí cố định cho license sử dụng thương mại
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-500" />
                  Phí License Độc quyền
                </Label>
                <Input
                  type="number"
                  value={form.design_exclusive_license_price}
                  onChange={(e) => setForm(f => ({ ...f, design_exclusive_license_price: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Phí cố định cho license độc quyền
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Các giá này sẽ được áp dụng tự động cho tất cả dịch vụ thiết kế của bạn. 
                Để tắt tính năng, đặt giá = 0.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            Xác minh tích xanh
          </CardTitle>
          <CardDescription>
            Shop được xác minh sẽ có tích xanh hiển thị trên trang shop và sản phẩm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {seller.is_verified ? (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Shop đã được xác minh</p>
                <p className="text-sm text-muted-foreground">
                  Shop của bạn hiện có tích xanh xác minh
                </p>
              </div>
            </div>
          ) : seller.verification_requested_at ? (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700">Đang chờ duyệt</p>
                <p className="text-sm text-muted-foreground">
                  Yêu cầu xác minh của bạn đang được admin xem xét
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Điểm uy tín hiện tại</span>
                  <span className="font-bold text-lg">{seller.trust_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yêu cầu tối thiểu</span>
                  <span className="font-medium">{minScore}%</span>
                </div>
              </div>
              
              {seller.trust_score >= minScore ? (
                <Button 
                  onClick={async () => {
                    try {
                      await requestVerification.mutateAsync();
                      toast.success('Đã gửi yêu cầu xác minh');
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  }}
                  disabled={requestVerification.isPending}
                  className="w-full"
                >
                  {requestVerification.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-4 w-4 mr-2" />
                  )}
                  Đăng ký xác minh
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Shop cần đạt {minScore}% điểm uy tín để đăng ký xác minh.
                  Hãy tăng số lượng bán hàng và nhận đánh giá tốt từ khách hàng.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSeller.isPending} className="w-full md:w-auto">
        {updateSeller.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Lưu thay đổi
      </Button>
    </div>
  );
}
