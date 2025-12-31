import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, User, Coins, LogIn, LogOut, ChevronDown, Gamepad2, Crown, Zap, Search, MessageSquare, Newspaper, Home, Gift, PartyPopper, Heart, Sun, Moon, Globe, Code, DollarSign, Loader2, Store, ShoppingBag, Users, MessagesSquare, Settings, Shield, Gavel, Wrench, ArrowLeftRight, Video, QrCode, Link2 as Link2Icon, Palette, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VipBadge } from '@/components/ui/vip-badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useCategories } from '@/hooks/useCategories';
import { useProductsByStyle } from '@/hooks/useProducts';
import { useActiveEvent } from '@/hooks/useEvents';
import { useActiveFlashSale } from '@/hooks/useFlashSales';
import { useCurrentSeller, useSellerProducts } from '@/hooks/useMarketplace';
import { useSellerDesignServices } from '@/hooks/useDesignServices';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { useUserRole } from '@/hooks/useUserRole';
import { useActiveAuctions } from '@/hooks/useAuctions';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Header() {
  const { totalItems } = useCart();
  const { user, profile, vipLevel, signOut, isLoading: authLoading } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { data: siteName } = useSiteSetting('site_name');
  const { data: siteLogo } = useSiteSetting('site_logo');
  const { data: categories } = useCategories();
  const { data: topupProducts } = useProductsByStyle('game_topup');
  const { data: activeEvent } = useActiveEvent();
  const { data: activeFlashSale } = useActiveFlashSale();
  const { data: currentSeller } = useCurrentSeller();
  const { data: sellerProducts = [] } = useSellerProducts(currentSeller?.id);
  const { data: sellerDesignServices = [] } = useSellerDesignServices(currentSeller?.id);
  const { data: frames } = useAvatarFrames();
  const { data: userRoleData } = useUserRole();
  const { data: activeAuctions } = useActiveAuctions();
  const userFrame = frames?.find(f => f.id === (profile as any)?.avatar_frame_id);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hasActiveAuctions = activeAuctions && activeAuctions.length > 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success(t('logout'));
  };

  // Filter categories by style
  const premiumCategories = categories?.filter(c => (c.style || 'premium') === 'premium') || [];
  const gameAccountCategories = categories?.filter(c => c.style === 'game_account') || [];
  const designCategories = categories?.filter(c => c.style === 'design') || [];

  const isActiveLink = (path: string) => location.pathname === path;
  const isActivePath = (path: string) => location.pathname.startsWith(path);
  
  // Helper to get category name based on language
  const getCategoryName = (category: { name: string; name_en?: string | null }) => {
    return language === 'en' && category.name_en ? category.name_en : category.name;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/50">
      {/* Main Header */}
      <div className="container flex h-12 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {siteLogo ? (
            <img src={String(siteLogo)} alt={String(siteName) || 'Logo'} className="h-10 md:h-12" />
          ) : (
            <span className="text-2xl font-bold text-primary">{String(siteName || 'DigiShop').replace(/"/g, '')}</span>
          )}
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="hidden lg:flex items-center gap-0">
          <Link 
            to="/" 
            className={cn(
              "px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
              isActiveLink('/') ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground/80 hover:text-foreground"
            )}
          >
            Home
          </Link>

          {/* Premium Dropdown */}
          {premiumCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
                  isActivePath('/category') && premiumCategories.some(c => location.pathname.includes(c.slug)) 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-accent text-foreground/80 hover:text-foreground"
                )}>
                  <Crown className="h-3 w-3" />
                  Premium
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-background border border-border shadow-lg">
                {premiumCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link to={`/category/${category.slug}`} className="cursor-pointer text-[13px]">
                      {getCategoryName(category)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Design Services Dropdown */}
          {designCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
                  isActivePath('/design') || (isActivePath('/category') && designCategories.some(c => location.pathname.includes(c.slug)))
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-accent text-foreground/80 hover:text-foreground"
                )}>
                  <Palette className="h-3 w-3" />
                  Design
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-background border border-border shadow-lg">
                <DropdownMenuItem asChild>
                  <Link to="/design" className="cursor-pointer font-medium text-[13px]">Design Services</Link>
                </DropdownMenuItem>
                {designCategories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {designCategories.map((category) => (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link to={`/design?category=${category.slug}`} className="cursor-pointer text-[13px]">
                          {getCategoryName(category)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Game Account Dropdown */}
          {gameAccountCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
                  isActivePath('/category') && gameAccountCategories.some(c => location.pathname.includes(c.slug))
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground/80 hover:text-foreground"
                )}>
                  <Gamepad2 className="h-3 w-3" />
                  Accounts
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-background border border-border shadow-lg">
                {gameAccountCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link to={`/category/${category.slug}`} className="cursor-pointer text-[13px]">
                      {getCategoryName(category)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* SMM */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
                isActivePath('/smm') ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground/80 hover:text-foreground"
              )}>
                <Globe className="h-3 w-3" />
                SMM
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-background border border-border w-44">
              <DropdownMenuItem asChild>
                <Link to="/smm/services" className="cursor-pointer text-[13px]">Services</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/smm/order" className="cursor-pointer text-[13px]">Place Order</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/smm/bulk" className="cursor-pointer text-[13px]">Bulk Order</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/smm/orders" className="cursor-pointer text-[13px]">Orders</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Utilities Dropdown - removed */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors",
                isActivePath('/utilities') ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground/80 hover:text-foreground"
              )}>
                <Wrench className="h-3 w-3" />
                Utilities
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-background border border-border shadow-lg">
              <DropdownMenuItem asChild>
                <Link to="/utilities/qr" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <QrCode className="h-3.5 w-3.5" />
                  QR Generator
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/utilities/money-split" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <DollarSign className="h-3.5 w-3.5" />
                  Money Split
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/utilities/checklist" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <Code className="h-3.5 w-3.5" />
                  Checklist
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/utilities/domain" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <Globe className="h-3.5 w-3.5" />
                  Domain Checker
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/utilities/download" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <Search className="h-3.5 w-3.5" />
                  Video Downloader
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/utilities/mail" className="cursor-pointer flex items-center gap-2 text-[13px]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Mail Checker
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* More Dropdown - only show when logged in */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors hover:bg-accent text-foreground/80 hover:text-foreground"
                )}>
                  More
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-background border border-border">
                <DropdownMenuItem asChild>
                  <Link to="/item-shop" className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Shop
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/referral" className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <Gift className="h-3.5 w-3.5" />
                    Referral
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/shops" className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <Store className="h-3.5 w-3.5" />
                    Marketplace
                  </Link>
                </DropdownMenuItem>
                {/* Groups removed */}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/support" className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/news" className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <Newspaper className="h-3.5 w-3.5" />
                    News
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasActiveAuctions && (
            <Link 
              to="/shops/auctions" 
              className="px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center gap-1"
            >
              <Gavel className="h-3 w-3" />
              Auction ({activeAuctions.length})
            </Link>
          )}

          {activeFlashSale && (
            <Link 
              to="/flash-sale" 
              className="px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-colors flex items-center gap-1 animate-pulse"
            >
              <Zap className="h-3 w-3" />
              Flash Sale
            </Link>
          )}

          {activeEvent && (
            <Link 
              to="/event" 
              className="px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-1"
            >
              <PartyPopper className="h-3 w-3" />
              Event
            </Link>
          )}
        </nav>

        {/* Desktop Actions - Right */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? t('lightMode') : t('darkMode')}</TooltipContent>
          </Tooltip>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border border-border">
              <DropdownMenuItem onClick={() => setLanguage('vi')} className={cn("text-[13px]", language === 'vi' ? 'bg-accent' : '')} disabled={isTranslating}>
                🇻🇳 {t('vietnamese')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('en')} className={cn("text-[13px]", language === 'en' ? 'bg-accent' : '')} disabled={isTranslating}>
                🇬🇧 {t('english')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs font-medium">
                {currency}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border border-border">
              <DropdownMenuItem onClick={() => setCurrency('VND')} className={cn("text-[13px]", currency === 'VND' ? 'bg-accent' : '')}>
                🇻🇳 VNĐ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency('USD')} className={cn("text-[13px]", currency === 'USD' ? 'bg-accent' : '')}>
                🇺🇸 USD
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-3.5 w-px bg-border mx-0.5" />

          {/* Balance */}
          {user && profile && (
            <Link 
              to="/settings?tab=deposit" 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors"
            >
              <Coins className="h-3 w-3" />
              {formatPrice(profile.balance)}
            </Link>
          )}

          <NotificationBell />

          {/* Messages */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/chat">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MessagesSquare className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t('messages')}</TooltipContent>
            </Tooltip>
          )}

          {/* Wishlist */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/wishlist">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Heart className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t('favorites')}</TooltipContent>
            </Tooltip>
          )}

          {/* Cart - only show when logged in */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative h-7 w-7">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {totalItems > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t('cart')} ({totalItems})</TooltipContent>
            </Tooltip>
          )}

          {/* User Menu */}
          {!authLoading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 pl-1 pr-1.5 h-7">
                    {/* Avatar with frame */}
                    <div className={cn("relative flex-shrink-0", userFrame ? 'h-6 w-6' : '')}>
                      {userFrame && (
                        <img 
                          src={userFrame.image_url}
                          alt="Avatar frame"
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                          style={{ objectFit: 'contain' }}
                        />
                      )}
                      <div className={userFrame ? 'absolute inset-0 flex items-center justify-center' : ''}>
                        <Avatar 
                          className={cn(userFrame ? 'h-[70%] w-[70%]' : 'h-5 w-5')}
                          style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                        >
                          <AvatarImage src={profile?.avatar_url || ''} style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }} />
                          <AvatarFallback 
                            className="bg-primary/20 text-primary text-[9px]"
                            style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                          >
                            {profile?.full_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{profile?.full_name || profile?.email}</p>
                      {userRoleData === 'admin' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-red-500 to-red-600 text-white font-medium">
                          <Shield className="h-2.5 w-2.5" />
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <VipBadge levelName={vipLevel?.name} size="sm" />
                      <span className="text-xs text-muted-foreground">{formatPrice(profile?.balance || 0)}</span>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${profile?.username || user.id}`} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      {t('personalPage')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      {t('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/order-lookup" className="flex items-center gap-2 cursor-pointer">
                      <Search className="h-4 w-4" />
                      {t('orderLookup')}
                    </Link>
                  </DropdownMenuItem>
                  {/* Shop management - show based on shop type */}
                  {currentSeller && sellerProducts.length > 0 && (
                    <DropdownMenuItem asChild>
                      <Link to={`/shops/${currentSeller.shop_slug}/dashboard`} className="flex items-center gap-2 cursor-pointer">
                        <Gamepad2 className="h-4 w-4 text-blue-500" />
                        Game Shop
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {currentSeller && sellerDesignServices.length > 0 && (
                    <DropdownMenuItem asChild>
                      <Link to={`/shops/${currentSeller.shop_slug}/dashboard/design-services`} className="flex items-center gap-2 cursor-pointer">
                        <Palette className="h-4 w-4 text-purple-500" />
                        Design Shop
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {currentSeller && sellerProducts.length === 0 && sellerDesignServices.length === 0 && (
                    <DropdownMenuItem asChild>
                      <Link to={`/shops/${currentSeller.shop_slug}/dashboard`} className="flex items-center gap-2 cursor-pointer">
                        <Store className="h-4 w-4" />
                        {t('manageShop')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {/* Admin Panel - only for admin role */}
                  {userRoleData === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-primary">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="h-8 px-3 text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  {t('login')}
                </Button>
              </Link>
            )
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <NotificationBell />

          {user && (
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background border-border overflow-y-auto p-0">
              {/* User Section - Collapsible */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b">
                    <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {user ? (profile?.full_name || 'U')[0].toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {user ? (profile?.full_name || profile?.username || t('user')) : t('login')}
                      </p>
                      {user && profile && (
                        <p className="text-xs text-primary flex items-center gap-1 font-medium">
                          <Coins className="h-3 w-3" />
                          {formatPrice(profile.balance)}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-2 bg-muted/30 border-b">
                    {user ? (
                      <>
                        <Link to={`/user/${profile?.username || user.id}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('personalPage')}</span>
                        </Link>
                        <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                          <Settings className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('settings')}</span>
                        </Link>
                        <Link to="/chat" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('messages')}</span>
                        </Link>
                        <Link to="/order-lookup" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                          <ShoppingBag className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('orders')}</span>
                        </Link>
                        <Link to="/referral" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                          <Gift className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('referral')}</span>
                        </Link>
                        {currentSeller && (
                          <Link to={`/shops/${currentSeller.shop_slug}/dashboard`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors">
                            <Store className="h-4 w-4" />
                            <span className="text-sm font-medium">{t('manageShop')}</span>
                          </Link>
                        )}
                        {/* Admin Panel Link - Mobile */}
                        {userRoleData === 'admin' && (
                          <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-primary">
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">Admin Panel</span>
                          </Link>
                        )}
                        <button
                          onClick={() => { handleSignOut(); setIsOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('logout')}</span>
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-2">
                        <Link to="/auth" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">
                            <LogIn className="h-4 w-4 mr-2" />
                            {t('login')}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Main Navigation */}
              <nav className="py-2 border-b">
                <Link to="/" onClick={() => setIsOpen(false)} className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  isActiveLink('/') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}>
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Home</span>
                </Link>

                {/* Premium Categories Dropdown */}
                {premiumCategories.length > 0 && (
                  <Collapsible open={premiumOpen} onOpenChange={setPremiumOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5" />
                          <span className="font-medium">Premium</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", premiumOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 py-1">
                        {premiumCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors"
                          >
                            {getCategoryName(cat)}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Game Account Categories Dropdown */}
                {gameAccountCategories.length > 0 && (
                  <Collapsible open={gameOpen} onOpenChange={setGameOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Gamepad2 className="h-5 w-5" />
                          <span className="font-medium">Accounts</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", gameOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 py-1">
                        {gameAccountCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors"
                          >
                            {getCategoryName(cat)}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Design Categories Dropdown */}
                {designCategories.length > 0 && (
                  <Collapsible open={designOpen} onOpenChange={setDesignOpen}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors",
                        isActivePath('/design') && "bg-primary/10 text-primary"
                      )}>
                        <div className="flex items-center gap-3">
                          <Palette className="h-5 w-5" />
                          <span className="font-medium">Design</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", designOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 py-1">
                        {designCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/design?category=${cat.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors"
                          >
                            {getCategoryName(cat)}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Topup Dropdown */}
                {topupProducts && topupProducts.length > 0 && (
                  <Collapsible open={topupOpen} onOpenChange={setTopupOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5" />
                          <span className="font-medium">Top Up</span>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", topupOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 py-1">
                        {topupProducts.slice(0, 6).map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors"
                          >
                            {product.name}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* SMM Dropdown */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors",
                      isActivePath('/smm') && "bg-primary/10 text-primary"
                    )}>
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5" />
                        <span className="font-medium">SMM Services</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-muted/30 py-1">
                      <Link to="/smm/services" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                        Services
                      </Link>
                      <Link to="/smm/order" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                        Place Order
                      </Link>
                      <Link to="/smm/bulk" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                        Bulk Order
                      </Link>
                      <Link to="/smm/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                        Orders
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </nav>

              {/* Other Links - only show when logged in */}
              {user && (
                <nav className="py-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Other
                  </p>
                  <Link to="/newsfeed" onClick={() => setIsOpen(false)} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isActiveLink('/newsfeed') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}>
                    <Newspaper className="h-5 w-5" />
                    <span className="font-medium">Newsfeed</span>
                  </Link>
                  <Link to="/shops" onClick={() => setIsOpen(false)} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isActiveLink('/shops') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}>
                    <Store className="h-5 w-5" />
                    <span className="font-medium">Marketplace</span>
                  </Link>
                  {/* Groups removed */}
                  <Link to="/support" onClick={() => setIsOpen(false)} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isActiveLink('/support') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}>
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-medium">Support</span>
                  </Link>
                  <Link to="/item-shop" onClick={() => setIsOpen(false)} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isActiveLink('/item-shop') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}>
                    <ShoppingBag className="h-5 w-5" />
                    <span className="font-medium">Shop</span>
                  </Link>
                  <Link to="/news" onClick={() => setIsOpen(false)} className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isActiveLink('/news') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}>
                    <Newspaper className="h-5 w-5" />
                    <span className="font-medium">News</span>
                  </Link>
                  {/* Utilities Dropdown - removed */}
                  {/* <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors",
                        isActivePath('/utilities') && "bg-primary/10 text-primary"
                      )}>
                        <div className="flex items-center gap-3">
                          <Wrench className="h-5 w-5" />
                          <span className="font-medium">Utilities</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 py-1">
                        <Link to="/utilities/qr" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <QrCode className="h-4 w-4" />
                          QR Generator
                        </Link>
                        <Link to="/utilities/money-split" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <DollarSign className="h-4 w-4" />
                          Money Split
                        </Link>
                        <Link to="/utilities/checklist" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <Code className="h-4 w-4" />
                          Checklist
                        </Link>
                        <Link to="/utilities/format" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <ArrowLeftRight className="h-4 w-4" />
                          Format Converter
                        </Link>
                        <Link to="/utilities/media" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <Video className="h-4 w-4" />
                          Media Converter
                        </Link>
                        <Link to="/utilities/domain" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <Globe className="h-4 w-4" />
                          Domain Checker
                        </Link>
                        <Link to="/utilities/download" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <Search className="h-4 w-4" />
                          Video Downloader
                        </Link>
                        <Link to="/utilities/mail" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-muted transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          Mail Checker
                        </Link>
                      </div>
                    </CollapsibleContent>
                  </Collapsible> */}


                  {hasActiveAuctions && (
                    <Link to="/shops/auctions" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-amber-500 hover:bg-muted transition-colors">
                      <Gavel className="h-5 w-5" />
                      <span className="font-medium">Auction ({activeAuctions.length})</span>
                    </Link>
                  )}

                  {activeFlashSale && (
                    <Link to="/flash-sale" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-orange-500 hover:bg-muted transition-colors">
                      <Zap className="h-5 w-5" />
                      <span className="font-medium">Flash Sale</span>
                    </Link>
                  )}

                  {activeEvent && (
                    <Link to="/event" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-purple-500 hover:bg-muted transition-colors">
                      <PartyPopper className="h-5 w-5" />
                      <span className="font-medium">Event</span>
                    </Link>
                  )}
                </nav>
              )}

              {/* Settings Row */}
              <div className="p-4 border-t flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      {isTranslating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
                      {language === 'vi' ? 'VN' : 'EN'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border border-border">
                    <DropdownMenuItem onClick={() => setLanguage('vi')} className={language === 'vi' ? 'bg-accent' : ''} disabled={isTranslating}>
                      🇻🇳 {t('vietnamese')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''} disabled={isTranslating}>
                      🇬🇧 {t('english')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {currency}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border border-border">
                    <DropdownMenuItem onClick={() => setCurrency('VND')} className={currency === 'VND' ? 'bg-accent' : ''}>
                      🇻🇳 VNĐ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('USD')} className={currency === 'USD' ? 'bg-accent' : ''}>
                      🇺🇸 USD
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
