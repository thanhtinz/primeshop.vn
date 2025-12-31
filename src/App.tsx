import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
// All auth now uses MySQL backend
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartAnimationProvider } from "@/components/cart/CartAnimationProvider";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { PageTransition } from "@/components/ui/page-transition";
import { SeasonalParticles } from "@/components/effects/SeasonalParticles";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { DynamicMeta } from "@/components/DynamicMeta";
import { IncomingCallNotification } from "@/components/call/VideoCallModal";
import { OAuthSuccessHandler } from "@/components/OAuthSuccessHandler";
// All hooks now use MySQL backend
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";

// Lazy loaded pages
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderLookupPage = lazy(() => import("./pages/OrderLookupPage"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const SettingsLayout = lazy(() => import("./components/settings/SettingsLayout").then(m => ({ default: m.SettingsLayout })));
const SettingsAccountPage = lazy(() => import("./pages/settings/SettingsAccountPage"));
const SettingsDepositPage = lazy(() => import("./pages/settings/SettingsDepositPage"));
const SettingsHistoryPage = lazy(() => import("./pages/settings/SettingsHistoryPage"));
const SettingsOrdersPage = lazy(() => import("./pages/settings/SettingsOrdersPage"));
const SettingsWishlistPage = lazy(() => import("./pages/settings/SettingsWishlistPage"));
const SettingsVouchersPage = lazy(() => import("./pages/settings/SettingsVouchersPage"));
const SettingsItemsPage = lazy(() => import("./pages/settings/SettingsItemsPage"));
const SettingsSecurityPage = lazy(() => import("./pages/settings/SettingsSecurityPage"));
const SettingsEmailPage = lazy(() => import("./pages/settings/SettingsEmailPage"));
const SettingsNotificationsPage = lazy(() => import("./pages/settings/SettingsNotificationsPage"));
const SettingsRewardsPage = lazy(() => import("./pages/settings/SettingsRewardsPage"));
const SettingsAchievementsPage = lazy(() => import("./pages/settings/SettingsAchievementsPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const TicketDetailPage = lazy(() => import("./pages/TicketDetailPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const FlashSalePage = lazy(() => import("./pages/FlashSalePage"));
const ApiChangelogPage = lazy(() => import("./pages/ApiChangelogPage"));
const ItemShopPage = lazy(() => import("./pages/ItemShopPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SmmServicesPage = lazy(() => import("./pages/smm/SmmServicesPage"));
const SmmOrderPage = lazy(() => import("./pages/smm/SmmOrderPage"));
const SmmBulkOrderPage = lazy(() => import("./pages/smm/SmmBulkOrderPage"));
const SmmOrdersPage = lazy(() => import("./pages/smm/SmmOrdersPage"));

// Mailbox pages
const MailboxPage = lazy(() => import("./pages/MailboxPage"));
const MailSettingsPage = lazy(() => import("./pages/MailSettingsPage"));

// OAuth pages
const OAuthSuccessPage = lazy(() => import("./pages/OAuthSuccessPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));

// Setup page (first-time installation)
const SetupPage = lazy(() => import("./pages/SetupPage"));

// Shop/Marketplace pages
const ShopsListPage = lazy(() => import("./pages/ShopsListPage"));
const SellerRegisterPage = lazy(() => import("./pages/marketplace/SellerRegisterPage"));
// Old SellerDashboard removed - using new layout
const SellerDashboardLayout = lazy(() => import("./components/marketplace/SellerDashboardLayout"));
const SellerOverview = lazy(() => import("./pages/marketplace/seller/SellerOverview"));
const SellerProductsPage = lazy(() => import("./pages/marketplace/seller/SellerProductsPage"));
const SellerOrdersPage = lazy(() => import("./pages/marketplace/seller/SellerOrdersPage"));
const SellerWalletPage = lazy(() => import("./pages/marketplace/seller/SellerWalletPage"));
const SellerVouchersPage = lazy(() => import("./pages/marketplace/seller/SellerVouchersPage"));
const SellerTicketsPage = lazy(() => import("./pages/marketplace/seller/SellerTicketsPage"));
const SellerPostsPage = lazy(() => import("./pages/marketplace/seller/SellerPostsPage"));
const SellerChatPage = lazy(() => import("./pages/marketplace/seller/SellerChatPage"));
const SellerAuctionsPage = lazy(() => import("./pages/marketplace/seller/SellerAuctionsPage"));
const SellerBoostPage = lazy(() => import("./pages/marketplace/seller/SellerBoostPage"));
const SellerHandoverPage = lazy(() => import("./pages/marketplace/seller/SellerHandoverPage"));
const SellerFlashSalePage = lazy(() => import("./pages/marketplace/seller/SellerFlashSalePage"));
const SellerCombosPage = lazy(() => import("./pages/marketplace/seller/SellerCombosPage"));
const SellerBlacklistPage = lazy(() => import("./pages/marketplace/seller/SellerBlacklistPage"));
const SellerStatsPage = lazy(() => import("./pages/marketplace/seller/SellerStatsPage"));
const SellerSettingsPage = lazy(() => import("./pages/marketplace/seller/SellerSettingsPage"));
const SellerInsightsPage = lazy(() => import("./pages/marketplace/seller/SellerInsightsPage"));
const SellerAIPage = lazy(() => import("./pages/marketplace/seller/SellerAIPage"));
const SellerPoliciesPage = lazy(() => import("./pages/marketplace/seller/SellerPoliciesPage"));
const SellerInventoryPage = lazy(() => import("./pages/marketplace/seller/SellerInventoryPage"));
const SellerBrandingPage = lazy(() => import("./pages/marketplace/seller/SellerBrandingPage"));
const SellerWebhooksPage = lazy(() => import("./pages/marketplace/seller/SellerWebhooksPage"));
const SellerRiskPage = lazy(() => import("./pages/marketplace/seller/SellerRiskPage"));
const SellerDesignNDAPage = lazy(() => import("./pages/marketplace/seller/SellerDesignNDAPage"));
const ShopPage = lazy(() => import("./pages/marketplace/ShopPage"));
const MarketplaceProductPage = lazy(() => import("./pages/marketplace/MarketplaceProductPage"));
const AuctionsPage = lazy(() => import("./pages/marketplace/AuctionsPage"));
const AuctionDetailPage = lazy(() => import("./pages/marketplace/AuctionDetailPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const NewsfeedPage = lazy(() => import("./pages/NewsfeedPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
// Groups removed - uncomment if needed
// const GroupsPage = lazy(() => import("./pages/GroupsPage"));
// const GroupLayout = lazy(() => import("./components/groups/GroupLayout"));
// const GroupPostsPage = lazy(() => import("./pages/groups/GroupPostsPage"));
// const GroupTasksPage = lazy(() => import("./pages/groups/GroupTasksPage"));
// const GroupDealsPage = lazy(() => import("./pages/groups/GroupDealsPage"));
// const GroupWalletPage = lazy(() => import("./pages/groups/GroupWalletPage"));
// const GroupMembersPage = lazy(() => import("./pages/groups/GroupMembersPage"));
// const GroupProofsPage = lazy(() => import("./pages/groups/GroupProofsPage"));
// const GroupInsightsPage = lazy(() => import("./pages/groups/GroupInsightsPage"));
// const GroupSettingsPage = lazy(() => import("./pages/groups/GroupSettingsPage"));
// const GroupAdminPage = lazy(() => import("./pages/groups/GroupAdminPage"));
// const GroupPostDetailPage = lazy(() => import("./pages/groups/GroupPostDetailPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
// const UtilitiesPage = lazy(() => import("./pages/UtilitiesPage"));
// const DomainCheckerPage = lazy(() => import("./pages/utilities/DomainCheckerPage"));
// const VideoDownloaderPage = lazy(() => import("./pages/utilities/VideoDownloaderPage"));
// const MailCheckerPage = lazy(() => import("./pages/utilities/MailCheckerPage"));
// const MoneySplitPage = lazy(() => import("./pages/utilities/MoneySplitPage"));
// Checklist removed - uncomment if needed
// const ChecklistPage = lazy(() => import("./pages/utilities/ChecklistPage"));
// const FormatConverterPage = lazy(() => import("./pages/utilities/FormatConverterPage"));
// const MediaConverterPage = lazy(() => import("./pages/utilities/MediaConverterPage"));
// const QrGeneratorPage = lazy(() => import("./pages/utilities/QrGeneratorPage"));

// Design services pages
const DesignServicesPage = lazy(() => import("./pages/design/DesignServicesPage"));
const DesignServiceDetailPage = lazy(() => import("./pages/design/DesignServiceDetailPage"));
const DesignOrderTicketPage = lazy(() => import("./pages/design/DesignOrderTicketPage"));

// Admin pages (lazy loaded)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayoutNew"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminVouchers = lazy(() => import("./pages/admin/AdminVouchers"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminReferralRegistrations = lazy(() => import("./pages/admin/AdminReferralRegistrations"));
const AdminEmail = lazy(() => import("./pages/admin/AdminEmail"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminHeroBanners = lazy(() => import("./pages/admin/AdminHeroBanners"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminFlashSales = lazy(() => import("./pages/admin/AdminFlashSales"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminBulkEmail = lazy(() => import("./pages/admin/AdminBulkEmail"));

const AdminApiChangelog = lazy(() => import("./pages/admin/AdminApiChangelog"));
const AdminTranslations = lazy(() => import("./pages/admin/AdminTranslations"));
const AdminSmmConfig = lazy(() => import("./pages/admin/AdminSmmConfig"));
const AdminSmmPlatforms = lazy(() => import("./pages/admin/AdminSmmPlatforms"));
const AdminSmmServiceTypes = lazy(() => import("./pages/admin/AdminSmmServiceTypes"));
const AdminSmmCategories = lazy(() => import("./pages/admin/AdminSmmCategories"));
const AdminSmmServices = lazy(() => import("./pages/admin/AdminSmmServices"));
const AdminSmmOrders = lazy(() => import("./pages/admin/AdminSmmOrders"));
const AdminBundles = lazy(() => import("./pages/admin/AdminBundles"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminMarketplace = lazy(() => import("./pages/admin/AdminMarketplace"));
const AdminBoostPricing = lazy(() => import("./pages/admin/AdminBoostPricing"));
const AdminRewards = lazy(() => import("./pages/admin/AdminRewards"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminPostReports = lazy(() => import("./pages/admin/AdminPostReports"));
// Stories & Notes removed - uncomment if needed
// const AdminStories = lazy(() => import("./pages/admin/AdminStories"));
// const AdminNotes = lazy(() => import("./pages/admin/AdminNotes"));
const AdminStickers = lazy(() => import("./pages/admin/AdminStickers"));
const AdminPrimeBoost = lazy(() => import("./pages/admin/AdminPrimeBoost"));
const AdminDesignCategories = lazy(() => import("./pages/admin/AdminDesignCategories"));
const AdminDesignServices = lazy(() => import("./pages/admin/AdminDesignServices"));
const AdminDesignOrders = lazy(() => import("./pages/admin/AdminDesignOrders"));
const AdminDesignManagers = lazy(() => import("./pages/admin/AdminDesignManagers"));
const AdminMailServer = lazy(() => import("./pages/admin/AdminMailServer"));
const AdminDesignLicenses = lazy(() => import("./pages/admin/AdminDesignLicenses"));
const AdminDesignFees = lazy(() => import("./pages/admin/AdminDesignFees"));
const AdminDesignStats = lazy(() => import("./pages/admin/AdminDesignStats"));
const AdminDesignAudit = lazy(() => import("./pages/admin/AdminDesignAudit"));
const AdminDesignAbuse = lazy(() => import("./pages/admin/AdminDesignAbuse"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminSecrets = lazy(() => import("./pages/admin/settings/AdminSecrets"));
const AdminDiscordBot = lazy(() => import("./pages/admin/settings/AdminDiscordBot"));
const AdminNotificationTemplates = lazy(() => import("./pages/admin/AdminNotificationTemplates"));
const SellerDesignServicesPage = lazy(() => import("./pages/marketplace/seller/SellerDesignServicesPage"));
const AdminStaticPages = lazy(() => import("./pages/admin/AdminStaticPages"));
const SellerDesignOrdersPage = lazy(() => import("./pages/marketplace/seller/SellerDesignOrdersPage"));
const DesignManagerDashboard = lazy(() => import("./pages/design/DesignManagerDashboard"));
const SellerDesignTeamPage = lazy(() => import("./pages/marketplace/seller/SellerDesignTeamPage"));
const SellerDesignTemplatesPage = lazy(() => import("./pages/marketplace/seller/SellerDesignTemplatesPage"));
const SellerDesignRewardsPage = lazy(() => import("./pages/marketplace/seller/SellerDesignRewardsPage"));
const SellerDesignStatsPage = lazy(() => import("./pages/marketplace/seller/SellerDesignStatsPage"));


// Optimized React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Don't refetch on window focus in production
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Wrapper component to handle maintenance mode and setup check
const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSiteSettings();
  const [setupChecked, setSetupChecked] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  
  // Allow admin routes even in maintenance mode
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSetupRoute = location.pathname === '/setup';
  const isMaintenanceMode = settings?.maintenance_mode === true;

  // Check if setup is complete (first-time installation check)
  useEffect(() => {
    // Skip check for setup page itself and admin routes
    if (isSetupRoute || isAdminRoute) {
      setSetupChecked(true);
      return;
    }

    const checkSetup = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/setup/check`);
        
        if (response.ok) {
          const data = await response.json();
          setIsSetupComplete(data.isSetupComplete);
          
          if (!data.isSetupComplete) {
            // Redirect to setup page
            navigate('/setup', { replace: true });
          }
        }
      } catch (error) {
        // If API fails, continue normally (might be first run before server setup)
        console.log('Setup check skipped');
      } finally {
        setSetupChecked(true);
      }
    };

    checkSetup();
  }, [isSetupRoute, isAdminRoute, navigate]);

  if (isLoading || !setupChecked) {
    return <PageLoader />;
  }

  // Show maintenance page for non-admin routes when maintenance mode is on
  if (isMaintenanceMode && !isAdminRoute && !isSetupRoute) {
    return <MaintenancePage />;
  }

  return (
    <PageTransition>
      <Routes>
        {/* Setup wizard - first time installation */}
        <Route path="/setup" element={<SetupPage />} />
        
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-lookup" element={<OrderLookupPage />} />
        <Route path="/invoice/:orderNumber" element={<InvoicePage />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/oauth/success" element={<OAuthSuccessPage />} />
        <Route path="/oauth/callback/:provider" element={<OAuthCallbackPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Settings routes with sidebar layout */}
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<SettingsAccountPage />} />
          <Route path="deposit" element={<SettingsDepositPage />} />
          <Route path="history" element={<SettingsHistoryPage />} />
          <Route path="orders" element={<SettingsOrdersPage />} />
          <Route path="wishlist" element={<SettingsWishlistPage />} />
          <Route path="vouchers" element={<SettingsVouchersPage />} />
          <Route path="items" element={<SettingsItemsPage />} />
          <Route path="security" element={<SettingsSecurityPage />} />
          <Route path="email" element={<SettingsEmailPage />} />
          <Route path="notifications" element={<SettingsNotificationsPage />} />
          <Route path="rewards" element={<SettingsRewardsPage />} />
          <Route path="achievements" element={<SettingsAchievementsPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/:id" element={<TicketDetailPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />
        <Route path="/api-changelog" element={<ApiChangelogPage />} />
        <Route path="/item-shop" element={<ItemShopPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/smm" element={<SmmServicesPage />} />
        <Route path="/smm/services" element={<SmmServicesPage />} />
        <Route path="/smm/order" element={<SmmOrderPage />} />
        <Route path="/smm/bulk" element={<SmmBulkOrderPage />} />
        <Route path="/smm/orders" element={<SmmOrdersPage />} />
        
        {/* Mail routes */}
        <Route path="/mail" element={<MailboxPage />} />
        <Route path="/mail/:folder" element={<MailboxPage />} />
        <Route path="/mail/settings" element={<MailSettingsPage />} />
        
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/newsfeed" element={<NewsfeedPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        {/* Groups removed - uncomment if needed */}
        {/* <Route path="/groups" element={<GroupsPage />} /> */}
        {/* Utilities removed */}
        {/* <Route path="/utilities" element={<Navigate to="/utilities/qr" replace />} />
        <Route path="/utilities/domain" element={<DomainCheckerPage />} />
        <Route path="/utilities/download" element={<VideoDownloaderPage />} />
        <Route path="/utilities/mail" element={<MailCheckerPage />} />
        <Route path="/utilities/money-split" element={<MoneySplitPage />} />
        <Route path="/utilities/format" element={<FormatConverterPage />} />
        <Route path="/utilities/media" element={<MediaConverterPage />} />
        <Route path="/utilities/qr" element={<QrGeneratorPage />} /> */}
        {/* Checklist removed - uncomment if needed */}
        {/* <Route path="/utilities/checklist" element={<ChecklistPage />} /> */}
        
        
        {/* Groups routes removed - uncomment if needed */}
        {/* <Route path="/groups/:id/post/:postId" element={<GroupPostDetailPage />} /> */}
        {/* <Route path="/groups/:id" element={<GroupLayout />}>
          <Route index element={<GroupPostsPage />} />
          <Route path="tasks" element={<GroupTasksPage />} />
          <Route path="deals" element={<GroupDealsPage />} />
          <Route path="wallet" element={<GroupWalletPage />} />
          <Route path="members" element={<GroupMembersPage />} />
          <Route path="proofs" element={<GroupProofsPage />} />
          <Route path="insights" element={<GroupInsightsPage />} />
          <Route path="settings" element={<GroupSettingsPage />} />
          <Route path="admin" element={<GroupAdminPage />} />
        </Route> */}
        
        {/* Shop routes */}
        <Route path="/shops" element={<ShopsListPage />} />
        <Route path="/shops/register" element={<SellerRegisterPage />} />
        <Route path="/shops/:slug" element={<ShopPage />} />
        <Route path="/shops/:slug/product/:id" element={<MarketplaceProductPage />} />
        <Route path="/shops/product/:id" element={<MarketplaceProductPage />} />
        <Route path="/shops/auctions" element={<AuctionsPage />} />
        <Route path="/shops/auction/:auctionId" element={<AuctionDetailPage />} />
        
        {/* Seller Dashboard with new layout - supports both /seller and /shops/:slug/dashboard */}
        <Route path="/shops/:slug/dashboard" element={<SellerDashboardLayout />}>
          <Route index element={<SellerOverview />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="wallet" element={<SellerWalletPage />} />
          <Route path="vouchers" element={<SellerVouchersPage />} />
          <Route path="tickets" element={<SellerTicketsPage />} />
          <Route path="posts" element={<SellerPostsPage />} />
          <Route path="chat" element={<SellerChatPage />} />
          <Route path="auctions" element={<SellerAuctionsPage />} />
          <Route path="boost" element={<SellerBoostPage />} />
          <Route path="handover" element={<SellerHandoverPage />} />
          <Route path="flash-sale" element={<SellerFlashSalePage />} />
          <Route path="combos" element={<SellerCombosPage />} />
          <Route path="blacklist" element={<SellerBlacklistPage />} />
          <Route path="stats" element={<SellerStatsPage />} />
          <Route path="settings" element={<SellerSettingsPage />} />
          <Route path="insights" element={<SellerInsightsPage />} />
          <Route path="ai-assistant" element={<SellerAIPage />} />
          <Route path="policies" element={<SellerPoliciesPage />} />
          <Route path="inventory" element={<SellerInventoryPage />} />
          <Route path="branding" element={<SellerBrandingPage />} />
          <Route path="webhooks" element={<SellerWebhooksPage />} />
          <Route path="risk" element={<SellerRiskPage />} />
        </Route>
        
        <Route path="/seller" element={<SellerDashboardLayout />}>
          <Route index element={<SellerOverview />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="wallet" element={<SellerWalletPage />} />
          <Route path="vouchers" element={<SellerVouchersPage />} />
          <Route path="tickets" element={<SellerTicketsPage />} />
          <Route path="posts" element={<SellerPostsPage />} />
          <Route path="chat" element={<SellerChatPage />} />
          <Route path="auctions" element={<SellerAuctionsPage />} />
          <Route path="boost" element={<SellerBoostPage />} />
          <Route path="handover" element={<SellerHandoverPage />} />
          <Route path="flash-sale" element={<SellerFlashSalePage />} />
          <Route path="combos" element={<SellerCombosPage />} />
          <Route path="blacklist" element={<SellerBlacklistPage />} />
          <Route path="stats" element={<SellerStatsPage />} />
          <Route path="settings" element={<SellerSettingsPage />} />
          <Route path="insights" element={<SellerInsightsPage />} />
          <Route path="ai-assistant" element={<SellerAIPage />} />
          <Route path="policies" element={<SellerPoliciesPage />} />
          <Route path="inventory" element={<SellerInventoryPage />} />
          <Route path="branding" element={<SellerBrandingPage />} />
          <Route path="webhooks" element={<SellerWebhooksPage />} />
          <Route path="risk" element={<SellerRiskPage />} />
          <Route path="design-services" element={<SellerDesignServicesPage />} />
          <Route path="design-orders" element={<SellerDesignOrdersPage />} />
          <Route path="design-team" element={<SellerDesignTeamPage />} />
          <Route path="design-templates" element={<SellerDesignTemplatesPage />} />
          <Route path="design-rewards" element={<SellerDesignRewardsPage />} />
          <Route path="design-stats" element={<SellerDesignStatsPage />} />
          <Route path="design-nda" element={<SellerDesignNDAPage />} />
        </Route>
        
        {/* Design services routes */}
        <Route path="/design" element={<DesignServicesPage />} />
        <Route path="/design/category/:slug" element={<DesignServicesPage />} />
        <Route path="/design/service/:id" element={<DesignServiceDetailPage />} />
        <Route path="/design/order/:orderId" element={<DesignOrderTicketPage />} />
        <Route path="/design-manager" element={<DesignManagerDashboard />} />
        
        
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vouchers" element={<AdminVouchers />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="referral-registrations" element={<AdminReferralRegistrations />} />
          <Route path="email" element={<AdminEmail />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="hero-banners" element={<AdminHeroBanners />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="bulk-email" element={<AdminBulkEmail />} />
          
          <Route path="api-changelog" element={<AdminApiChangelog />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="smm-config" element={<AdminSmmConfig />} />
          <Route path="smm-platforms" element={<AdminSmmPlatforms />} />
          <Route path="smm-service-types" element={<AdminSmmServiceTypes />} />
          <Route path="smm-categories" element={<AdminSmmCategories />} />
          <Route path="smm-services" element={<AdminSmmServices />} />
          <Route path="smm-orders" element={<AdminSmmOrders />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="marketplace" element={<AdminMarketplace />} />
          <Route path="boost-pricing" element={<AdminBoostPricing />} />
          <Route path="rewards" element={<AdminRewards />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="post-reports" element={<AdminPostReports />} />
          {/* Stories & Notes removed - uncomment if needed */}
          {/* <Route path="stories" element={<AdminStories />} /> */}
          {/* <Route path="notes" element={<AdminNotes />} /> */}
          <Route path="stickers" element={<AdminStickers />} />
          <Route path="prime-boost" element={<AdminPrimeBoost />} />
          <Route path="design-categories" element={<AdminDesignCategories />} />
          <Route path="design-services" element={<AdminDesignServices />} />
          <Route path="design-orders" element={<AdminDesignOrders />} />
          <Route path="design-managers" element={<AdminDesignManagers />} />
          <Route path="design-licenses" element={<AdminDesignLicenses />} />
          <Route path="design-fees" element={<AdminDesignFees />} />
          <Route path="design-stats" element={<AdminDesignStats />} />
          <Route path="design-audit" element={<AdminDesignAudit />} />
          <Route path="design-abuse" element={<AdminDesignAbuse />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="secrets" element={<AdminSecrets />} />
          <Route path="discord-bot" element={<AdminDiscordBot />} />
          <Route path="notification-templates" element={<AdminNotificationTemplates />} />
          <Route path="mail-server" element={<AdminMailServer />} />
          
          <Route path="settings" element={<AdminSettings />} />
          <Route path="static-pages" element={<AdminStaticPages />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <AdminAuthProvider>
                <CartProvider>
                  <CartAnimationProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <SeasonalParticles />
                      <DynamicFavicon />
                      <DynamicMeta />
                      <IncomingCallNotification />
                      <BrowserRouter>
                        <OAuthSuccessHandler />
                        <ScrollToTop />
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <AppRoutes />
                          </Suspense>
                        </ErrorBoundary>
                      </BrowserRouter>
                    </TooltipProvider>
                  </CartAnimationProvider>
                </CartProvider>
              </AdminAuthProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
