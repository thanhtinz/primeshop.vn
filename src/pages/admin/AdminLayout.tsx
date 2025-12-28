import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  History,
  Languages,
  ChevronDown,
  Globe,
  Headphones,
  Megaphone,
  Sticker,
  Crown,
  Link2,
  Palette,
  FileText,
  DollarSign,
  BarChart3,
  Shield,
  AlertTriangle,
  Handshake,
  Music,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface NavGroup {
  icon: LucideIcon;
  label: string;
  items: NavItem[];
  pathPrefix: string;
}

// Standalone items (always visible)
const standaloneItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
];

// Grouped nav items
const navGroups: NavGroup[] = [
  {
    icon: Package,
    label: 'Sản phẩm',
    pathPrefix: '/admin/products|/admin/categories|/admin/bundles|/admin/flash-sales',
    items: [
      { icon: FolderOpen, label: 'Danh mục', path: '/admin/categories' },
      { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
      { icon: Package, label: 'Combo/Bundle', path: '/admin/bundles' },
      { icon: Zap, label: 'Flash Sale', path: '/admin/flash-sales' },
    ],
  },
  {
    icon: ShoppingCart,
    label: 'Đơn hàng & Thanh toán',
    pathPrefix: '/admin/orders|/admin/payments|/admin/revenue',
    items: [
      { icon: TrendingUp, label: 'Thống kê doanh thu', path: '/admin/revenue' },
      { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
      { icon: CreditCard, label: 'Thanh toán', path: '/admin/payments' },
    ],
  },
  {
    icon: Users,
    label: 'Khách hàng',
    pathPrefix: '/admin/users|/admin/vouchers|/admin/prime-boost',
    items: [
      { icon: Users, label: 'Người dùng', path: '/admin/users' },
      { icon: Ticket, label: 'Vouchers', path: '/admin/vouchers' },
      { icon: Crown, label: 'Prime Boost', path: '/admin/prime-boost' },
    ],
  },
  {
    icon: UserPlus,
    label: 'Giới thiệu & Sự kiện',
    pathPrefix: '/admin/referral|/admin/events|/admin/rewards',
    items: [
      { icon: UserPlus, label: 'Đăng ký GT', path: '/admin/referral-registrations' },
      { icon: Users, label: 'Mã giới thiệu', path: '/admin/referrals' },
      { icon: Gift, label: 'Sự kiện', path: '/admin/events' },
      { icon: Trophy, label: 'Điểm thưởng & Thành tựu', path: '/admin/rewards' },
    ],
  },
  {
    icon: Newspaper,
    label: 'Nội dung',
    pathPrefix: '/admin/hero-banners|/admin/news|/admin/reviews|/admin/posts|/admin/stories|/admin/notes|/admin/partners|/admin/background-music',
    items: [
      { icon: Image, label: 'Hero Banners', path: '/admin/hero-banners' },
      { icon: Newspaper, label: 'Tin tức', path: '/admin/news' },
      { icon: Star, label: 'Đánh giá', path: '/admin/reviews' },
      { icon: Newspaper, label: 'Bài viết (Newsfeed)', path: '/admin/posts' },
      { icon: Image, label: 'Stories', path: '/admin/stories' },
      { icon: MessageSquare, label: 'Ghi chú', path: '/admin/notes' },
      { icon: Handshake, label: 'Đối tác', path: '/admin/partners' },
      { icon: Music, label: 'Nhạc nền', path: '/admin/background-music' },
    ],
  },
  {
    icon: Headphones,
    label: 'Hỗ trợ',
    pathPrefix: '/admin/chat|/admin/tickets|/admin/stickers',
    items: [
      { icon: MessageSquare, label: 'Live Chat', path: '/admin/chat' },
      { icon: MessageSquare, label: 'Ticket hỗ trợ', path: '/admin/tickets' },
      { icon: Sticker, label: 'Quản lý Sticker', path: '/admin/stickers' },
    ],
  },
  {
    icon: Megaphone,
    label: 'Thông báo & Email',
    pathPrefix: '/admin/email|/admin/bulk-email|/admin/notifications',
    items: [
      { icon: Mail, label: 'Email', path: '/admin/email' },
      { icon: Send, label: 'Gửi email hàng loạt', path: '/admin/bulk-email' },
      { icon: Bell, label: 'Thông báo', path: '/admin/notifications' },
    ],
  },
  {
    icon: Settings,
    label: 'Cài đặt',
    pathPrefix: '/admin/translations|/admin/settings|/admin/static-pages',
    items: [
      { icon: Languages, label: 'Bản dịch', path: '/admin/translations' },
      { icon: Settings, label: 'Cài đặt chung', path: '/admin/settings' },
      { icon: FileText, label: 'Trang tĩnh & MXH', path: '/admin/static-pages' },
    ],
  },
  {
    icon: Globe,
    label: 'SMM Panel',
    pathPrefix: '/admin/smm',
    items: [
      { icon: Settings, label: 'Cấu hình API', path: '/admin/smm-config' },
      { icon: Globe, label: 'Nền tảng', path: '/admin/smm-platforms' },
      { icon: FolderOpen, label: 'Loại dịch vụ', path: '/admin/smm-service-types' },
      { icon: Package, label: 'Gói dịch vụ', path: '/admin/smm-services' },
      { icon: ShoppingCart, label: 'Đơn hàng SMM', path: '/admin/smm-orders' },
    ],
  },
  {
    icon: ShoppingCart,
    label: 'Chợ (Marketplace)',
    pathPrefix: '/admin/marketplace|/admin/boost-pricing|/admin/design',
    items: [
      { icon: Users, label: 'Quản lý cửa hàng', path: '/admin/marketplace' },
      { icon: Zap, label: 'Giá ghim sản phẩm', path: '/admin/boost-pricing' },
      { icon: AlertTriangle, label: 'Báo cáo vi phạm', path: '/admin/design-abuse' },
    ],
  },
];


const AdminLayout = () => {
  const { user, isAdmin, isLoading, signOut } = useAdminAuth();
  const location = useLocation();
  
  // Initialize open states based on current path
  const getInitialOpenStates = () => {
    const states: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      const prefixes = group.pathPrefix.split('|');
      states[group.label] = prefixes.some(prefix => location.pathname.startsWith(prefix));
    });
    return states;
  };
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenStates);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (group: NavGroup) => {
    const prefixes = group.pathPrefix.split('|');
    return prefixes.some(prefix => location.pathname.startsWith(prefix));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {/* Standalone items */}
          {standaloneItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-3', isActive && 'bg-secondary')}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          {/* Grouped items */}
          {navGroups.map((group) => (
            <Collapsible 
              key={group.label} 
              open={openGroups[group.label]} 
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={isGroupActive(group) ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-between gap-3', isGroupActive(group) && 'bg-secondary')}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    {group.label}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", openGroups[group.label] && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn('w-full justify-start gap-2', isActive && 'bg-secondary')}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r flex-col">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-bold">Admin</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" aria-describedby={undefined}>
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
