// Re-export from MySQL version for backward compatibility
// All database operations now go through MySQL backend
export * from './useWishlist.mysql';
export { useToggleWishlistNotification } from './missing-exports';
