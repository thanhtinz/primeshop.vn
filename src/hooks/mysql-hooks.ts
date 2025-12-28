// MySQL Hooks Index
// Import tất cả hooks MySQL từ file này để dễ dàng migration

// Auth Context
export { AuthProvider, useAuth, useAuthSafe } from '@/contexts/AuthContext.mysql';

// Categories
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type DbCategory,
} from './useCategories.mysql';

// Products
export {
  useProducts,
  useProduct,
  useFeaturedProducts,
  useProductsByCategory,
  useProductsByStyle,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateProductPackage,
  useUpdateProductPackage,
  useDeleteProductPackage,
  useSearchProducts,
  type DbProduct,
  type DbProductPackage,
  type DbProductCustomField,
  type DbProductImage,
  type ProductWithRelations,
} from './useProducts.mysql';

// Orders
export {
  useOrders,
  useUserOrders,
  useOrdersByEmail,
  useOrderByNumber,
  useCreateOrder,
  useUpdateOrder,
  usePayments,
  usePaymentsByOrder,
  useCreatePayment,
  useUpdatePayment,
  type DbOrder,
  type DbPayment,
} from './useOrders.mysql';

// Deposits
export {
  useUserDeposits,
  useCreateDeposit,
  useAllDeposits,
  useUpdateDeposit,
  useCreatePayOSDeposit,
  type DepositTransaction,
} from './useDeposit.mysql';

// Vouchers
export {
  useVouchers,
  useValidateVoucher,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  useIncrementVoucherUsage,
  type DbVoucher,
} from './useVouchers.mysql';

// Notifications
export {
  useNotifications,
  useCreateNotification,
  type Notification,
} from './useNotifications.mysql';

// Wishlist
export {
  useWishlist,
  useIsInWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
  useToggleWishlist,
  useUpdateWishlistNotify,
  type WishlistItem,
} from './useWishlist.mysql';

// Reviews
export * from './useReviews.mysql';

// Site Settings
export * from './useSiteSettings.mysql';

// User Profile
export * from './useUserProfile.mysql';

// Flash Sales
export * from './useFlashSales.mysql';

// Hero Banners
export * from './useHeroBanners.mysql';

// Wallet
export * from './useWallet.mysql';

// Marketplace
export * from './useMarketplace.mysql';

// Friends
export * from './useFriends.mysql';

// Follow
export * from './useFollow.mysql';

// Events
export * from './useEvents.mysql';

// Daily Checkin
export * from './useDailyCheckin.mysql';

// Achievements
export * from './useAchievements.mysql';

// Auctions
export * from './useAuctions.mysql';

// Affiliate
export * from './useAffiliate.mysql';

// Admin Rewards
export * from './useAdminRewards.mysql';

// Avatar Frames
export * from './useAvatarFrames.mysql';

// Groups
export * from './useGroups.mysql';

// Chat System
export * from './useChatSystem.mysql';

// Stories
export * from './useStories.mysql';

// Posts
export * from './usePosts.mysql';

// Group Posts
export * from './useGroupPosts.mysql';

// Shop Posts
export * from './useShopPosts.mysql';

// Seller Stats
export * from './useSellerStats.mysql';

// Referrals
export * from './useReferrals.mysql';

// Tickets
export * from './useTickets.mysql';

// News
export * from './useNews.mysql';

// Notes
export * from './useNotes.mysql';

// Stickers
export * from './useStickers.mysql';

// Seller Wallet
export * from './useSellerWallet.mysql';

// Online Status
export * from './useOnlineStatus.mysql';

// Recently Viewed
export * from './useRecentlyViewed.mysql';

// Game Account Inventory
export * from './useGameAccountInventory.mysql';

// Account Handover
export * from './useAccountHandover.mysql';

// Design Services
export * from './useDesignServices.mysql';

// Product Bundles
export * from './useProductBundles.mysql';

// Product Boosts
export * from './useProductBoosts.mysql';

// Seller Vouchers
export * from './useSellerVouchers.mysql';

// Seller Badges
export * from './useSellerBadges.mysql';

// Seller Chat
export * from './useSellerChat.mysql';

// Product Comparison
export * from './useProductComparison.mysql';

// User Vouchers
export * from './useUserVouchers.mysql';

// Inventory Management
export * from './useInventoryManagement.mysql';

// Advanced Search
export * from './useAdvancedSearch.mysql';

// Stock Waitlist
export * from './useStockWaitlist.mysql';

// Shop Policies
export * from './useShopPolicies.mysql';

// Group Order
export * from './useGroupOrder.mysql';

// Group Wallet
export * from './useGroupWallet.mysql';

// Group Tasks
export * from './useGroupTasks.mysql';

// Group Deals
export * from './useGroupDeals.mysql';

// Group Badges
export * from './useGroupBadges.mysql';

// Group Insights
export * from './useGroupInsights.mysql';

// Group Invitations
export * from './useGroupInvitations.mysql';

// Group Last Views
export * from './useGroupLastViews.mysql';

// Group Proofs
export * from './useGroupProofs.mysql';

// Auto Delivery
export * from './useAutoDelivery.mysql';

// Email Templates
export * from './useEmailTemplates.mysql';

// Discord Notify
export * from './useDiscordNotify.mysql';

// User Security
export * from './useUserSecurity.mysql';

// Group Management
export * from './useGroupManagement.mysql';

// Joined Group Posts
export * from './useJoinedGroupPosts.mysql';

// Marketplace Settings
export * from './useMarketplaceSettings.mysql';

// Order Status History
export * from './useOrderStatusHistory.mysql';

// Post Moderation
export * from './usePostModeration.mysql';

// User Analytics
export * from './useUserAnalytics.mysql';

// Seller Blacklist
export * from './useSellerBlacklist.mysql';

// Seller Insights
export * from './useSellerInsights.mysql';

// Seller Risk Control
export * from './useSellerRiskControl.mysql';

// Seller Tickets
export * from './useSellerTickets.mysql';

// Seller Webhooks
export * from './useSellerWebhooks.mysql';

// Shop Branding
export * from './useShopBranding.mysql';

// Seller Combos
export * from './useSellerCombos.mysql';

// Seller Flash Sale
export * from './useSellerFlashSale.mysql';

// Seller AI
export * from './useSellerAI.mysql';

// My Items
export * from './useMyItems.mysql';

// Prime Boost
export * from './usePrimeBoost.mysql';

// Item Shop Purchases
export * from './useItemShopPurchases.mysql';

// Video Call
export * from './useVideoCall.mysql';

// AI Chat
export * from './useAIChat.mysql';

// Design Advanced
export * from './useDesignAdvanced.mysql';

// Read Receipts
export * from './useReadReceipts.mysql';

// Typing Indicator
export * from './useTypingIndicator.mysql';

// Live Chat
export * from './useLiveChat.mysql';

// Naperis Topup
export * from './useNaperisTopup.mysql';

// SMM Panel
export * from './useSmm.mysql';

// Auto Email
export * from './useAutoEmail.mysql';

// API Changelog
export * from './useApiChangelog.mysql';

// API Usage Logs
export * from './useApiUsageLogs.mysql';

// Translations Admin
export * from './useTranslationsAdmin.mysql';

// User Role
export * from './useUserRole.mysql';

// Flash Sale Price
export * from './useFlashSalePrice.mysql';

// Product Images
export * from './useProductImages.mysql';

// Translation
export * from './useTranslation.mysql';
