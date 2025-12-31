import React, { useState } from 'react';
import { useSiteSettings, useUpdateMultipleSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Settings, Building2, Percent, Mail, AlertTriangle, Sparkles, Key, Shield, DollarSign, BadgeCheck, ShieldCheck } from 'lucide-react';
import { SiteAssetUploader } from '@/components/admin/SiteAssetUploader';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const AdminSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateMultipleSiteSettings();
  
  const [formData, setFormData] = useState<Record<string, any>>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(formData);
      toast.success('Đã lưu cài đặt');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Cài đặt hệ thống</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
            <TabsTrigger value="company" className="gap-1 text-xs sm:text-sm py-2">
              <Building2 className="h-4 w-4 hidden sm:block" />
              Công ty
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-1 text-xs sm:text-sm py-2">
              <DollarSign className="h-4 w-4 hidden sm:block" />
              Tiền tệ
            </TabsTrigger>
            <TabsTrigger value="oauth" className="gap-1 text-xs sm:text-sm py-2">
              <Key className="h-4 w-4 hidden sm:block" />
              OAuth
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1 text-xs sm:text-sm py-2">
              <ShieldCheck className="h-4 w-4 hidden sm:block" />
              Bảo mật
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-1 text-xs sm:text-sm py-2">
              <Percent className="h-4 w-4 hidden sm:block" />
              Giới thiệu
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1 text-xs sm:text-sm py-2">
              <Mail className="h-4 w-4 hidden sm:block" />
              Email
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1 text-xs sm:text-sm py-2">
              <AlertTriangle className="h-4 w-4 hidden sm:block" />
              Trang lỗi
            </TabsTrigger>
            <TabsTrigger value="effects" className="gap-1 text-xs sm:text-sm py-2">
              <Sparkles className="h-4 w-4 hidden sm:block" />
              Hiệu ứng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Thông tin công ty</CardTitle>
                <CardDescription>Thông tin hiển thị trên hóa đơn và website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên công ty/Website</Label>
                  <Input
                    value={formData.site_name || ''}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                    placeholder="Tên công ty hoặc website"
                  />
                </div>
                <SiteAssetUploader
                  label="Logo"
                  value={formData.site_logo || ''}
                  onChange={(url) => setFormData({ ...formData, site_logo: url })}
                  assetType="logo"
                  description="Logo hiển thị trên header và các trang của website"
                  previewSize="medium"
                />
                <SiteAssetUploader
                  label="Favicon"
                  value={formData.site_favicon || ''}
                  onChange={(url) => setFormData({ ...formData, site_favicon: url })}
                  assetType="favicon"
                  description="Icon hiển thị trên tab trình duyệt (khuyến nghị: 32x32 hoặc 64x64 pixel)"
                  previewSize="small"
                />
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Textarea
                    value={formData.company_address || ''}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={formData.company_phone || ''}
                      onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                      placeholder="0909 123 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email hỗ trợ</Label>
                    <Input
                      type="email"
                      value={formData.support_email || ''}
                      onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Cài đặt thuế</CardTitle>
                <CardDescription>Cấu hình tỷ lệ thuế áp dụng cho đơn hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tỷ lệ thuế (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax_rate || 0}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="VD: 10 = 10% thuế"
                  />
                  <p className="text-sm text-muted-foreground">
                    Thuế sẽ được tính trên tổng đơn hàng sau khi áp dụng giảm giá VIP
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tiền tệ & Tỷ giá
                </CardTitle>
                <CardDescription>Cấu hình tỷ giá quy đổi VND/USD cho thanh toán quốc tế</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tỷ giá USD (1 USD = ? VNĐ)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.usd_exchange_rate || 24500}
                    onChange={(e) => setFormData({ ...formData, usd_exchange_rate: parseInt(e.target.value) || 24500 })}
                    placeholder="VD: 24500"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tỷ giá này được sử dụng khi người dùng chọn thanh toán bằng USD qua PayPal
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-2">Lưu ý:</p>
                  <p className="text-muted-foreground">
                    Để cấu hình cổng thanh toán PayOS và PayPal, vui lòng truy cập{' '}
                    <a href="/admin/payments" className="text-primary underline">Quản lý thanh toán</a>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5" />
                  Xác minh Shop
                </CardTitle>
                <CardDescription>Cấu hình điều kiện xác minh cửa hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Điểm uy tín tối thiểu để xác minh</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.marketplace_verification_min_score || 70}
                    onChange={(e) => setFormData({ ...formData, marketplace_verification_min_score: parseInt(e.target.value) || 70 })}
                    placeholder="VD: 70"
                  />
                  <p className="text-sm text-muted-foreground">
                    Shop cần đạt điểm uy tín này để đăng ký xác minh tích xanh.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Phí sàn và phí rút tiền được cấu hình tại <a href="/admin/marketplace" className="text-primary underline">Quản lý Chợ → Cài đặt</a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4 mt-4">
            {/* Social Login Toggles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Đăng nhập mạng xã hội
                </CardTitle>
                <CardDescription>Quản lý phương thức đăng nhập trên trang login</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Google Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Google</p>
                      <p className="text-xs text-muted-foreground truncate">Đăng nhập bằng tài khoản Google</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.google_login_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, google_login_enabled: checked })}
                  />
                </div>
                
                {/* Discord Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center shadow-sm">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Discord</p>
                      <p className="text-xs text-muted-foreground truncate">Đăng nhập bằng tài khoản Discord</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.discord_login_enabled ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, discord_login_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* OAuth Configurations Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Google OAuth */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base">Google OAuth</CardTitle>
                      <CardDescription className="text-xs">Cấu hình credentials</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      value={formData.google_client_id || ''}
                      onChange={(e) => setFormData({ ...formData, google_client_id: e.target.value })}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type="password"
                      value={formData.google_client_secret || ''}
                      onChange={(e) => setFormData({ ...formData, google_client_secret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5">
                    <p className="font-medium text-foreground">Hướng dẫn:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                      <li>Tạo OAuth 2.0 Client ID</li>
                      <li className="break-all">Redirect URI: <code className="bg-background px-1 rounded text-[10px]">https://wlfytumovijolhtlnilu.supabase.co/auth/v1/callback</code></li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Discord OAuth */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center shadow-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base">Discord OAuth</CardTitle>
                      <CardDescription className="text-xs">Cấu hình credentials</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      value={formData.discord_client_id || ''}
                      onChange={(e) => setFormData({ ...formData, discord_client_id: e.target.value })}
                      placeholder="Application Client ID"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type="password"
                      value={formData.discord_client_secret || ''}
                      onChange={(e) => setFormData({ ...formData, discord_client_secret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5">
                    <p className="font-medium text-foreground">Hướng dẫn:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li><a href="https://discord.com/developers/applications" target="_blank" className="text-primary hover:underline">Discord Developer Portal</a></li>
                      <li>Tạo hoặc chọn Application</li>
                      <li className="break-all">Redirect URI: <code className="bg-background px-1 rounded text-[10px]">https://wlfytumovijolhtlnilu.supabase.co/auth/v1/callback</code></li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Lưu ý:</strong> Sau khi cấu hình, vào Lovable Cloud → Users → Auth Settings để kích hoạt provider.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            {/* Captcha Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Captcha (Cloudflare Turnstile)
                </CardTitle>
                <CardDescription>Bảo vệ form đăng nhập/đăng ký khỏi bot và spam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Bật Captcha</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu người dùng xác minh captcha khi đăng nhập/đăng ký
                    </p>
                  </div>
                  <Switch
                    checked={formData.captcha_enabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, captcha_enabled: checked })}
                  />
                </div>

                {/* Captcha Provider */}
                <div className="space-y-2">
                  <Label>Nhà cung cấp Captcha</Label>
                  <Select
                    value={formData.captcha_provider || 'turnstile'}
                    onValueChange={(value) => setFormData({ ...formData, captcha_provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhà cung cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="turnstile">Cloudflare Turnstile (Khuyến nghị)</SelectItem>
                      <SelectItem value="recaptcha">Google reCAPTCHA v2</SelectItem>
                      <SelectItem value="hcaptcha">hCaptcha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Site Key */}
                <div className="space-y-2">
                  <Label>Site Key</Label>
                  <Input
                    value={formData.captcha_site_key || ''}
                    onChange={(e) => setFormData({ ...formData, captcha_site_key: e.target.value })}
                    placeholder="0x4AAAAAACHeVNTAamAr7dFd"
                  />
                  <p className="text-xs text-muted-foreground">
                    Site key hiển thị công khai trên form đăng nhập
                  </p>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    value={formData.captcha_secret_key || ''}
                    onChange={(e) => setFormData({ ...formData, captcha_secret_key: e.target.value })}
                    placeholder="0x4AAAAAACHeVNT..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Secret key dùng để xác minh captcha phía server (giữ bí mật)
                  </p>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                  <p className="font-medium text-foreground">Hướng dẫn cấu hình Cloudflare Turnstile:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Truy cập <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" className="text-primary hover:underline">Cloudflare Dashboard → Turnstile</a></li>
                    <li>Tạo widget mới với domain của bạn</li>
                    <li>Sao chép Site Key và Secret Key vào form trên</li>
                    <li>Chọn Widget Type: <code className="bg-background px-1 rounded">Managed</code> (khuyến nghị)</li>
                  </ol>
                </div>

                {/* Captcha Mode */}
                <div className="space-y-2">
                  <Label>Chế độ Captcha</Label>
                  <Select
                    value={formData.captcha_mode || 'always'}
                    onValueChange={(value) => setFormData({ ...formData, captcha_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chế độ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Luôn hiển thị</SelectItem>
                      <SelectItem value="suspicious">Chỉ khi nghi ngờ</SelectItem>
                      <SelectItem value="login_only">Chỉ trang đăng nhập</SelectItem>
                      <SelectItem value="signup_only">Chỉ trang đăng ký</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Chọn khi nào hiển thị captcha cho người dùng
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Security Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Tùy chọn bảo mật khác</CardTitle>
                <CardDescription>Các cài đặt bảo mật bổ sung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rate Limiting */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Giới hạn số lần đăng nhập sai</p>
                    <p className="text-xs text-muted-foreground">Khóa tài khoản sau 5 lần đăng nhập thất bại</p>
                  </div>
                  <Switch
                    checked={formData.login_rate_limit_enabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, login_rate_limit_enabled: checked })}
                  />
                </div>

                {/* Require Email Verification */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Yêu cầu xác minh email</p>
                    <p className="text-xs text-muted-foreground">Người dùng phải xác minh email trước khi đăng nhập</p>
                  </div>
                  <Switch
                    checked={formData.require_email_verification ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, require_email_verification: checked })}
                  />
                </div>

                {/* Session Timeout */}
                <div className="space-y-2">
                  <Label>Thời gian hết hạn phiên đăng nhập (phút)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="10080"
                    value={formData.session_timeout_minutes || 1440}
                    onChange={(e) => setFormData({ ...formData, session_timeout_minutes: parseInt(e.target.value) || 1440 })}
                    placeholder="1440"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mặc định: 1440 phút (24 giờ). Tối đa: 10080 phút (7 ngày)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Cài đặt giới thiệu</CardTitle>
                <CardDescription>Cấu hình chương trình giới thiệu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phần trăm hoa hồng (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.referral_commission_percent || 0}
                    onChange={(e) => setFormData({ ...formData, referral_commission_percent: parseFloat(e.target.value) || 0 })}
                    placeholder="VD: 5 = 5% giá trị đơn hàng"
                  />
                  <p className="text-sm text-muted-foreground">
                    Người giới thiệu nhận được % này từ giá trị đơn hàng khi có người mua bằng mã của họ
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Số tiền tối thiểu để rút thưởng (VNĐ)</Label>
                  <Input
                    type="number"
                    value={formData.min_reward_redemption || 0}
                    onChange={(e) => setFormData({ ...formData, min_reward_redemption: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Cài đặt Email SMTP</CardTitle>
                <CardDescription>Cấu hình máy chủ SMTP để gửi email tự động</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={formData.secret_smtp_host || ''}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Gmail: smtp.gmail.com | Outlook: smtp.office365.com
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      value={formData.secret_smtp_port || '587'}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_port: e.target.value })}
                      placeholder="587"
                    />
                    <p className="text-xs text-muted-foreground">
                      TLS: 587 | SSL: 465
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input
                      value={formData.secret_smtp_user || ''}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_user: e.target.value })}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password / App Password</Label>
                    <Input
                      type="password"
                      value={formData.secret_smtp_pass || ''}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_pass: e.target.value })}
                      placeholder="••••••••••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      Gmail cần dùng App Password (16 ký tự)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên hiển thị khi gửi</Label>
                    <Input
                      value={formData.secret_smtp_from_name || ''}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_from_name: e.target.value })}
                      placeholder="Prime Shop"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email gửi đi</Label>
                    <Input
                      type="email"
                      value={formData.secret_smtp_from_email || ''}
                      onChange={(e) => setFormData({ ...formData, secret_smtp_from_email: e.target.value })}
                      placeholder="noreply@yoursite.com"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp_secure"
                    checked={formData.secret_smtp_secure === 'true'}
                    onCheckedChange={(checked) => setFormData({ ...formData, secret_smtp_secure: checked ? 'true' : 'false' })}
                  />
                  <Label htmlFor="smtp_secure">Sử dụng SSL/TLS (bật nếu dùng port 465)</Label>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">📧 Hướng dẫn cấu hình Gmail:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                    <li>Bật xác minh 2 bước tại <a href="https://myaccount.google.com/security" target="_blank" className="underline">Google Account</a></li>
                    <li>Tạo App Password tại <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">App Passwords</a></li>
                    <li>Sử dụng App Password (16 ký tự, không có dấu cách) thay cho mật khẩu Gmail</li>
                    <li>Host: smtp.gmail.com | Port: 587 | Secure: Tắt</li>
                  </ol>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/email/test', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                        }
                      });
                      const result = await response.json();
                      if (result.success) {
                        toast.success('Kết nối SMTP thành công!');
                      } else {
                        toast.error('Lỗi kết nối: ' + result.error);
                      }
                    } catch (error) {
                      toast.error('Không thể test kết nối SMTP');
                    }
                  }}
                >
                  🔌 Test kết nối SMTP
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Trang 404 - Không tìm thấy</CardTitle>
                <CardDescription>Tùy chỉnh nội dung trang lỗi 404</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề lớn</Label>
                    <Input
                      value={formData.error_404_title || ''}
                      onChange={(e) => setFormData({ ...formData, error_404_title: e.target.value })}
                      placeholder="404"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiêu đề phụ</Label>
                    <Input
                      value={formData.error_404_heading || ''}
                      onChange={(e) => setFormData({ ...formData, error_404_heading: e.target.value })}
                      placeholder="Trang không tồn tại"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Thông điệp</Label>
                  <Textarea
                    value={formData.error_404_message || ''}
                    onChange={(e) => setFormData({ ...formData, error_404_message: e.target.value })}
                    placeholder="Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị xóa."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text nút</Label>
                    <Input
                      value={formData.error_404_button || ''}
                      onChange={(e) => setFormData({ ...formData, error_404_button: e.target.value })}
                      placeholder="Về trang chủ"
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUrlInput
                      value={formData.error_404_image || ''}
                      onChange={(url) => setFormData({ ...formData, error_404_image: url })}
                      label="Hình ảnh trang 404 (tùy chọn)"
                      folder="site-assets"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Trang bảo trì</CardTitle>
                <CardDescription>Bật/tắt chế độ bảo trì và tùy chỉnh nội dung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Chế độ bảo trì</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi bật, người dùng sẽ thấy trang bảo trì thay vì website
                    </p>
                  </div>
                  <Switch
                    checked={formData.maintenance_mode || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input
                    value={formData.maintenance_title || ''}
                    onChange={(e) => setFormData({ ...formData, maintenance_title: e.target.value })}
                    placeholder="Đang bảo trì"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thông điệp</Label>
                  <Textarea
                    value={formData.maintenance_message || ''}
                    onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
                    placeholder="Chúng tôi đang nâng cấp hệ thống. Vui lòng quay lại sau."
                    rows={2}
                  />
                </div>
                <ImageUrlInput
                  value={formData.maintenance_image || ''}
                  onChange={(url) => setFormData({ ...formData, maintenance_image: url })}
                  label="Hình ảnh trang bảo trì (tùy chọn)"
                  folder="site-assets"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Hiệu ứng hạt theo mùa</CardTitle>
                <CardDescription>Cấu hình hiệu ứng hạt trang trí cho các dịp lễ khác nhau</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Bật hiệu ứng</Label>
                    <p className="text-sm text-muted-foreground">
                      Hiển thị hiệu ứng hạt trên toàn bộ website
                    </p>
                  </div>
                  <Switch
                    checked={(formData.seasonal_particles as any)?.enabled || false}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      seasonal_particles: { 
                        ...(formData.seasonal_particles as any || {}), 
                        enabled: checked 
                      } 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Loại hiệu ứng</Label>
                  <Select
                    value={(formData.seasonal_particles as any)?.type || 'snow'}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      seasonal_particles: { 
                        ...(formData.seasonal_particles as any || {}), 
                        type: value 
                      } 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại hiệu ứng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snow">❄️ Tuyết rơi (Giáng sinh/Mùa đông)</SelectItem>
                      <SelectItem value="hearts">❤️ Tim bay (Valentine)</SelectItem>
                      <SelectItem value="leaves">🍂 Lá rụng (Mùa thu)</SelectItem>
                      <SelectItem value="stars">⭐ Ngôi sao (Năm mới)</SelectItem>
                      <SelectItem value="confetti">🎉 Hoa giấy (Lễ hội)</SelectItem>
                      <SelectItem value="sakura">🌸 Hoa anh đào (Mùa xuân)</SelectItem>
                      <SelectItem value="fireworks">🎆 Pháo hoa (Tết)</SelectItem>
                      <SelectItem value="none">Không hiệu ứng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Particle Image */}
                <ImageUrlInput
                  value={(formData.seasonal_particles as any)?.customImage || ''}
                  onChange={(url) => setFormData({ 
                    ...formData, 
                    seasonal_particles: { 
                      ...(formData.seasonal_particles as any || {}), 
                      customImage: url 
                    } 
                  })}
                  label="Ảnh hạt custom (tùy chọn)"
                  folder="site-assets"
                  aspectHint="Ảnh PNG/SVG trong suốt, kích thước khuyến nghị 32x32 - 64x64px"
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Số lượng hạt</Label>
                    <span className="text-sm text-muted-foreground">{(formData.seasonal_particles as any)?.count || 50}</span>
                  </div>
                  <Slider
                    value={[(formData.seasonal_particles as any)?.count || 50]}
                    onValueChange={([value]) => setFormData({ 
                      ...formData, 
                      seasonal_particles: { 
                        ...(formData.seasonal_particles as any || {}), 
                        count: value 
                      } 
                    })}
                    min={10}
                    max={150}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">Số lượng hạt hiển thị (10-150)</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tốc độ</Label>
                    <span className="text-sm text-muted-foreground">{(formData.seasonal_particles as any)?.speed || 1}x</span>
                  </div>
                  <Slider
                    value={[(formData.seasonal_particles as any)?.speed || 1]}
                    onValueChange={([value]) => setFormData({ 
                      ...formData, 
                      seasonal_particles: { 
                        ...(formData.seasonal_particles as any || {}), 
                        speed: value 
                      } 
                    })}
                    min={0.5}
                    max={3}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">Tốc độ rơi của hạt (0.5x - 3x)</p>
                </div>

                {/* Preview */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Xem trước:</p>
                  <div className="flex items-center gap-2 text-2xl">
                    {((formData.seasonal_particles as any)?.type || 'snow') === 'snow' && '❄️ ❅ ❆ ✧'}
                    {(formData.seasonal_particles as any)?.type === 'hearts' && '❤️ 💕 💖 💗'}
                    {(formData.seasonal_particles as any)?.type === 'leaves' && '🍂 🍁 🍃 🌿'}
                    {(formData.seasonal_particles as any)?.type === 'stars' && '⭐ ✨ 💫 🌟'}
                    {(formData.seasonal_particles as any)?.type === 'confetti' && '🎉 🎊 ✨ 🎈'}
                    {(formData.seasonal_particles as any)?.type === 'sakura' && '🌸 💮 🌺 ✿'}
                    {(formData.seasonal_particles as any)?.type === 'fireworks' && '🎆 🎇 ✨ 💥'}
                    {(formData.seasonal_particles as any)?.type === 'none' && '(Không có hiệu ứng)'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending} className="w-full sm:w-auto">
            {updateSettings.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
