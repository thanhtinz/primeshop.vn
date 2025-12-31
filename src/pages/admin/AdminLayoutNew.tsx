import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Ticket,
  Users,
  UserPlus,
  Settings,
  Mail,
  LogOut,
  Menu,
  CreditCard,
  Bell,
  Image,
  MessageSquare,
  Newspaper,
  Gift,
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Send,
  Key,
  Languages,
  ChevronDown,
  ChevronRight,
  Globe,
  Headphones,
  Megaphone,
  Sticker,
  Crown,
  Palette,
  FileText,
  DollarSign,
  BarChart3,
  Shield,
  AlertTriangle,
  Handshake,
  Music,
  Search,
  X,
  Moon,
  Sun,
  Database,
  Lock,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';

interface NavItem {
  icon: LucideIcon;
  labelKey: string;
  label: string;
  path: string;
  badge?: string;
}

interface NavGroup {
  icon: LucideIcon;
  labelKey: string;
  label: string;
  items: NavItem[];
  pathPrefix: string;
}

// Admin Navigation Config
const getNavConfig = (t: (key: string) => string): { standalone: NavItem[], groups: NavGroup[] } => ({
  standalone: [
    { icon: LayoutDashboard, labelKey: 'admin.dashboard', label: t('admin.dashboard') || 'Dashboard', path: '/admin' },
  ],
  groups: [
    {
      icon: Package,
      labelKey: 'admin.products',
      label: t('admin.products') || 'Sản phẩm',
      pathPrefix: '/admin/products|/admin/categories|/admin/bundles|/admin/flash-sales',
      items: [
        { icon: FolderOpen, labelKey: 'admin.categories', label: t('admin.categories') || 'Danh mục', path: '/admin/categories' },
        { icon: Package, labelKey: 'admin.products', label: t('admin.products') || 'Sản phẩm', path: '/admin/products' },
        { icon: Package, labelKey: 'admin.bundles', label: t('admin.bundles') || 'Combo/Bundle', path: '/admin/bundles' },
        { icon: Zap, labelKey: 'admin.flashSales', label: t('admin.flashSales') || 'Flash Sale', path: '/admin/flash-sales' },
      ],
    },
    {
      icon: ShoppingCart,
      labelKey: 'admin.orders',
      label: t('admin.orders') || 'Đơn hàng & Thanh toán',
      pathPrefix: '/admin/orders|/admin/payments|/admin/revenue',
      items: [
        { icon: TrendingUp, labelKey: 'admin.revenue', label: t('admin.revenue') || 'Thống kê doanh thu', path: '/admin/revenue' },
        { icon: ShoppingCart, labelKey: 'admin.orders', label: t('admin.orders') || 'Đơn hàng', path: '/admin/orders' },
        { icon: CreditCard, labelKey: 'admin.payments', label: t('admin.payments') || 'Thanh toán', path: '/admin/payments' },
      ],
    },
    {
      icon: Users,
      labelKey: 'admin.customers',
      label: t('admin.customers') || 'Khách hàng',
      pathPrefix: '/admin/users|/admin/vouchers|/admin/prime-boost',
      items: [
        { icon: Users, labelKey: 'admin.users', label: t('admin.users') || 'Người dùng', path: '/admin/users' },
        { icon: Ticket, labelKey: 'admin.vouchers', label: t('admin.vouchers') || 'Vouchers', path: '/admin/vouchers' },
        { icon: Crown, labelKey: 'admin.primeBoost', label: t('admin.primeBoost') || 'Prime Boost', path: '/admin/prime-boost' },
      ],
    },
    {
      icon: UserPlus,
      labelKey: 'admin.referralEvents',
      label: t('admin.referralEvents') || 'Giới thiệu & Sự kiện',
      pathPrefix: '/admin/referral|/admin/events|/admin/rewards',
      items: [
        { icon: UserPlus, labelKey: 'admin.referralRegistrations', label: t('admin.referralRegistrations') || 'Đăng ký GT', path: '/admin/referral-registrations' },
        { icon: Users, labelKey: 'admin.referralCodes', label: t('admin.referralCodes') || 'Mã giới thiệu', path: '/admin/referrals' },
        { icon: Gift, labelKey: 'admin.events', label: t('admin.events') || 'Sự kiện', path: '/admin/events' },
        { icon: Trophy, labelKey: 'admin.rewards', label: t('admin.rewards') || 'Điểm thưởng & Thành tựu', path: '/admin/rewards' },
      ],
    },
    {
      icon: Newspaper,
      labelKey: 'admin.content',
      label: t('admin.content') || 'Nội dung',
      pathPrefix: '/admin/hero-banners|/admin/news|/admin/reviews|/admin/posts|/admin/stories|/admin/notes|/admin/partners',
      items: [
        { icon: Image, labelKey: 'admin.heroBanners', label: t('admin.heroBanners') || 'Hero Banners', path: '/admin/hero-banners' },
        { icon: Newspaper, labelKey: 'admin.news', label: t('admin.news') || 'Tin tức', path: '/admin/news' },
        { icon: Star, labelKey: 'admin.reviews', label: t('admin.reviews') || 'Đánh giá', path: '/admin/reviews' },
        { icon: Newspaper, labelKey: 'admin.posts', label: t('admin.posts') || 'Bài viết (Newsfeed)', path: '/admin/posts' },
        { icon: Image, labelKey: 'admin.stories', label: t('admin.stories') || 'Stories', path: '/admin/stories' },
        { icon: MessageSquare, labelKey: 'admin.notes', label: t('admin.notes') || 'Ghi chú', path: '/admin/notes' },
        { icon: Handshake, labelKey: 'admin.partners', label: t('admin.partners') || 'Đối tác', path: '/admin/partners' },
      ],
    },
    {
      icon: Headphones,
      labelKey: 'admin.support',
      label: t('admin.support') || 'Hỗ trợ',
      pathPrefix: '/admin/chat|/admin/tickets|/admin/stickers',
      items: [
        { icon: MessageSquare, labelKey: 'admin.liveChat', label: t('admin.liveChat') || 'Live Chat', path: '/admin/chat' },
        { icon: MessageSquare, labelKey: 'admin.tickets', label: t('admin.tickets') || 'Ticket hỗ trợ', path: '/admin/tickets' },
        { icon: Sticker, labelKey: 'admin.stickers', label: t('admin.stickers') || 'Quản lý Sticker', path: '/admin/stickers' },
      ],
    },
    {
      icon: Megaphone,
      labelKey: 'admin.notifications',
      label: t('admin.notifications') || 'Thông báo & Email',
      pathPrefix: '/admin/email|/admin/bulk-email|/admin/notifications',
      items: [
        { icon: Mail, labelKey: 'admin.email', label: t('admin.email') || 'Email', path: '/admin/email' },
        { icon: Send, labelKey: 'admin.bulkEmail', label: t('admin.bulkEmail') || 'Gửi email hàng loạt', path: '/admin/bulk-email' },
        { icon: Bell, labelKey: 'admin.notifications', label: t('admin.notifications') || 'Thông báo', path: '/admin/notifications' },
      ],
    },
    {
      icon: Globe,
      labelKey: 'admin.smmPanel',
      label: t('admin.smmPanel') || 'SMM Panel',
      pathPrefix: '/admin/smm',
      items: [
        { icon: Settings, labelKey: 'admin.smmConfig', label: t('admin.smmConfig') || 'Cấu hình API', path: '/admin/smm-config' },
        { icon: Globe, labelKey: 'admin.smmPlatforms', label: t('admin.smmPlatforms') || 'Nền tảng', path: '/admin/smm-platforms' },
        { icon: FolderOpen, labelKey: 'admin.smmServiceTypes', label: t('admin.smmServiceTypes') || 'Loại dịch vụ', path: '/admin/smm-service-types' },
        { icon: Package, labelKey: 'admin.smmServices', label: t('admin.smmServices') || 'Gói dịch vụ', path: '/admin/smm-services' },
        { icon: ShoppingCart, labelKey: 'admin.smmOrders', label: t('admin.smmOrders') || 'Đơn hàng SMM', path: '/admin/smm-orders' },
      ],
    },
    {
      icon: ShoppingCart,
      labelKey: 'admin.marketplace',
      label: t('admin.marketplace') || 'Chợ (Marketplace)',
      pathPrefix: '/admin/marketplace|/admin/boost-pricing|/admin/design',
      items: [
        { icon: Users, labelKey: 'admin.shopManagement', label: t('admin.shopManagement') || 'Quản lý cửa hàng', path: '/admin/marketplace' },
        { icon: Zap, labelKey: 'admin.boostPricing', label: t('admin.boostPricing') || 'Giá ghim sản phẩm', path: '/admin/boost-pricing' },
        { icon: ShoppingCart, labelKey: 'admin.designOrders', label: t('admin.designOrders') || 'Đơn hàng Design', path: '/admin/design-orders' },
        { icon: AlertTriangle, labelKey: 'admin.designAbuse', label: t('admin.designAbuse') || 'Báo cáo vi phạm', path: '/admin/design-abuse' },
      ],
    },
    {
      icon: Settings,
      labelKey: 'admin.settings',
      label: t('admin.settings') || 'Cài đặt',
      pathPrefix: '/admin/translations|/admin/settings|/admin/static-pages|/admin/secrets',
      items: [
        { icon: Settings, labelKey: 'admin.generalSettings', label: t('admin.generalSettings') || 'Cài đặt chung', path: '/admin/settings' },
        { icon: Lock, labelKey: 'admin.secrets', label: t('admin.secrets') || 'API Keys & Secrets', path: '/admin/secrets', badge: 'NEW' },
        { icon: Languages, labelKey: 'admin.translations', label: t('admin.translations') || 'Bản dịch', path: '/admin/translations' },
        { icon: FileText, labelKey: 'admin.staticPages', label: t('admin.staticPages') || 'Trang tĩnh & MXH', path: '/admin/static-pages' },
        { icon: Database, labelKey: 'admin.apiChangelog', label: t('admin.apiChangelog') || 'API Changelog', path: '/admin/api-changelog' },
      ],
    },
  ],
});

const AdminLayoutNew = () => {
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navConfig = getNavConfig(t);

  // Initialize open states based on current path
  const getInitialOpenStates = () => {
    const states: Record<string, boolean> = {};
    navConfig.groups.forEach((group) => {
      const prefixes = group.pathPrefix.split('|');
      states[group.labelKey] = prefixes.some(prefix => location.pathname.startsWith(prefix));
    });
    return states;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenStates);

  // Update open states when location changes
  useEffect(() => {
    const newStates = getInitialOpenStates();
    setOpenGroups(prev => {
      const updated = { ...prev };
      Object.entries(newStates).forEach(([key, shouldBeOpen]) => {
        if (shouldBeOpen && !prev[key]) {
          updated[key] = true;
        }
      });
      return updated;
    });
  }, [location.pathname]);

  const toggleGroup = (labelKey: string) => {
    setOpenGroups(prev => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

  const isGroupActive = (group: NavGroup) => {
    const prefixes = group.pathPrefix.split('|');
    return prefixes.some(prefix => location.pathname.startsWith(prefix));
  };

  // Filter nav items based on search
  const filterNavItems = (items: NavItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{t('loading') || 'Đang tải...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo & Title */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{t('admin.panel') || 'Admin Panel'}</h1>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('admin.searchMenu') || 'Tìm kiếm menu...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {/* Standalone items */}
          {navConfig.standalone.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          {/* Grouped items */}
          {navConfig.groups.map((group) => {
            const filteredItems = filterNavItems(group.items);
            if (searchQuery && filteredItems.length === 0) return null;

            return (
              <Collapsible
                key={group.labelKey}
                open={searchQuery ? true : openGroups[group.labelKey]}
                onOpenChange={() => !searchQuery && toggleGroup(group.labelKey)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isGroupActive(group) ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-between gap-3 h-10',
                      isGroupActive(group) && 'bg-primary/10 text-primary hover:bg-primary/15'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <group.icon className="h-4 w-4" />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform flex-shrink-0',
                        (searchQuery || openGroups[group.labelKey]) && 'rotate-180'
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
                  {filteredItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => isMobile && setSidebarOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            'w-full justify-start gap-2 h-9 text-sm',
                            isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 border-t space-y-2">
        {/* Theme & Language */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          >
            <Globe className="h-4 w-4 mr-2" />
            {language === 'vi' ? 'EN' : 'VI'}
          </Button>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {t('admin.logout') || 'Đăng xuất'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r bg-background flex-col fixed inset-y-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 xl:ml-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 flex items-center justify-between gap-4">
          {/* Mobile Menu Trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
              <NavContent isMobile />
            </SheetContent>
          </Sheet>

          {/* Page Title - Mobile */}
          <h2 className="font-semibold text-lg lg:hidden truncate">
            {t('admin.panel') || 'Admin'}
          </h2>

          {/* Spacer */}
          <div className="flex-1 hidden lg:block" />

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('admin.settings') || 'Cài đặt'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" target="_blank">
                    <Globe className="mr-2 h-4 w-4" />
                    {t('admin.viewSite') || 'Xem trang web'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('admin.logout') || 'Đăng xuất'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutNew;
