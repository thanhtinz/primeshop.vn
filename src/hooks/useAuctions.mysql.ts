// Hooks for Auctions - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AuctionType = 'time_based' | 'buy_now' | 'dutch' | 'sealed';
export type AuctionStatus = 'draft' | 'active' | 'ended' | 'cancelled' | 'sold';

export interface Auction {
  id: string;
  sellerId: string;
  productId: string;
  auctionType: AuctionType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startingPrice: number;
  currentPrice: number;
  reservePrice: number | null;
  buyNowPrice: number | null;
  minBidIncrement: number;
  maxBidsPerUser: number | null;
  startTime: string;
  endTime: string;
  autoExtendMinutes: number;
  status: AuctionStatus;
  winnerId: string | null;
  winningBidId: string | null;
  viewCount: number;
  bidCount: number;
  createdAt: string;
  updatedAt: string;
  seller?: any;
  product?: any;
  // Legacy mappings
  seller_id?: string;
  product_id?: string;
  auction_type?: AuctionType;
  image_url?: string | null;
  starting_price?: number;
  current_price?: number;
  reserve_price?: number | null;
  buy_now_price?: number | null;
  min_bid_increment?: number;
  max_bids_per_user?: number | null;
  start_time?: string;
  end_time?: string;
  auto_extend_minutes?: number;
  winner_id?: string | null;
  winning_bid_id?: string | null;
  view_count?: number;
  bid_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  maxAutoBid: number | null;
  isSealed: boolean;
  isWinning: boolean;
  isAutoBid: boolean;
  createdAt: string;
  bidder?: any;
  // Legacy mappings
  auction_id?: string;
  bidder_id?: string;
  max_auto_bid?: number | null;
  is_sealed?: boolean;
  is_winning?: boolean;
  is_auto_bid?: boolean;
  created_at?: string;
}

const mapAuctionToLegacy = (a: any): Auction => ({
  ...a,
  seller_id: a.sellerId,
  product_id: a.productId,
  auction_type: a.auctionType,
  image_url: a.imageUrl,
  starting_price: a.startingPrice,
  current_price: a.currentPrice,
  reserve_price: a.reservePrice,
  buy_now_price: a.buyNowPrice,
  min_bid_increment: a.minBidIncrement,
  max_bids_per_user: a.maxBidsPerUser,
  start_time: a.startTime,
  end_time: a.endTime,
  auto_extend_minutes: a.autoExtendMinutes,
  winner_id: a.winnerId,
  winning_bid_id: a.winningBidId,
  view_count: a.viewCount,
  bid_count: a.bidCount,
  created_at: a.createdAt,
  updated_at: a.updatedAt,
});

const mapBidToLegacy = (b: any): AuctionBid => ({
  ...b,
  auction_id: b.auctionId,
  bidder_id: b.bidderId,
  max_auto_bid: b.maxAutoBid,
  is_sealed: b.isSealed,
  is_winning: b.isWinning,
  is_auto_bid: b.isAutoBid,
  created_at: b.createdAt,
});

export const useAuctions = (status?: AuctionStatus) => {
  return useQuery({
    queryKey: ['auctions', status],
    queryFn: async () => {
      let query = db.from<any>('auctions').select('*').order('createdAt', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapAuctionToLegacy);
    }
  });
};

export const useActiveAuctions = () => {
  return useQuery({
    queryKey: ['auctions', 'active-public'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('auctions')
        .select('*')
        .eq('status', 'active')
        .gte('endTime', new Date().toISOString())
        .order('endTime', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapAuctionToLegacy);
    },
    refetchInterval: 10000
  });
};

export const useAuction = (auctionId: string) => {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      return data ? mapAuctionToLegacy(data) : null;
    },
    enabled: !!auctionId
  });
};

export const useAuctionBids = (auctionId: string) => {
  return useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('auction_bids')
        .select('*')
        .eq('auctionId', auctionId)
        .order('amount', { ascending: false });

      if (error) throw error;
      
      // Get bidder profiles
      const bidderIds = [...new Set(data?.map((b: any) => b.bidderId) || [])];
      if (bidderIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('userId, fullName, avatarUrl, username')
          .in('userId', bidderIds);
        
        const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
          full_name: p.fullName,
          avatar_url: p.avatarUrl,
          username: p.username,
        }]));
        
        return (data || []).map((b: any) => ({
          ...mapBidToLegacy(b),
          bidder: profileMap.get(b.bidderId),
        }));
      }
      
      return (data || []).map(mapBidToLegacy);
    },
    enabled: !!auctionId,
    refetchInterval: 5000
  });
};

export const useMyAuctions = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-auctions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get user's seller profile first
      const { data: seller } = await db
        .from<any>('sellers')
        .select('id')
        .eq('userId', user.id)
        .single();
      
      if (!seller) return [];
      
      const { data, error } = await db
        .from<any>('auctions')
        .select('*')
        .eq('sellerId', seller.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAuctionToLegacy);
    },
    enabled: !!user?.id
  });
};

export const useCreateAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (auction: Partial<Auction>) => {
      const { data, error } = await db
        .from<any>('auctions')
        .insert({
          sellerId: auction.sellerId || auction.seller_id,
          productId: auction.productId || auction.product_id,
          auctionType: auction.auctionType || auction.auction_type || 'time_based',
          title: auction.title,
          description: auction.description,
          imageUrl: auction.imageUrl || auction.image_url,
          startingPrice: auction.startingPrice ?? auction.starting_price ?? 0,
          currentPrice: auction.currentPrice ?? auction.current_price ?? auction.startingPrice ?? auction.starting_price ?? 0,
          reservePrice: auction.reservePrice ?? auction.reserve_price,
          buyNowPrice: auction.buyNowPrice ?? auction.buy_now_price,
          minBidIncrement: auction.minBidIncrement ?? auction.min_bid_increment ?? 10000,
          maxBidsPerUser: auction.maxBidsPerUser ?? auction.max_bids_per_user,
          startTime: auction.startTime || auction.start_time,
          endTime: auction.endTime || auction.end_time,
          autoExtendMinutes: auction.autoExtendMinutes ?? auction.auto_extend_minutes ?? 5,
          status: 'draft',
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapAuctionToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
      toast.success('Đã tạo đấu giá');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Auction> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl ?? updates.image_url;
      }
      if (updates.startingPrice !== undefined || updates.starting_price !== undefined) {
        updateData.startingPrice = updates.startingPrice ?? updates.starting_price;
      }
      if (updates.reservePrice !== undefined || updates.reserve_price !== undefined) {
        updateData.reservePrice = updates.reservePrice ?? updates.reserve_price;
      }
      if (updates.buyNowPrice !== undefined || updates.buy_now_price !== undefined) {
        updateData.buyNowPrice = updates.buyNowPrice ?? updates.buy_now_price;
      }
      if (updates.startTime !== undefined || updates.start_time !== undefined) {
        updateData.startTime = updates.startTime ?? updates.start_time;
      }
      if (updates.endTime !== undefined || updates.end_time !== undefined) {
        updateData.endTime = updates.endTime ?? updates.end_time;
      }
      if (updates.status !== undefined) updateData.status = updates.status;
      
      const { data, error } = await db
        .from<any>('auctions')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapAuctionToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
      queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
      toast.success('Đã cập nhật đấu giá');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const usePlaceBid = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ auctionId, amount, maxAutoBid }: { 
      auctionId: string; 
      amount: number;
      maxAutoBid?: number;
    }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await rpc.invoke<{
        success: boolean;
        error?: string;
        bid_id?: string;
        current_price?: number;
        is_winning?: boolean;
      }>('place_auction_bid', {
        auction_id: auctionId,
        bidder_id: user.id,
        amount,
        max_auto_bid: maxAutoBid || null,
      });
      
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Đặt giá thất bại');
      }
      
      return data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auction-bids', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      if (result.is_winning) {
        toast.success('Bạn đang dẫn đầu!');
      } else {
        toast.success('Đã đặt giá thành công');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useBuyNow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (auctionId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await rpc.invoke<{
        success: boolean;
        error?: string;
        order_id?: string;
      }>('auction_buy_now', {
        auction_id: auctionId,
        buyer_id: user.id,
      });
      
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Mua ngay thất bại');
      }
      
      return data;
    },
    onSuccess: (_, auctionId) => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Mua thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete bids first
      await db.from('auction_bids').delete().eq('auctionId', id);
      
      const { error } = await db.from('auctions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
      toast.success('Đã xóa đấu giá');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useMyBids = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-bids', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await db
        .from<any>('auction_bids')
        .select('*')
        .eq('bidderId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      // Get auction info
      const auctionIds = [...new Set(data?.map((b: any) => b.auctionId) || [])];
      if (auctionIds.length > 0) {
        const { data: auctions } = await db
          .from<any>('auctions')
          .select('*')
          .in('id', auctionIds);
        
        const auctionMap = new Map(auctions?.map((a: any) => [a.id, mapAuctionToLegacy(a)]));
        
        return (data || []).map((b: any) => ({
          ...mapBidToLegacy(b),
          auction: auctionMap.get(b.auctionId),
        }));
      }
      
      return (data || []).map(mapBidToLegacy);
    },
    enabled: !!user?.id
  });
};

// Get seller's auctions
export const useSellerAuctions = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-auctions', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await db
        .from<any>('auctions')
        .select('*, product:products(*)')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAuctionToLegacy);
    },
    enabled: !!sellerId,
  });
};

// Watch auction
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

// Check if user is watching auction
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