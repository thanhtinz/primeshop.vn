import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SeasonalParticles } from '@/components/effects/SeasonalParticles';
import { BackToTop } from '@/components/ui/back-to-top';
import { ProductComparisonBar } from '@/components/product/ProductComparisonBar';
import { RecentlyViewedSection } from '@/components/product/RecentlyViewedSection';
import { useUpdateOnlineStatus } from '@/hooks/useOnlineStatus';
import { DailyCheckinWidget } from '@/components/checkin/DailyCheckinWidget';
import { BackgroundDecorations } from '@/components/ui/background-decorations';

interface LayoutProps {
  children: ReactNode;
  showRecentlyViewed?: boolean;
}

export function Layout({ children, showRecentlyViewed = false }: LayoutProps) {
  // Track user online status
  useUpdateOnlineStatus();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Global background decorations */}
      <BackgroundDecorations />
      <SeasonalParticles />
      <Header />
      <main className="flex-1 pb-16 relative">{children}</main>
      {showRecentlyViewed && <RecentlyViewedSection />}
      <Footer />
      <BackToTop />
      <ProductComparisonBar />
      <DailyCheckinWidget />
    </div>
  );
}
