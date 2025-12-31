// Re-export from MySQL version for backward compatibility
// All database operations now go through MySQL backend
export * from './useFriends.mysql';
export { useUnfriend, useCancelFriendRequest, useFriendsCount } from './missing-exports';
