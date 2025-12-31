// Stub exports for missing hooks - to be implemented
// This file provides placeholder implementations to prevent build errors

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

// ============ ADMIN REWARDS HOOKS ============

export const useSaveMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestone: any) => {
      if (milestone.id) {
        const { id, ...updates } = milestone;
        const { data, error } = await db.from('milestone_rewards').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db.from('milestone_rewards').insert(milestone).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-rewards'] });
      toast.success('Đã lưu milestone');
    },
  });
};

export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('milestone_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-rewards'] });
      toast.success('Đã xóa milestone');
    },
  });
};

// ============ DAILY CHECKIN HOOKS ============

export const useMilestoneRewards = () => {
  return useQuery({
    queryKey: ['milestone-rewards'],
    queryFn: async () => {
      const { data, error } = await db
        .from('milestone_rewards')
        .select('*')
        .eq('isActive', true)
        .order('daysRequired', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUserMilestoneClaims = (userId?: string) => {
  return useQuery({
    queryKey: ['user-milestone-claims', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await db
        .from('user_milestone_claims')
        .select('*')
        .eq('userId', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useClaimMilestoneReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ milestoneId, userId }: { milestoneId: string; userId: string }) => {
      const { data, error } = await db
        .from('user_milestone_claims')
        .insert({ milestoneId, userId, claimedAt: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-milestone-claims'] });
      toast.success('Đã nhận thưởng');
    },
  });
};

export const usePointsRewards = () => {
  return useQuery({
    queryKey: ['points-rewards'],
    queryFn: async () => {
      const { data, error } = await db
        .from('points_rewards')
        .select('*')
        .eq('isActive', true)
        .order('pointsCost', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rewardId, userId }: { rewardId: string; userId: string }) => {
      const { data, error } = await db
        .from('user_reward_redemptions')
        .insert({ rewardId, userId, redeemedAt: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['points-rewards'] });
      toast.success('Đã đổi thưởng');
    },
  });
};

// ============ GROUP HOOKS ============

export const useGroupReportedContent = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-reported-content', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await db
        .from('group_reports')
        .select('*, reporter:profiles(*), post:group_posts(*)')
        .eq('groupId', groupId)
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const useGroupPendingPosts = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-pending-posts', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await db
        .from('group_posts')
        .select('*, author:profiles(*)')
        .eq('groupId', groupId)
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

export const usePauseGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, isPaused }: { groupId: string; isPaused: boolean }) => {
      const { error } = await db.from('groups').update({ isPaused }).eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã cập nhật trạng thái nhóm');
    },
  });
};

export const useGroupJoinRequests = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-join-requests', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await db
        .from('group_join_requests')
        .select('*, user:profiles(*)')
        .eq('groupId', groupId)
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
};

// ============ GROUP POST HOOKS ============

export interface GroupPostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: any;
}

export const useAddGroupPostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, content, parentId }: { postId: string; userId: string; content: string; parentId?: string }) => {
      const { data, error } = await db
        .from('group_post_comments')
        .insert({ postId, userId, content, parentId })
        .select('*, profile:profiles(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-post-comments', variables.postId] });
    },
  });
};

// ============ AUCTION HOOKS ============

export const useSellerAuctions = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-auctions', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await db
        .from('auctions')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
};

export const useWatchAuction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ auctionId, userId }: { auctionId: string; userId: string }) => {
      const { data, error } = await db
        .from('auction_watchers')
        .insert({ auctionId, userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-watchers'] });
      toast.success('Đã thêm vào danh sách theo dõi');
    },
  });
};

export const useIsWatching = (auctionId: string, userId?: string) => {
  return useQuery({
    queryKey: ['auction-watching', auctionId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await db
        .from('auction_watchers')
        .select('id')
        .eq('auctionId', auctionId)
        .eq('userId', userId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId && !!auctionId,
  });
};

// ============ SELLER HOOKS ============

export const useProductsWithInventory = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-products-inventory', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await db
        .from('seller_products')
        .select('*, inventory:product_inventory(*)')
        .eq('sellerId', sellerId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
};

export const usePolicyAcceptanceLogs = (sellerId?: string) => {
  return useQuery({
    queryKey: ['policy-acceptance-logs', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await db
        .from('policy_acceptance_logs')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
};

export const useRequestVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await db
        .from('verification_requests')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast.success('Đã gửi yêu cầu xác minh');
    },
  });
};

export const useTransferToWebBalance = () => {
  return useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      // TODO: Implement transfer to web balance
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Đã chuyển tiền thành công');
    },
  });
};

export const useDeliverOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const { error } = await db
        .from('orders')
        .update({ status: 'delivered', deliveredAt: new Date().toISOString(), deliveryData: data })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đã giao hàng thành công');
    },
  });
};

export const useRefundOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await db
        .from('orders')
        .update({ status: 'refunded', refundReason: reason, refundedAt: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Đã hoàn tiền thành công');
    },
  });
};

export const useCanReviewSeller = (sellerId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['can-review-seller', sellerId, userId],
    queryFn: async () => {
      if (!sellerId || !userId) return false;
      // Check if user has completed order with seller
      const { data } = await db
        .from('orders')
        .select('id')
        .eq('sellerId', sellerId)
        .eq('userId', userId)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!sellerId && !!userId,
  });
};

export const useSellerRecentTransactions = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-recent-transactions', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await db
        .from('orders')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
};

// ============ SHOP POSTS HOOKS ============

export const useShopPostsComments = (postId?: string) => {
  return useQuery({
    queryKey: ['shop-post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await db
        .from('shop_post_comments')
        .select('*, profile:profiles(*)')
        .eq('postId', postId)
        .order('createdAt', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!postId,
  });
};

export const useShopReplyComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, reply }: { commentId: string; reply: string }) => {
      const { error } = await db
        .from('shop_post_comments')
        .update({ reply, repliedAt: new Date().toISOString() })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-post-comments'] });
      toast.success('Đã trả lời bình luận');
    },
  });
};

export const useDeleteShopComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await db.from('shop_post_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-post-comments'] });
      toast.success('Đã xóa bình luận');
    },
  });
};

// ============ REVIEW HOOKS ============

export const useCheckVerifiedPurchase = (productId: string, userId?: string) => {
  return useQuery({
    queryKey: ['verified-purchase', productId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await db
        .from('orders')
        .select('id')
        .eq('productId', productId)
        .eq('userId', userId)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId && !!productId,
  });
};

export const useProductRatingStats = (productId: string) => {
  return useQuery({
    queryKey: ['product-rating-stats', productId],
    queryFn: async () => {
      const { data, error } = await db
        .from('reviews')
        .select('rating')
        .eq('productId', productId)
        .eq('isApproved', true);
      if (error) throw error;
      
      const ratings = data || [];
      const total = ratings.length;
      const average = total > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      const distribution = [0, 0, 0, 0, 0];
      ratings.forEach(r => distribution[r.rating - 1]++);
      
      return { total, average, distribution };
    },
    enabled: !!productId,
  });
};

export const useAdminReplyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const { error } = await db
        .from('reviews')
        .update({ adminReply: reply, adminRepliedAt: new Date().toISOString() })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Đã trả lời đánh giá');
    },
  });
};

export const useToggleReviewApproval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, isApproved }: { reviewId: string; isApproved: boolean }) => {
      const { error } = await db
        .from('reviews')
        .update({ isApproved })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

// ============ GROUP POST HOOKS ============

export const useReactToGroupPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, reaction }: { postId: string; userId: string; reaction: string }) => {
      const { data, error } = await db
        .from('group_post_reactions')
        .upsert({ postId, userId, reaction }, { onConflict: 'postId,userId' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-post-reactions'] });
    },
  });
};

export const useGroupPostReactions = (postId?: string) => {
  return useQuery({
    queryKey: ['group-post-reactions', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await db
        .from('group_post_reactions')
        .select('*, profile:profiles(*)')
        .eq('postId', postId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!postId,
  });
};

// ============ EVENT HOOKS ============

export const useEventSpinPrizes = (eventId?: string) => {
  return useQuery({
    queryKey: ['event-spin-prizes', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await db
        .from('event_spin_prizes')
        .select('*')
        .eq('eventId', eventId)
        .order('probability', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
};

export const useUserSpinHistory = (userId?: string, eventId?: string) => {
  return useQuery({
    queryKey: ['user-spin-history', userId, eventId],
    queryFn: async () => {
      if (!userId) return [];
      let query = db
        .from('spin_history')
        .select('*, prize:event_spin_prizes(*)')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      if (eventId) {
        query = query.eq('eventId', eventId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useCreateSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prize: any) => {
      const { data, error } = await db.from('event_spin_prizes').insert(prize).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes'] });
      toast.success('Đã tạo giải thưởng');
    },
  });
};

export const useUpdateSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & any) => {
      const { data, error } = await db.from('event_spin_prizes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes'] });
    },
  });
};

export const useDeleteSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('event_spin_prizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes'] });
      toast.success('Đã xóa giải thưởng');
    },
  });
};

// ============ FRIEND HOOKS ============

export const useUnfriend = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId, userId }: { friendId: string; userId: string }) => {
      const { error } = await db
        .from('friendships')
        .delete()
        .or(`and(userId.eq.${userId},friendId.eq.${friendId}),and(userId.eq.${friendId},friendId.eq.${userId})`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success('Đã hủy kết bạn');
    },
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { error } = await db.from('friend_requests').delete().eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      toast.success('Đã hủy lời mời kết bạn');
    },
  });
};

export const useFriendsCount = (userId?: string) => {
  return useQuery({
    queryKey: ['friends-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data, error } = await db
        .from('friendships')
        .select('id', { count: 'exact' })
        .or(`userId.eq.${userId},friendId.eq.${userId}`)
        .eq('status', 'accepted');
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!userId,
  });
};

// ============ WISHLIST HOOKS ============

export const useToggleWishlistNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ wishlistId, notifyOnSale }: { wishlistId: string; notifyOnSale: boolean }) => {
      const { error } = await db
        .from('wishlists')
        .update({ notifyOnSale })
        .eq('id', wishlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

// ============ ADMIN HOOKS ============

export const useAllSellers = () => {
  return useQuery({
    queryKey: ['admin-all-sellers'],
    queryFn: async () => {
      const { data, error } = await db
        .from('sellers')
        .select('*, profile:profiles(*)')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdateSellerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sellerId, status }: { sellerId: string; status: string }) => {
      const { error } = await db.from('sellers').update({ status }).eq('id', sellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-sellers'] });
      toast.success('Đã cập nhật trạng thái');
    },
  });
};

export const useAllWithdrawals = () => {
  return useQuery({
    queryKey: ['admin-all-withdrawals'],
    queryFn: async () => {
      const { data, error } = await db
        .from('withdrawals')
        .select('*, seller:sellers(*, profile:profiles(*))')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ withdrawalId, status, note }: { withdrawalId: string; status: string; note?: string }) => {
      const { error } = await db
        .from('withdrawals')
        .update({ status, processedAt: new Date().toISOString(), note })
        .eq('id', withdrawalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-withdrawals'] });
      toast.success('Đã xử lý yêu cầu rút tiền');
    },
  });
};

export const useVerificationRequests = () => {
  return useQuery({
    queryKey: ['admin-verification-requests'],
    queryFn: async () => {
      const { data, error } = await db
        .from('verification_requests')
        .select('*, seller:sellers(*, profile:profiles(*))')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useProcessVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status, note }: { requestId: string; status: string; note?: string }) => {
      const { error } = await db
        .from('verification_requests')
        .update({ status, processedAt: new Date().toISOString(), note })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      toast.success('Đã xử lý yêu cầu xác minh');
    },
  });
};

export const useDeleteSeller = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sellerId: string) => {
      const { error } = await db.from('sellers').delete().eq('id', sellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-sellers'] });
      toast.success('Đã xóa người bán');
    },
  });
};

// ============ STICKER HOOKS ============

export const uploadStickerImage = async (file: File, folder: string = 'stickers'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload/image?folder=${folder}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  const data = await response.json();
  return data.url;
};

export const extractStickerZip = async (file: File, packId: string): Promise<string[]> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('packId', packId);
  
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/functions/extract-sticker-zip`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Extract failed');
  }
  
  const data = await response.json();
  return data.urls || [];
};

// ============ VOUCHER HOOKS ============

export const useDeleteUserVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userVoucherId: string) => {
      const { error } = await db.from('user_vouchers').delete().eq('id', userVoucherId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      toast.success('Đã xóa voucher');
    },
  });
};

// ============ FLASH SALE HOOKS ============

export const useAdminFlashSaleItems = (flashSaleId?: string) => {
  return useQuery({
    queryKey: ['admin-flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      const { data, error } = await db
        .from('flash_sale_items')
        .select('*, product:products(*)')
        .eq('flashSaleId', flashSaleId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!flashSaleId,
  });
};

export const useAddFlashSaleItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await db.from('flash_sale_items').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-sale-items'] });
      toast.success('Đã thêm sản phẩm vào flash sale');
    },
  });
};
