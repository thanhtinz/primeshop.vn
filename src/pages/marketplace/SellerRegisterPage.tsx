import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Store, Check, AlertCircle, Loader2, Phone, Facebook, Gamepad2, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentSeller, useRegisterSeller } from '@/hooks/useMarketplace';
import { toast } from 'sonner';

export default function SellerRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existingSeller, isLoading: checkingExisting } = useCurrentSeller();
  const registerSeller = useRegisterSeller();
  
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_slug: '',
    shop_description: '',
    shop_type: 'game_account' as 'game_account' | 'design',
    phone: '',
    facebook_url: '',
    zalo_url: ''
  });
  
  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({ ...prev, shop_slug: slug }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.shop_name || !formData.shop_slug) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      await registerSeller.mutateAsync(formData);
      toast.success('Đăng ký cửa hàng thành công! Vui lòng chờ admin duyệt.');
      navigate(`/shops/${formData.shop_slug}/dashboard`);
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        toast.error('Tên cửa hàng hoặc đường dẫn đã tồn tại');
      } else {
        toast.error('Có lỗi xảy ra: ' + error.message);
      }
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Đăng nhập để tiếp tục</h2>
              <p className="text-muted-foreground mb-4">Bạn cần đăng nhập để đăng ký cửa hàng</p>
              <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  if (checkingExisting) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }
  
  if (existingSeller) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              {existingSeller.status === 'pending' ? (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Đang chờ duyệt</h2>
                  <p className="text-muted-foreground mb-4">
                    Yêu cầu mở cửa hàng của bạn đang được xem xét. Vui lòng chờ admin phê duyệt.
                  </p>
                </>
              ) : existingSeller.status === 'approved' ? (
                <>
                  <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Cửa hàng đã được duyệt</h2>
                  <p className="text-muted-foreground mb-4">
                    Bạn có thể bắt đầu đăng sản phẩm và bán hàng ngay bây giờ!
                  </p>
                  <Button onClick={() => navigate(`/shops/${existingSeller.shop_slug}/dashboard`)}>
                    Vào Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Yêu cầu bị từ chối</h2>
                  <p className="text-muted-foreground mb-4">
                    {existingSeller.admin_notes || 'Vui lòng liên hệ admin để biết thêm chi tiết.'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-6 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Mở cửa hàng</h1>
            <p className="text-muted-foreground mt-2">
              Bắt đầu kinh doanh trên chợ tài khoản với hàng ngàn khách hàng tiềm năng
            </p>
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-medium">Phí thấp</h3>
                <p className="text-xs text-muted-foreground">Chỉ 5% phí mỗi giao dịch</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-medium">Rút tiền nhanh</h3>
                <p className="text-xs text-muted-foreground">Xử lý trong 24h</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-medium">Bảo vệ giao dịch</h3>
                <p className="text-xs text-muted-foreground">Đảm bảo thanh toán an toàn</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cửa hàng</CardTitle>
              <CardDescription>
                Điền thông tin để đăng ký cửa hàng. Admin sẽ xem xét và phê duyệt trong 24h.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop_name">Tên cửa hàng *</Label>
                  <Input
                    id="shop_name"
                    placeholder="VD: Shop Game Pro"
                    value={formData.shop_name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, shop_name: e.target.value }));
                      if (!formData.shop_slug) {
                        handleSlugChange(e.target.value);
                      }
                    }}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shop_slug">Đường dẫn cửa hàng *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/shops/</span>
                    <Input
                      id="shop_slug"
                      placeholder="shopgamepro"
                      value={formData.shop_slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chỉ chứa chữ cái và số, không dấu
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shop_description">Mô tả cửa hàng</Label>
                  <Textarea
                    id="shop_description"
                    placeholder="Giới thiệu về cửa hàng của bạn..."
                    value={formData.shop_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, shop_description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Loại cửa hàng *</Label>
                  <RadioGroup
                    value={formData.shop_type}
                    onValueChange={(value: 'game_account' | 'design') => 
                      setFormData(prev => ({ ...prev, shop_type: value }))
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="type_game"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.shop_type === 'game_account' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="game_account" id="type_game" />
                      <Gamepad2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Account Game</div>
                        <div className="text-xs text-muted-foreground">Bán tài khoản game</div>
                      </div>
                    </Label>
                    <Label
                      htmlFor="type_design"
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.shop_type === 'design' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="design" id="type_design" />
                      <Palette className="h-5 w-5 text-pink-500" />
                      <div>
                        <div className="font-medium">Thiết kế ảnh</div>
                        <div className="text-xs text-muted-foreground">Dịch vụ thiết kế</div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="0912345678"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zalo_url">Zalo</Label>
                    <Input
                      id="zalo_url"
                      placeholder="https://zalo.me/..."
                      value={formData.zalo_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, zalo_url: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="facebook_url"
                      placeholder="https://facebook.com/..."
                      value={formData.facebook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bằng việc đăng ký, bạn đồng ý với điều khoản dịch vụ và cam kết tuân thủ quy định của chợ.
                  </AlertDescription>
                </Alert>
                
                <Button type="submit" className="w-full" disabled={registerSeller.isPending}>
                  {registerSeller.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Store className="h-4 w-4 mr-2" />
                      Đăng ký cửa hàng
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
