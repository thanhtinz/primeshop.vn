import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useShopBranding, useUpsertShopBranding, useGenerateShopQR, themePresets, applyThemePreset, type ShopBranding } from '@/hooks/useShopBranding';
import { useUpdateSeller, Seller } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Layout, Image, QrCode, Loader2, Store, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SellerBrandingSettingsProps {
  sellerId: string;
  shopSlug: string;
  seller?: Seller;
}

export const SellerBrandingSettings = ({ sellerId, shopSlug, seller }: SellerBrandingSettingsProps) => {
  const { data: branding, isLoading } = useShopBranding(sellerId);
  const upsertBranding = useUpsertShopBranding();
  const updateSeller = useUpdateSeller();
  const generateQR = useGenerateShopQR();

  const [formData, setFormData] = useState<Partial<ShopBranding>>({
    theme_preset: 'default',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    background_color: null,
    text_color: null,
    font_family: 'system-ui',
    banner_type: 'image',
    banner_url: null,
    banner_video_url: null,
    layout_style: 'grid',
    show_seller_avatar: true,
    show_stats: true,
    show_badges: true,
    custom_css: null,
    subdomain: null
  });

  const [qrData, setQrData] = useState<{ qrUrl: string; shopUrl: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData(branding);
    }
  }, [branding]);

  const handleSave = async () => {
    await upsertBranding.mutateAsync({
      seller_id: sellerId,
      theme_preset: formData.theme_preset || 'default',
      primary_color: formData.primary_color || '#3B82F6',
      secondary_color: formData.secondary_color || '#10B981',
      background_color: formData.background_color,
      text_color: formData.text_color,
      font_family: formData.font_family || 'system-ui',
      banner_type: formData.banner_type || 'image',
      banner_url: formData.banner_url,
      banner_video_url: formData.banner_video_url,
      layout_style: formData.layout_style || 'grid',
      show_seller_avatar: formData.show_seller_avatar ?? true,
      show_stats: formData.show_stats ?? true,
      show_badges: formData.show_badges ?? true,
      custom_css: formData.custom_css,
      qr_code_url: formData.qr_code_url,
      subdomain: formData.subdomain
    });
  };

  const handleApplyPreset = (preset: keyof typeof themePresets) => {
    const presetData = applyThemePreset(preset);
    setFormData({ ...formData, ...presetData });
  };

  const handleGenerateQR = async () => {
    const result = await generateQR.mutateAsync({ sellerId, shopSlug });
    setQrData(result);
  };
  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sellerId}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      // Update seller record
      await updateSeller.mutateAsync({
        id: sellerId,
        [type === 'avatar' ? 'shop_avatar_url' : 'shop_banner_url']: publicUrl
      });

      // Also update branding banner if it's a banner
      if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_url: publicUrl }));
      }
      
      toast.success(`Cập nhật ${type === 'avatar' ? 'ảnh đại diện' : 'banner'} thành công`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Đang tải...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Giao diện & Hình ảnh Shop</h3>
          <p className="text-sm text-muted-foreground">
            Tùy chỉnh giao diện, hình ảnh và thương hiệu cho shop của bạn
          </p>
        </div>
        <Button onClick={handleSave} disabled={upsertBranding.isPending}>
          {upsertBranding.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="images" className="text-xs sm:text-sm">Hình ảnh</TabsTrigger>
          <TabsTrigger value="theme" className="text-xs sm:text-sm">Theme</TabsTrigger>
          <TabsTrigger value="layout" className="text-xs sm:text-sm">Layout</TabsTrigger>
          <TabsTrigger value="qr" className="text-xs sm:text-sm">QR Code</TabsTrigger>
        </TabsList>

        {/* New Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Hình ảnh cửa hàng
              </CardTitle>
              <CardDescription>Ảnh đại diện và banner của shop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar */}
                <div className="space-y-3">
                  <Label>Ảnh đại diện shop</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={seller?.shop_avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <Store className="h-8 w-8 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" disabled={uploadingAvatar} asChild>
                          <span>
                            {uploadingAvatar ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Tải ảnh lên
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')}
                      />
                      <p className="text-xs text-muted-foreground">
                        Khuyến nghị: 200x200px, tối đa 2MB
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label>Banner shop</Label>
                  <div className="w-full h-32 rounded-lg bg-muted overflow-hidden border-2 border-dashed border-border">
                    {seller?.shop_banner_url || formData.banner_url ? (
                      <img 
                        src={formData.banner_url || seller?.shop_banner_url} 
                        alt="Banner" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Chưa có banner</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="banner-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploadingBanner} asChild>
                        <span>
                          {uploadingBanner ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Tải banner
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                    />
                    <p className="text-xs text-muted-foreground">
                      1200x300px, tối đa 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner URL input for advanced users */}
              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Hoặc nhập URL banner trực tiếp</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={formData.banner_url || ''}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value || null })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>

              {/* Video Banner Option */}
              <div className="pt-4 border-t">
                <Label>Banner Video/GIF (tùy chọn)</Label>
                <Input
                  value={formData.banner_video_url || ''}
                  onChange={(e) => setFormData({ ...formData, banner_video_url: e.target.value || null })}
                  placeholder="https://example.com/banner.mp4"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Video sẽ thay thế ảnh banner nếu có
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Preset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleApplyPreset(key as keyof typeof themePresets)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.theme_preset === key 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: preset.primary_color }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: preset.secondary_color }}
                      />
                    </div>
                    <p className="text-sm font-medium">{preset.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Màu sắc tùy chỉnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Màu chính</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.primary_color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.primary_color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Màu phụ</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.secondary_color || '#10B981'}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.secondary_color || '#10B981'}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Màu nền (tùy chọn)</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.background_color || '#FFFFFF'}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.background_color || ''}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value || null })}
                      placeholder="Mặc định"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Màu chữ (tùy chọn)</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.text_color || '#000000'}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.text_color || ''}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value || null })}
                      placeholder="Mặc định"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Font chữ</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                  value={formData.font_family || 'system-ui'}
                  onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                >
                  <option value="system-ui">System UI</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSS tùy chỉnh</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.custom_css || ''}
                onChange={(e) => setFormData({ ...formData, custom_css: e.target.value || null })}
                placeholder="/* CSS tùy chỉnh cho shop */&#10;.shop-header { }&#10;.product-card { }"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ CSS nâng cao - chỉ dành cho người có kiến thức về CSS
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Kiểu hiển thị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Layout sản phẩm</label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {['grid', 'list', 'masonry'].map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setFormData({ ...formData, layout_style: layout })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.layout_style === layout 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium capitalize">{layout}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hiển thị avatar seller</p>
                    <p className="text-sm text-muted-foreground">Hiện ảnh đại diện trong header shop</p>
                  </div>
                  <Switch
                    checked={formData.show_seller_avatar ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_seller_avatar: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hiển thị thống kê</p>
                    <p className="text-sm text-muted-foreground">Hiện số đơn, đánh giá trong header</p>
                  </div>
                  <Switch
                    checked={formData.show_stats ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_stats: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hiển thị badge</p>
                    <p className="text-sm text-muted-foreground">Hiện các huy hiệu thành tích</p>
                  </div>
                  <Switch
                    checked={formData.show_badges ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_badges: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Shop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGenerateQR} disabled={generateQR.isPending}>
                {generateQR.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Tạo QR Code
                  </>
                )}
              </Button>

              {qrData && (
                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <img 
                    src={qrData.qrUrl} 
                    alt="Shop QR Code" 
                    className="w-32 h-32 rounded-lg bg-white p-2"
                  />
                  <div className="flex-1">
                    <p className="font-medium">QR Code Shop</p>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      Link: {qrData.shopUrl}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" asChild>
                        <a href={qrData.qrUrl} download="shop-qr.png">
                          Tải xuống
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(qrData.shopUrl);
                          toast.success('Đã copy link');
                        }}
                      >
                        Copy link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
