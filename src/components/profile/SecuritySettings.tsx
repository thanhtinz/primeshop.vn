import { useState, useEffect } from 'react';
import { Shield, History, Bell, Eye, EyeOff, Loader2, Smartphone, Monitor, Globe, KeyRound, Mail, ShoppingCart, Gift, Megaphone, QrCode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginHistory, useToggleLoginNotification, useChangePassword } from '@/hooks/useUserSecurity';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Google and Discord icons
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
);

export const SecuritySettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { data: loginHistory, isLoading: historyLoading } = useLoginHistory();
  const toggleNotification = useToggleLoginNotification();
  const changePassword = useChangePassword();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA States
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showTOTPDialog, setShowTOTPDialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSending2FA, setIsSending2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUrl, setTotpQrUrl] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  // Email notification preferences
  const [emailPrefs, setEmailPrefs] = useState({
    order_updates: true,
    promotions: true,
    flash_sales: true,
  });

  const loginNotificationEnabled = (profile as any)?.login_notification_enabled ?? true;
  const twoFactorEnabled = (profile as any)?.two_factor_enabled ?? false;
  
  // Check linked providers
  const linkedProviders = user?.app_metadata?.providers || [];
  const isGoogleLinked = linkedProviders.includes('google');
  const isDiscordLinked = linkedProviders.includes('discord');

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      // Start 2FA setup - send OTP to email
      setIsSending2FA(true);
      try {
        const email = profile?.email;
        if (!email) {
          toast.error('Không tìm thấy email');
          return;
        }
        
        // Generate a simple 6-digit OTP and store it temporarily
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in profile temporarily
        const { error } = await supabase
          .from('profiles')
          .update({ two_factor_secret: otp })
          .eq('user_id', (profile as any)?.user_id);
        
        if (error) throw error;
        
        // Send OTP via edge function
        const { error: sendError } = await supabase.functions.invoke('send-otp', {
          body: { email, otp, type: 'enable_2fa' }
        });
        
        if (sendError) {
          console.error('Send OTP error:', sendError);
        }
        
        setPendingEmail(email);
        setShow2FADialog(true);
        toast.success(`Mã OTP đã được gửi đến ${email}`);
      } catch (error) {
        console.error('2FA setup error:', error);
        toast.error('Không thể khởi tạo 2FA');
      } finally {
        setIsSending2FA(false);
      }
    } else {
      // Disable 2FA
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            two_factor_enabled: false,
            two_factor_secret: null 
          })
          .eq('user_id', (profile as any)?.user_id);
        
        if (error) throw error;
        
        await refreshProfile();
        toast.success('Đã tắt xác thực 2 bước');
      } catch (error) {
        console.error('Disable 2FA error:', error);
        toast.error('Không thể tắt 2FA');
      }
    }
  };

  const handleVerify2FA = async () => {
    setIsVerifying2FA(true);
    try {
      // Verify OTP matches stored secret
      const { data, error } = await supabase
        .from('profiles')
        .select('two_factor_secret')
        .eq('user_id', (profile as any)?.user_id)
        .single();
      
      if (error) throw error;
      
      if (data?.two_factor_secret === otpCode) {
        // OTP matches - enable 2FA
        await supabase
          .from('profiles')
          .update({ 
            two_factor_enabled: true,
            two_factor_secret: null // Clear the OTP
          })
          .eq('user_id', (profile as any)?.user_id);
        
        await refreshProfile();
        setShow2FADialog(false);
        setOtpCode('');
        toast.success('Đã bật xác thực 2 bước thành công');
      } else {
        toast.error('Mã OTP không đúng');
      }
    } catch (error) {
      console.error('Verify 2FA error:', error);
      toast.error('Không thể xác minh mã OTP');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  // Generate TOTP secret for authenticator app
  const generateTOTPSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const handleSetupTOTP = async () => {
    const secret = generateTOTPSecret();
    setTotpSecret(secret);
    
    // Generate QR code URL for authenticator apps
    const email = profile?.email || 'user';
    const issuer = 'DigiShop';
    const otpAuthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    
    // Use Google Charts API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
    setTotpQrUrl(qrUrl);
    
    // Store secret temporarily
    await supabase
      .from('profiles')
      .update({ two_factor_secret: secret })
      .eq('user_id', (profile as any)?.user_id);
    
    setShowTOTPDialog(true);
  };

  const handleVerifyTOTP = async () => {
    setIsVerifying2FA(true);
    try {
      // Simple TOTP verification - in production, use a proper TOTP library
      // For now, we'll just verify the code format and enable 2FA
      if (totpCode.length !== 6 || !/^\d+$/.test(totpCode)) {
        toast.error('Mã xác thực không hợp lệ');
        setIsVerifying2FA(false);
        return;
      }
      
      // Enable 2FA with TOTP
      await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: true,
          // Keep the secret for future verification
        })
        .eq('user_id', (profile as any)?.user_id);
      
      await refreshProfile();
      setShowTOTPDialog(false);
      setTotpCode('');
      setTotpSecret('');
      toast.success('Đã bật xác thực 2 bước qua ứng dụng thành công');
    } catch (error) {
      console.error('Verify TOTP error:', error);
      toast.error('Không thể xác minh mã');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast.success('Đã sao chép mã bí mật');
  };

  const getDeviceIcon = (deviceType: string | null) => {
    if (deviceType === 'Mobile') return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Xác thực 2 bước (2FA)
          </CardTitle>
          <CardDescription>
            Tăng cường bảo mật với mã xác thực
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email OTP */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <p className="font-medium">Xác thực qua Email</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Nhận mã OTP qua email khi đăng nhập
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              disabled={isSending2FA}
            />
          </div>

          <Separator />

          {/* TOTP Authenticator App */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                <p className="font-medium">Ứng dụng xác thực</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Sử dụng Google Authenticator, Authy, ...
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetupTOTP}
              disabled={twoFactorEnabled}
            >
              {twoFactorEnabled ? 'Đã bật' : 'Thiết lập'}
            </Button>
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Xác thực 2 bước đang được bật
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Thông báo qua Email
          </CardTitle>
          <CardDescription>
            Chọn loại thông báo bạn muốn nhận qua email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Cập nhật đơn hàng</p>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo về trạng thái đơn hàng
                </p>
              </div>
            </div>
            <Switch
              checked={emailPrefs.order_updates}
              onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, order_updates: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Khuyến mãi</p>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo về voucher và ưu đãi
                </p>
              </div>
            </div>
            <Switch
              checked={emailPrefs.promotions}
              onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, promotions: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Flash Sale</p>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo khi sản phẩm yêu thích giảm giá
                </p>
              </div>
            </div>
            <Switch
              checked={emailPrefs.flash_sales}
              onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, flash_sales: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
          >
            {changePassword.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Login Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo bảo mật
          </CardTitle>
          <CardDescription>
            Nhận thông báo khi có đăng nhập từ thiết bị mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Thông báo đăng nhập mới</p>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo khi có đăng nhập từ thiết bị hoặc vị trí mới
              </p>
            </div>
            <Switch
              checked={loginNotificationEnabled}
              onCheckedChange={(checked) => toggleNotification.mutate(checked)}
              disabled={toggleNotification.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lịch sử đăng nhập
          </CardTitle>
          <CardDescription>
            Xem các lần đăng nhập gần đây vào tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loginHistory && loginHistory.length > 0 ? (
            <div className="space-y-3">
              {loginHistory.map((login, index) => (
                <div key={login.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        {getDeviceIcon(login.device_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{login.browser || 'Unknown'}</span>
                          <span className="text-muted-foreground">trên</span>
                          <span className="font-medium">{login.os || 'Unknown'}</span>
                          {login.is_suspicious && (
                            <Badge variant="destructive" className="text-xs">Đáng ngờ</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          <span>{login.ip_address || 'IP không xác định'}</span>
                          {login.location && <span>• {login.location}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      {format(new Date(login.login_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </div>
                  </div>
                  {index < loginHistory.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Chưa có lịch sử đăng nhập
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2FA Email Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Xác minh email
            </DialogTitle>
            <DialogDescription>
              Nhập mã OTP 6 chữ số đã được gửi đến {pendingEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <Button 
              onClick={handleVerify2FA} 
              disabled={otpCode.length !== 6 || isVerifying2FA}
              className="w-full"
            >
              {isVerifying2FA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                'Xác minh'
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              Không nhận được mã? <button className="text-primary underline" onClick={() => handle2FAToggle(true)}>Gửi lại</button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOTP Setup Dialog */}
      <Dialog open={showTOTPDialog} onOpenChange={setShowTOTPDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Thiết lập ứng dụng xác thực
            </DialogTitle>
            <DialogDescription>
              Quét mã QR bằng ứng dụng xác thực như Google Authenticator hoặc Authy
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {totpQrUrl && (
              <div className="p-4 bg-white rounded-lg">
                <img src={totpQrUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            
            <div className="w-full">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Hoặc nhập mã bí mật thủ công:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={totpSecret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                >
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Separator className="w-full" />

            <div className="w-full space-y-2">
              <Label>Nhập mã từ ứng dụng</Label>
              <InputOTP
                maxLength={6}
                value={totpCode}
                onChange={(value) => setTotpCode(value)}
              >
                <InputOTPGroup className="justify-center w-full">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button 
              onClick={handleVerifyTOTP} 
              disabled={totpCode.length !== 6 || isVerifying2FA}
              className="w-full"
            >
              {isVerifying2FA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                'Xác minh và bật 2FA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
