import { useState, useMemo } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Store, Package, ShoppingCart, Wallet, Eye, TrendingUp,
  Loader2, Clock, Ban, Star, ShieldCheck, BadgeCheck, ChevronDown,
  Ticket, MessageSquare, FileText, MessagesSquare, Gavel, Pin, Zap,
  UserX, Layers, BarChart3, Settings, Brain, ScrollText, Boxes,
  Palette, Webhook, Shield, HandCoins, Home, Menu, ChevronRight,
  Users, FileCode, Award
} from 'lucide-react';
import { useCurrentSeller, useMySellerOrders } from '@/hooks/useMarketplace';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { PartnerBadge } from '@/components/ui/partner-badge';

// Navigation structure for GAME ACCOUNT shops
const createGameAccountNavigation = (t: (key: string) => string) => [
  {
    id: 'overview',
    label: t('sellerNavOverview'),
    icon: Home,
    path: '/seller',
    isLink: true,
  },
  {
    id: 'products',
    label: t('sellerNavProducts'),
    icon: Package,
    items: [
      { path: '/seller/products', label: t('sellerManageProducts'), icon: Package },
      { path: '/seller/inventory', label: t('sellerInventory'), icon: Boxes },
      { path: '/seller/combos', label: t('sellerCombos'), icon: Layers },
    ],
  },
  {
    id: 'sales',
    label: t('sellerNavSales'),
    icon: ShoppingCart,
    items: [
      { path: '/seller/orders', label: t('sellerOrdersNav'), icon: ShoppingCart },
      { path: '/seller/handover', label: t('sellerHandover'), icon: HandCoins },
      { path: '/seller/auctions', label: t('sellerAuctions'), icon: Gavel },
    ],
  },
  {
    id: 'marketing',
    label: t('sellerNavMarketing'),
    icon: Zap,
    items: [
      { path: '/seller/vouchers', label: t('sellerVouchers'), icon: Ticket },
      { path: '/seller/flash-sale', label: t('sellerFlashSale'), icon: Zap },
      { path: '/seller/boost', label: t('sellerBoostProducts'), icon: Pin },
      { path: '/seller/posts', label: t('sellerPosts'), icon: FileText },
    ],
  },
  {
    id: 'finance',
    label: t('sellerNavFinance'),
    icon: Wallet,
    items: [
      { path: '/seller/wallet', label: t('sellerWallet'), icon: Wallet },
      { path: '/seller/stats', label: t('sellerRevenueStats'), icon: BarChart3 },
      { path: '/seller/insights', label: t('sellerInsights'), icon: TrendingUp },
    ],
  },
  {
    id: 'support',
    label: t('sellerNavSupport'),
    icon: MessageSquare,
    items: [
      { path: '/seller/chat', label: t('sellerCustomerMessages'), icon: MessagesSquare },
      { path: '/seller/tickets', label: t('sellerSupportTickets'), icon: MessageSquare },
      { path: '/seller/ai-assistant', label: t('sellerAiAssistant'), icon: Brain },
    ],
  },
  {
    id: 'settings',
    label: t('sellerNavSettings'),
    icon: Settings,
    items: [
      { path: '/seller/settings', label: t('sellerSettingsNav'), icon: Settings },
      { path: '/seller/branding', label: t('sellerBranding'), icon: Palette },
      { path: '/seller/policies', label: t('sellerPolicies'), icon: ScrollText },
      { path: '/seller/risk', label: t('sellerRiskControl'), icon: Shield },
      { path: '/seller/blacklist', label: t('sellerBlacklist'), icon: UserX },
      { path: '/seller/webhooks', label: t('sellerWebhooks'), icon: Webhook },
    ],
  },
];

// Navigation structure for DESIGN shops
const createDesignShopNavigation = (t: (key: string) => string) => [
  {
    id: 'overview',
    label: t('sellerNavOverview'),
    icon: Home,
    path: '/seller',
    isLink: true,
  },
  {
    id: 'design',
    label: t('sellerNavDesign') || 'Dịch vụ',
    icon: Palette,
    items: [
      { path: '/seller/design-services', label: t('sellerDesignServices') || 'Quản lý dịch vụ', icon: Palette },
      { path: '/seller/design-orders', label: t('sellerDesignOrders') || 'Đơn hàng thiết kế', icon: ShoppingCart },
      { path: '/seller/design-templates', label: 'Mẫu form', icon: FileCode },
      { path: '/seller/design-team', label: 'Đội ngũ', icon: Users },
      { path: '/seller/design-nda', label: 'NDA & Bảo mật', icon: Shield },
      { path: '/seller/design-stats', label: 'Thống kê', icon: BarChart3 },
      { path: '/seller/design-rewards', label: 'Thưởng & Phạt', icon: Award },
    ],
  },
  {
    id: 'marketing',
    label: t('sellerNavMarketing'),
    icon: Zap,
    items: [
      { path: '/seller/vouchers', label: t('sellerVouchers'), icon: Ticket },
      { path: '/seller/posts', label: t('sellerPosts'), icon: FileText },
    ],
  },
  {
    id: 'finance',
    label: t('sellerNavFinance'),
    icon: Wallet,
    items: [
      { path: '/seller/wallet', label: t('sellerWallet'), icon: Wallet },
      { path: '/seller/stats', label: t('sellerRevenueStats'), icon: BarChart3 },
      { path: '/seller/insights', label: t('sellerInsights'), icon: TrendingUp },
    ],
  },
  {
    id: 'support',
    label: t('sellerNavSupport'),
    icon: MessageSquare,
    items: [
      { path: '/seller/chat', label: t('sellerCustomerMessages'), icon: MessagesSquare },
      { path: '/seller/tickets', label: t('sellerSupportTickets'), icon: MessageSquare },
      { path: '/seller/ai-assistant', label: t('sellerAiAssistant'), icon: Brain },
    ],
  },
  {
    id: 'settings',
    label: t('sellerNavSettings'),
    icon: Settings,
    items: [
      { path: '/seller/settings', label: t('sellerSettingsNav'), icon: Settings },
      { path: '/seller/branding', label: t('sellerBranding'), icon: Palette },
      { path: '/seller/policies', label: t('sellerPolicies'), icon: ScrollText },
      { path: '/seller/blacklist', label: t('sellerBlacklist'), icon: UserX },
    ],
  },
];

// Function to get navigation based on shop type
const createNavigationGroups = (t: (key: string) => string, shopType?: string) => {
  if (shopType === 'design') {
    return createDesignShopNavigation(t);
  }
  return createGameAccountNavigation(t);
};

type NavigationGroup = ReturnType<typeof createNavigationGroups>[number];


interface NavItemProps {
  group: NavigationGroup;
  currentPath: string;
}

const NavItem = ({ group, currentPath }: NavItemProps) => {
  const isActive = group.isLink 
    ? currentPath === group.path 
    : group.items?.some(item => currentPath.startsWith(item.path));

  if (group.isLink) {
    return (
      <Link to={group.path!}>
        <Button
          variant="ghost"
          className={cn(
            "h-9 px-3 gap-2 text-sm",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          <group.icon className="h-4 w-4" />
          <span className="hidden lg:inline">{group.label}</span>
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-9 px-3 gap-2 text-sm",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          <group.icon className="h-4 w-4" />
          <span className="hidden lg:inline">{group.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {group.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items?.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link 
              to={item.path} 
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                currentPath.startsWith(item.path) && "bg-primary/10 text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Mobile sidebar navigation
interface MobileSidebarNavProps {
  currentPath: string;
  onNavigate: () => void;
  navigationGroups: NavigationGroup[];
}

const MobileSidebarNav = ({ currentPath, onNavigate, navigationGroups }: MobileSidebarNavProps) => {
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-1 p-2">
        {navigationGroups.map((group) => {
          const isActive = group.isLink 
            ? currentPath === group.path 
            : group.items?.some(item => currentPath.startsWith(item.path));
          const isOpen = openGroups.includes(group.id) || isActive;

          if (group.isLink) {
            return (
              <Link key={group.id} to={group.path!} onClick={onNavigate}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <group.icon className="h-5 w-5" />
                  <span className="font-medium">{group.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Collapsible 
              key={group.id} 
              open={isOpen} 
              onOpenChange={() => toggleGroup(group.id)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-5 w-5" />
                    <span className="font-medium">{group.label}</span>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-90"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-4">
                  {group.items?.map((item) => (
                    <Link key={item.path} to={item.path} onClick={onNavigate}>
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          currentPath.startsWith(item.path)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default function SellerDashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { data: seller, isLoading } = useCurrentSeller();
  const { data: orders = [] } = useMySellerOrders();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navigationGroups = useMemo(() => createNavigationGroups(t, seller?.shop_type), [t, seller?.shop_type]);

  const pendingOrders = orders.filter(o => o.status === 'paid');

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-3">{t('sellerLoginToContinue')}</h2>
            <p className="text-muted-foreground mb-6">{t('sellerNeedLogin')}</p>
            <Link to="/auth">
              <Button size="lg">{t('login')}</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!seller) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('sellerOpenShop')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('sellerStartEarning')}
            </p>
            <Link to="/shops/register">
              <Button size="lg">{t('sellerRegisterNow')}</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (seller.status === 'pending') {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('sellerPendingApproval')}</h2>
            <p className="text-muted-foreground">
              {t('sellerPendingApprovalDesc')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (seller.status === 'suspended' || seller.status === 'rejected') {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {seller.status === 'suspended' ? t('sellerShopSuspended') : t('sellerRequestRejected')}
            </h2>
            <p className="text-muted-foreground">{seller.admin_notes || t('sellerContactAdmin')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        {/* Top Header */}
        <div className="border-b bg-background/95 backdrop-blur-sm sticky top-16 z-20">
          <div className="container">
            {/* Shop Info Row */}
            <div className="flex items-center justify-between py-3 gap-2">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={seller.shop_avatar_url || undefined} />
                          <AvatarFallback><Store className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span className="truncate">{seller.shop_name}</span>
                        {seller.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
                        )}
                        {seller.is_partner && (
                          <PartnerBadge size="sm" variant="icon-only" />
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <MobileSidebarNav 
                      currentPath={location.pathname} 
                      onNavigate={() => setSidebarOpen(false)}
                      navigationGroups={navigationGroups}
                    />
                  </SheetContent>
                </Sheet>
              )}

              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-primary/20 shrink-0">
                  <AvatarImage src={seller.shop_avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h1 className="font-bold text-sm md:text-base truncate">{seller.shop_name}</h1>
                    {seller.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
                    )}
                    {seller.is_partner && (
                      <PartnerBadge size="sm" variant="icon-only" />
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {seller.rating_average.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                      {seller.trust_score}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Stats - Hidden on mobile */}
                <div className="hidden lg:flex items-center gap-4 mr-2">
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{formatPrice(seller.balance)}</p>
                    <p className="text-xs text-muted-foreground">{t('sellerBalance')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{formatPrice(seller.total_revenue)}</p>
                    <p className="text-xs text-muted-foreground">{t('sellerTotalRevenue')}</p>
                  </div>
                </div>

                {pendingOrders.length > 0 && (
                  <Link to="/seller/orders">
                    <Badge variant="destructive" className="gap-1 py-1 px-2">
                      <ShoppingCart className="h-3 w-3" />
                      <span className="hidden sm:inline">{pendingOrders.length} {t('sellerWaitingDeliveryCount')}</span>
                      <span className="sm:hidden">{pendingOrders.length}</span>
                    </Badge>
                  </Link>
                )}

                <Link to={`/shops/${seller.shop_slug}`}>
                  <Button variant="outline" size="sm" className="gap-1 h-8 px-2 md:px-3">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('sellerViewShop')}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Desktop Navigation Row */}
            {!isMobile && (
              <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
                {navigationGroups.map((group) => (
                  <NavItem key={group.id} group={group} currentPath={location.pathname} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-4 md:py-6">
          <Outlet context={{ seller, orders, formatPrice }} />
        </div>

      </div>
    </Layout>
  );
}

// Hook to access seller context in child routes
export function useSellerDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = (window as any).__SELLER_DASHBOARD_CONTEXT__;
  return context || { seller: null, orders: [], formatPrice: (v: number) => v };
}
