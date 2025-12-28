import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Frame, Sparkles, ArrowRight, Crown, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PrimeBoostShop from '@/components/prime/PrimeBoostShop';
import NameColorShop from '@/components/prime/NameColorShop';
import PrimeEffectsShop from '@/components/prime/PrimeEffectsShop';
import { AvatarFrameShop } from '@/components/profile/AvatarFrameShop';

const ShopPage = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('prime');

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md w-full overflow-hidden border-0 shadow-2xl">
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-center">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHYyaC0ydjRoMnYyaDR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Crown className="h-12 w-12 text-primary-foreground drop-shadow-lg" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2 text-primary-foreground">{t('itemShop') || 'Item Shop'}</h2>
                <p className="text-primary-foreground/80 mb-6">{t('loginToExplore') || 'Đăng nhập để khám phá các vật phẩm độc quyền'}</p>
                <Button 
                  onClick={() => navigate('/auth')} 
                  size="lg" 
                  className="w-full bg-background text-foreground hover:bg-background/90 font-semibold"
                >
                  {t('loginNow') || 'Đăng nhập ngay'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section - Clean & Professional */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        
        <div className="container py-6 md:py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('itemShop') || 'Item Shop'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {t('itemShop') || 'Item Shop'}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
              {t('itemShopDesc') || 'Khám phá các vật phẩm độc quyền để cá nhân hóa hồ sơ của bạn'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation - Mobile optimized */}
          <TabsList className="w-full h-auto p-1 bg-muted/50 backdrop-blur-sm grid grid-cols-4 gap-1">
            {[
              { value: 'prime', icon: Crown, label: 'Prime' },
              { value: 'colors', icon: Palette, label: t('nameColors') || 'Màu tên' },
              { value: 'effects', icon: Sparkles, label: t('effects') || 'Hiệu ứng' },
              { value: 'frames', icon: Frame, label: t('frames') || 'Khung' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-md",
                  "data-[state=active]:scale-[1.02]"
                )}
              >
                <tab.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", activeTab === tab.value ? 'text-primary' : '')} />
                <span className="text-[10px] sm:text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Prime Boost Tab */}
          <TabsContent value="prime" className="mt-6">
            <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Lỗi tải Prime Boost</div>}>
              <PrimeBoostShop />
            </ErrorBoundary>
          </TabsContent>

          {/* Name Colors Tab */}
          <TabsContent value="colors" className="mt-6">
            <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Lỗi tải Màu tên</div>}>
              <NameColorShop />
            </ErrorBoundary>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="mt-6">
            <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Lỗi tải Hiệu ứng</div>}>
              <PrimeEffectsShop />
            </ErrorBoundary>
          </TabsContent>

          {/* Avatar Frames Tab */}
          <TabsContent value="frames" className="mt-6">
            <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Lỗi tải Khung Avatar</div>}>
              <AvatarFrameShop />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ShopPage;
