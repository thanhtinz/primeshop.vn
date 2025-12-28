import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const VerifyEmailPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/auth');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value.replace(/\D/g, '');
      setCode(newCode);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác minh');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code: fullCode }
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Mã xác minh không hợp lệ');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setIsVerified(true);
        // Clear the pending verification flag
        sessionStorage.removeItem('signup_pending_verification');
        toast.success('Email đã được xác minh thành công!');
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi, vui lòng thử lại');
    }
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { email }
      });

      if (error) {
        toast.error('Không thể gửi lại mã xác minh');
      } else {
        toast.success('Đã gửi lại mã xác minh!');
        setResendCooldown(60);
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi, vui lòng thử lại');
    }
    setIsResending(false);
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-green-500" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Xác minh thành công!</h2>
              <p className="text-muted-foreground">
                Email của bạn đã được xác minh. Bây giờ bạn có thể đăng nhập.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full gap-2"
            >
              Đăng nhập ngay
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Xác minh email</h2>
            <p className="text-muted-foreground">
              Chúng tôi đã gửi mã xác minh đến<br/>
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Lưu ý: Email có thể nằm trong thư mục <strong>Spam/Junk</strong>. Vui lòng kiểm tra nếu không thấy trong hộp thư đến.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-muted/30 border-border focus:bg-background"
                disabled={isLoading}
              />
            ))}
          </div>

          <Button 
            onClick={handleVerify}
            className="w-full h-12"
            disabled={isLoading || code.some(d => !d)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang xác minh...
              </>
            ) : (
              'Xác minh'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Không nhận được mã?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="gap-2"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {resendCooldown > 0 
                ? `Gửi lại sau ${resendCooldown}s` 
                : 'Gửi lại mã'
              }
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
