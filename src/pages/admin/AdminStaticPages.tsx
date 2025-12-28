import React, { useState, useEffect } from 'react';
import { useSiteSettings, useUpdateMultipleSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Phone, Shield, Scale, Link2, Share2, Facebook, Youtube, Instagram, Save, RotateCcw } from 'lucide-react';
import ImageUrlInput from '@/components/admin/ImageUrlInput';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const AdminStaticPages = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateMultipleSiteSettings();
  
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Quản lý trang tĩnh & MXH</h1>
        <Button onClick={handleSubmit} disabled={updateSettings.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto">
            <TabsTrigger value="about" className="gap-1 text-xs sm:text-sm py-2">
              <FileText className="h-4 w-4 hidden sm:block" />
              About Us
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1 text-xs sm:text-sm py-2">
              <Phone className="h-4 w-4 hidden sm:block" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-1 text-xs sm:text-sm py-2">
              <Scale className="h-4 w-4 hidden sm:block" />
              Điều khoản
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1 text-xs sm:text-sm py-2">
              <Shield className="h-4 w-4 hidden sm:block" />
              Bảo mật
            </TabsTrigger>
            <TabsTrigger value="refund" className="gap-1 text-xs sm:text-sm py-2">
              <RotateCcw className="h-4 w-4 hidden sm:block" />
              Hoàn tiền
            </TabsTrigger>
            <TabsTrigger value="dmca" className="gap-1 text-xs sm:text-sm py-2">
              <Link2 className="h-4 w-4 hidden sm:block" />
              DMCA
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1 text-xs sm:text-sm py-2">
              <Share2 className="h-4 w-4 hidden sm:block" />
              MXH
            </TabsTrigger>
          </TabsList>

          {/* About Us */}
          <TabsContent value="about" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Trang About Us</CardTitle>
                <CardDescription>Nội dung giới thiệu về công ty/website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề trang (Tiếng Việt)</Label>
                  <Input
                    value={formData.about_title_vi || ''}
                    onChange={(e) => setFormData({ ...formData, about_title_vi: e.target.value })}
                    placeholder="Về chúng tôi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề trang (Tiếng Anh)</Label>
                  <Input
                    value={formData.about_title_en || ''}
                    onChange={(e) => setFormData({ ...formData, about_title_en: e.target.value })}
                    placeholder="About Us"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn (Tiếng Việt)</Label>
                  <Textarea
                    value={formData.about_description_vi || ''}
                    onChange={(e) => setFormData({ ...formData, about_description_vi: e.target.value })}
                    placeholder="Mô tả ngắn về công ty..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn (Tiếng Anh)</Label>
                  <Textarea
                    value={formData.about_description_en || ''}
                    onChange={(e) => setFormData({ ...formData, about_description_en: e.target.value })}
                    placeholder="Short description about the company..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung chi tiết (Tiếng Việt - HTML)</Label>
                  <Textarea
                    value={formData.about_content_vi || ''}
                    onChange={(e) => setFormData({ ...formData, about_content_vi: e.target.value })}
                    placeholder="<p>Nội dung chi tiết...</p>"
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung chi tiết (Tiếng Anh - HTML)</Label>
                  <Textarea
                    value={formData.about_content_en || ''}
                    onChange={(e) => setFormData({ ...formData, about_content_en: e.target.value })}
                    placeholder="<p>Detailed content...</p>"
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Trang Contact</CardTitle>
                <CardDescription>Thông tin liên hệ hiển thị trên trang Contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email hỗ trợ</Label>
                    <Input
                      type="email"
                      value={formData.support_email || ''}
                      onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={formData.company_phone || ''}
                      onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                      placeholder="0909 123 456"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Textarea
                    value={formData.company_address || ''}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giờ làm việc (Tiếng Việt)</Label>
                  <Input
                    value={formData.working_hours_vi || ''}
                    onChange={(e) => setFormData({ ...formData, working_hours_vi: e.target.value })}
                    placeholder="24/7 - Hỗ trợ mọi lúc"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giờ làm việc (Tiếng Anh)</Label>
                  <Input
                    value={formData.working_hours_en || ''}
                    onChange={(e) => setFormData({ ...formData, working_hours_en: e.target.value })}
                    placeholder="24/7 - Always available"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Maps Embed URL</Label>
                  <Input
                    value={formData.google_maps_url || ''}
                    onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL embed từ Google Maps để hiển thị bản đồ
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms */}
          <TabsContent value="terms" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Điều khoản sử dụng</CardTitle>
                <CardDescription>Nội dung trang điều khoản sử dụng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Việt - HTML)</Label>
                  <Textarea
                    value={formData.terms_content_vi || ''}
                    onChange={(e) => setFormData({ ...formData, terms_content_vi: e.target.value })}
                    placeholder="<h2>1. Điều khoản chung</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Anh - HTML)</Label>
                  <Textarea
                    value={formData.terms_content_en || ''}
                    onChange={(e) => setFormData({ ...formData, terms_content_en: e.target.value })}
                    placeholder="<h2>1. General Terms</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày cập nhật cuối</Label>
                  <Input
                    type="date"
                    value={formData.terms_last_updated || ''}
                    onChange={(e) => setFormData({ ...formData, terms_last_updated: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Chính sách bảo mật</CardTitle>
                <CardDescription>Nội dung trang chính sách bảo mật</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Việt - HTML)</Label>
                  <Textarea
                    value={formData.privacy_content_vi || ''}
                    onChange={(e) => setFormData({ ...formData, privacy_content_vi: e.target.value })}
                    placeholder="<h2>1. Thu thập thông tin</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Anh - HTML)</Label>
                  <Textarea
                    value={formData.privacy_content_en || ''}
                    onChange={(e) => setFormData({ ...formData, privacy_content_en: e.target.value })}
                    placeholder="<h2>1. Information Collection</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày cập nhật cuối</Label>
                  <Input
                    type="date"
                    value={formData.privacy_last_updated || ''}
                    onChange={(e) => setFormData({ ...formData, privacy_last_updated: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refund Policy */}
          <TabsContent value="refund" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Chính sách hoàn tiền</CardTitle>
                <CardDescription>Nội dung trang chính sách hoàn tiền</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Việt - HTML)</Label>
                  <Textarea
                    value={formData.refund_content_vi || ''}
                    onChange={(e) => setFormData({ ...formData, refund_content_vi: e.target.value })}
                    placeholder="<h2>1. Điều kiện hoàn tiền</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nội dung (Tiếng Anh - HTML)</Label>
                  <Textarea
                    value={formData.refund_content_en || ''}
                    onChange={(e) => setFormData({ ...formData, refund_content_en: e.target.value })}
                    placeholder="<h2>1. Refund Conditions</h2><p>...</p>"
                    rows={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày cập nhật cuối</Label>
                  <Input
                    type="date"
                    value={formData.refund_last_updated || ''}
                    onChange={(e) => setFormData({ ...formData, refund_last_updated: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DMCA */}
          <TabsContent value="dmca" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">DMCA Protection</CardTitle>
                <CardDescription>Cấu hình DMCA badge và chính sách</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>DMCA Badge URL</Label>
                  <Input
                    value={formData.dmca_badge_url || ''}
                    onChange={(e) => setFormData({ ...formData, dmca_badge_url: e.target.value })}
                    placeholder="https://www.dmca.com/Protection/Status.aspx?ID=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL trang DMCA để người dùng xác minh
                  </p>
                </div>
                <div className="space-y-2">
                  <ImageUrlInput
                    value={formData.dmca_badge_image || ''}
                    onChange={(url) => setFormData({ ...formData, dmca_badge_image: url })}
                    label="DMCA Badge Image"
                    folder="site-assets"
                    aspectHint="Ảnh badge DMCA (thường lấy từ dmca.com)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chính sách DMCA (Tiếng Việt - HTML)</Label>
                  <Textarea
                    value={formData.dmca_policy_vi || ''}
                    onChange={(e) => setFormData({ ...formData, dmca_policy_vi: e.target.value })}
                    placeholder="<p>Chính sách DMCA...</p>"
                    rows={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chính sách DMCA (Tiếng Anh - HTML)</Label>
                  <Textarea
                    value={formData.dmca_policy_en || ''}
                    onChange={(e) => setFormData({ ...formData, dmca_policy_en: e.target.value })}
                    placeholder="<p>DMCA Policy...</p>"
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Mạng xã hội</CardTitle>
                <CardDescription>Liên kết đến các trang mạng xã hội</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      value={formData.social_facebook || ''}
                      onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      YouTube
                    </Label>
                    <Input
                      value={formData.social_youtube || ''}
                      onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      value={formData.social_instagram || ''}
                      onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TikTokIcon />
                      TikTok
                    </Label>
                    <Input
                      value={formData.social_tiktok || ''}
                      onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      Discord
                    </Label>
                    <Input
                      value={formData.social_discord || ''}
                      onChange={(e) => setFormData({ ...formData, social_discord: e.target.value })}
                      placeholder="https://discord.gg/yourserver"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      Telegram
                    </Label>
                    <Input
                      value={formData.social_telegram || ''}
                      onChange={(e) => setFormData({ ...formData, social_telegram: e.target.value })}
                      placeholder="https://t.me/yourchannel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zalo Official Account</Label>
                  <Input
                    value={formData.social_zalo || ''}
                    onChange={(e) => setFormData({ ...formData, social_zalo: e.target.value })}
                    placeholder="https://zalo.me/yourpage"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default AdminStaticPages;
