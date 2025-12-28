import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAvatarFrames, useUserAvatarFrames } from '@/hooks/useAvatarFrames';
import {
  Settings,
  Plus,
  History,
  ShoppingBag,
  Heart,
  Ticket,
  Shield,
  Gift,
  Trophy,
  Coins,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu,
  Package,
  Mail
} from 'lucide-react';

const menuItems = [
  { key: 'account', path: '/settings', icon: Settings, label: 'accountSettings' },
  { key: 'deposit', path: '/settings/deposit', icon: Plus, label: 'walletDeposit' },
  { key: 'history', path: '/settings/history', icon: History, label: 'transactionHistory' },
  { key: 'orders', path: '/settings/orders', icon: ShoppingBag, label: 'orderHistory' },
  { key: 'wishlist', path: '/settings/wishlist', icon: Heart, label: 'wishlist' },
  { key: 'vouchers', path: '/settings/vouchers', icon: Ticket, label: 'vouchers' },
  { key: 'items', path: '/settings/items', icon: Package, label: 'myItems' },
  { key: 'security', path: '/settings/security', icon: Shield, label: 'securitySettings' },
  { key: 'email', path: '/settings/email', icon: Mail, label: 'emailSettings' },
  { key: 'rewards', path: '/settings/rewards', icon: Gift, label: 'rewardsPoints' },
  { key: 'achievements', path: '/settings/achievements', icon: Trophy, label: 'achievementsTab' },
];

export function SettingsLayout() {
  const { profile, vipLevel } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: frames } = useAvatarFrames();
  const { data: userOwnedFrames = [] } = useUserAvatarFrames();

  if (!profile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Find active frame
  const userActiveFrame = userOwnedFrames.find((uf: any) => uf.is_active);
  const activeFrame = userActiveFrame
    ? frames?.find((f: any) => f.id === userActiveFrame.frame_id)
    : null;

  const initials = profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?';

  const isActive = (path: string) => {
    if (path === '/settings') {
      return location.pathname === '/settings';
    }
    return location.pathname.startsWith(path);
  };

  const getCurrentPageLabel = () => {
    const current = menuItems.find(item => isActive(item.path));
    return current ? t(current.label) : t('settings');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* User Info */}
      {!collapsed && (
        <div className="mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              {activeFrame && (
                <img 
                  src={activeFrame.image_url} 
                  alt="Avatar frame"
                  className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] z-10 pointer-events-none"
                />
              )}
              <Avatar 
                className="h-12 w-12 border-2 border-background shadow-md"
                style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
              >
                <AvatarImage 
                  src={profile?.avatar_url || ''} 
                  style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                />
                <AvatarFallback 
                  className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                  style={{ borderRadius: activeFrame?.avatar_border_radius || '50%' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {profile.full_name || profile.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {(profile as any)?.has_prime_boost && <PrimeBadge size="sm" />}
                <VipBadge levelName={vipLevel?.name} size="sm" />
              </div>
            </div>
          </div>
          
          {/* Balance */}
          <div className="mt-4 p-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('balance')}</span>
            </div>
            <p className="text-lg font-bold text-primary mt-1">
              {formatPrice(profile.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.key}
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                active && "bg-primary/10 text-primary font-medium",
                collapsed && "justify-center px-2"
              )}
              onClick={() => handleNavigate(item.path)}
            >
              <Icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
              {!collapsed && (
                <span className="truncate">{t(item.label)}</span>
              )}
            </Button>
          );
        })}
      </nav>
    </>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* Mobile Header with Sheet */}
          <div className="md:hidden mb-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    <span>{getCurrentPageLabel()}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>{t('settings')}</SheetTitle>
                </SheetHeader>
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6">
            {/* Desktop Sidebar */}
            <aside className={cn(
              "shrink-0 transition-all duration-300 hidden md:block",
              sidebarCollapsed ? "w-16" : "w-64"
            )}>
              <Card className="sticky top-20 border-border/50 shadow-lg backdrop-blur-sm bg-background/95">
                <CardContent className="p-4">
                  <SidebarContent collapsed={sidebarCollapsed} />

                  {/* Collapse Toggle */}
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                      {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <>
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          {t('collapse')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              <Outlet context={{ profile, vipLevel, formatPrice, t }} />
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
