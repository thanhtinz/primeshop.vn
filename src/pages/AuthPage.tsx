import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, User, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

// Google icon as SVG component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAACHeVNTAamAr7dFd';

const AuthPage = () => {
  const { t } = useLanguage();
  const { data: settings } = useSiteSettings();
  
  const googleEnabled = settings?.google_login_enabled !== false;
  // Captcha mặc định tắt, chỉ bật khi admin cấu hình captcha_enabled = true
  const captchaEnabled = settings?.captcha_enabled === true;
  const captchaSiteKey = settings?.captcha_site_key || DEFAULT_TURNSTILE_SITE_KEY;
  const captchaMode = settings?.captcha_mode || 'always';
  
  const loginSchema = z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(6, t('passwordMinLength'))
  });

  const signupSchema = z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(6, t('passwordMinLength')),
    fullName: z.string().min(2, t('fullNameMinLength'))
  });

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const turnstileRef = useRef<any>(null);
  
  const { signIn, signUp, signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check for OAuth errors in URL (when redirected back from Google)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = hashParams.get('error_description');
    const error = hashParams.get('error');
    
    if (error || errorDescription) {
      // Check if it's a duplicate email error
      if (errorDescription?.includes('already registered') || 
          errorDescription?.includes('already exists') ||
          errorDescription?.includes('email')) {
        toast.error('Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu, sau đó liên kết Google trong Cài đặt.');
      } else {
        toast.error(errorDescription || 'Đăng nhập Google thất bại');
      }
      // Clear the hash to prevent showing error again on refresh
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Don't redirect if we just completed signup (waiting for OTP verification)
    if (user && !authLoading && !signupSuccess) {
      navigate('/');
    }
  }, [user, authLoading, navigate, signupSuccess]);

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-captcha', {
        body: { token }
      });
      if (error) return false;
      return data?.success === true;
    } catch {
      return false;
    }
  };

  // Check if captcha should be shown for current mode
  const shouldShowCaptcha = captchaEnabled && (
    captchaMode === 'always' || 
    (captchaMode === 'login_only' && activeTab === 'login') ||
    (captchaMode === 'signup_only' && activeTab === 'signup') ||
    captchaMode === 'suspicious'
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // Only validate captcha if enabled and should show for login
    const needsCaptcha = captchaEnabled && (captchaMode === 'always' || captchaMode === 'login_only' || captchaMode === 'suspicious');
    
    if (needsCaptcha) {
      if (!captchaToken) {
        toast.error(t('pleaseCompleteCaptcha') || 'Vui lòng hoàn thành captcha');
        return;
      }

      const isValidCaptcha = await verifyCaptcha(captchaToken);
      if (!isValidCaptcha) {
        toast.error(t('captchaFailed') || 'Xác thực captcha thất bại');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error);
      if (needsCaptcha) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
      }
    } else {
      toast.success(t('loginSuccess'));
      // Delay navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/');
      }, 100);
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      signupSchema.parse({ email, password, fullName });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // Only validate captcha if enabled and should show for signup
    const needsCaptcha = captchaEnabled && (captchaMode === 'always' || captchaMode === 'signup_only' || captchaMode === 'suspicious');
    
    if (needsCaptcha) {
      if (!captchaToken) {
        toast.error(t('pleaseCompleteCaptcha') || 'Vui lòng hoàn thành captcha');
        return;
      }

      const isValidCaptcha = await verifyCaptcha(captchaToken);
      if (!isValidCaptcha) {
        toast.error(t('captchaFailed') || 'Xác thực captcha thất bại');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error);
      if (needsCaptcha) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
      }
    } else {
      setSignupSuccess(true);
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsSocialLoading('google');
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
    setIsSocialLoading(null);
  };

  // Redirect to verify page after signup
  useEffect(() => {
    if (signupSuccess && email) {
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    }
  }, [signupSuccess, email, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex bg-background overflow-x-hidden">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
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
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
              {t('discoverDigitalWorld')}
              <span className="block text-primary">{t('digitalProducts')}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {t('authHeroDescription')}
            </p>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-medium">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{t('usersCount')}</p>
                <p className="text-muted-foreground">{t('trustAndUse')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 py-12 lg:py-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">{settings?.site_name || 'Store'}</span>
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {activeTab === 'login' ? t('welcomeBack') : t('createNewAccount')}
            </h2>
            <p className="text-muted-foreground mt-2">
              {activeTab === 'login' 
                ? t('loginToContinueAuth') 
                : t('signUpFreeToday')}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-muted/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'login' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('login')}
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'signup' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('signUp')}
            </button>
          </div>

          {/* Social Login - Google */}
          {googleEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 h-12 mb-6"
                onClick={handleGoogleLogin}
                disabled={isSocialLoading !== null}
              >
                {isSocialLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Đăng nhập với Google</span>
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">{t('or')}</span>
                </div>
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-foreground">{t('password')}</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {shouldShowCaptcha && (captchaMode === 'always' || captchaMode === 'login_only' || captchaMode === 'suspicious') && (
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={captchaSiteKey}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onError={() => {
                        setCaptchaToken(null);
                        // Don't show toast on widget error - just disable submit
                        console.warn('Turnstile widget error - captcha token cleared');
                      }}
                      onExpire={() => setCaptchaToken(null)}
                      options={{ theme: 'auto', size: 'normal' }}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base gap-2" 
                  disabled={isLoading || (shouldShowCaptcha && (captchaMode === 'always' || captchaMode === 'login_only' || captchaMode === 'suspicious') && !captchaToken)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loggingIn')}
                    </>
                  ) : (
                    <>
                      {t('login')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup} 
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-foreground">{t('fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 bg-muted/30 border-border focus:bg-background transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {shouldShowCaptcha && (captchaMode === 'always' || captchaMode === 'signup_only' || captchaMode === 'suspicious') && (
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={captchaSiteKey}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onError={() => {
                        setCaptchaToken(null);
                        console.warn('Turnstile widget error - captcha token cleared');
                      }}
                      onExpire={() => setCaptchaToken(null)}
                      options={{ theme: 'auto', size: 'normal' }}
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base gap-2" 
                  disabled={isLoading || (shouldShowCaptcha && (captchaMode === 'always' || captchaMode === 'signup_only' || captchaMode === 'suspicious') && !captchaToken)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('signingUp')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t('signUp')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t('bySigningUp')}{' '}
                  <Link to="/terms" className="text-primary hover:underline">{t('terms')}</Link>
                  {' '}{t('and')}{' '}
                  <Link to="/privacy" className="text-primary hover:underline">{t('privacy')}</Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
