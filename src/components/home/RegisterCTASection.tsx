import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { UserPlus } from 'lucide-react';

export const RegisterCTASection = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { data: siteSettings } = useSiteSettings();

  // Don't show if user is logged in
  if (user) return null;

  const siteName = siteSettings?.site_name || 'Shop';

  return (
    <ScrollReveal animation="fade-up">
      <section className="pt-8 md:pt-12">
        <div className="container px-4">
          {/* Gradient border wrapper */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 md:mb-8 overflow-hidden">
            <div className="relative flex flex-col items-start text-left px-5 py-6 md:px-8 md:py-10 rounded-2xl bg-card overflow-hidden">
              {/* Decorative glow - contained within card */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Title */}
              <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-3 relative">
                {language === 'vi' ? 'Bạn chưa có tài khoản?' : "Don't have an account yet?"}
              </h2>
              
              {/* Description */}
              <p className="text-muted-foreground text-sm md:text-base max-w-xl mb-4 md:mb-6 leading-relaxed relative">
                {language === 'vi' 
                  ? `Hãy tạo ngay một tài khoản để sử dụng đầy đủ các tính năng, tích lũy ưu đãi khi thanh toán các sản phẩm và tham gia vào chương trình Giới thiệu bạn bè nhận hoa hồng vĩnh viễn tại ${siteName}.`
                  : `Create an account now to access all features, accumulate rewards when purchasing products, and join our referral program to earn lifetime commissions at ${siteName}.`
                }
              </p>
              
              {/* Actions - same line */}
              <div className="flex items-center gap-2 md:gap-3 relative">
                <Link to="/auth?tab=register">
                  <Button size="sm" className="gap-1 h-7 md:h-8 px-2.5 md:px-4 text-[11px] md:text-xs bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 border-0 whitespace-nowrap">
                    <UserPlus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {language === 'vi' ? 'Đăng ký ngay' : 'Register'}
                  </Button>
                </Link>
                <span className="text-muted-foreground text-[11px] md:text-sm">
                  {language === 'vi' ? 'Hoặc đã có tài khoản?' : 'Have an account?'}{' '}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    {language === 'vi' ? 'Đăng nhập' : 'Sign in'}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};
