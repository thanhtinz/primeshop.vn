import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/useUserSecurity';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();
  const { data: settings } = useSiteSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    forgotPassword.mutate(email, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-12">
              <img src="/favicon.png" alt="Logo" className="h-10 w-10" />
              <span className="text-2xl font-bold text-foreground">{settings?.site_name || 'Store'}</span>
            </Link>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
              Khôi phục
              <span className="block text-primary">mật khẩu</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Đừng lo, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản một cách nhanh chóng và an toàn.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 justify-center mb-6">
              <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-foreground">{settings?.site_name || 'Store'}</span>
            </Link>
          </div>

          {sent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle className="h-10 w-10 text-green-500" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Email đã được gửi!</h2>
                <p className="text-muted-foreground">
                  Chúng tôi đã gửi link đặt lại mật khẩu đến
                </p>
                <p className="font-medium text-foreground">{email}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p>Không nhận được email? Kiểm tra thư mục spam hoặc thử lại sau vài phút.</p>
              </div>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSent(false)} 
                  className="w-full h-12"
                >
                  Gửi lại email
                </Button>
                <Link to="/auth">
                  <Button variant="ghost" className="w-full h-12 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="lg:hidden w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Quên mật khẩu?</h2>
                <p className="text-muted-foreground mt-2">
                  Nhập email để nhận link đặt lại mật khẩu
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base" 
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi link đặt lại mật khẩu'
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Link 
                  to="/auth" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
