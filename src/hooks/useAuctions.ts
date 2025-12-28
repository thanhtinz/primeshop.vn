import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AuctionType = 'time_based' | 'buy_now' | 'dutch' | 'sealed';
export type AuctionStatus = 'draft' | 'active' | 'ended' | 'cancelled' | 'sold';

export interface Auction {
  id: string;
  seller_id: string;
  product_id: string;
  auction_type: AuctionType;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_price: number;
  current_price: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  dutch_start_price: number | null;
  dutch_end_price: number | null;
  dutch_decrement_amount: number | null;
  dutch_decrement_interval: number | null;
  min_bid_increment: number;
  max_bids_per_user: number | null;
  start_time: string;
  end_time: string;
  auto_extend_minutes: number;
  status: AuctionStatus;
  winner_id: string | null;
  winning_bid_id: string | null;
  view_count: number;
  bid_count: number;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url?: string;
    user_id: string;
    rating_average?: number;
    rating_count?: number;
  };
  product?: {
    id: string;
    title: string;
    images: string[];
    description?: string;
    price?: number;
    original_price?: number;
    category?: string;
    game_type?: string;
    account_info?: Array<{ name: string; value: string }>;
    category_info?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  max_auto_bid: number | null;
  is_sealed: boolean;
  is_winning: boolean;
  is_auto_bid: boolean;
  created_at: string;
  bidder?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export const useAuctions = (status?: AuctionStatus) => {
  return useQuery({
    queryKey: ['auctions', status],
    queryFn: async () => {
      let query = supabase
        .from('auctions')
        .select(`
          *,
          seller:sellers(id, shop_name, shop_slug, user_id),
          product:seller_products(id, title, images)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Auction[];
    }
  });
};

export const useActiveAuctions = () => {
  return useQuery({
    queryKey: ['auctions', 'active-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          seller:sellers(id, shop_name, shop_slug, shop_avatar_url, user_id, rating_average, rating_count),
          product:seller_products(id, title, images, description, price, original_price, category, game_type, account_info)
        `)
        .eq('status', 'active')
        .gte('end_time', new Date().toISOString())
        .order('end_time', { ascending: true });

      if (error) throw error;
      return data as unknown as Auction[];
    },
    refetchInterval: 10000
  });
};

export const useAuction = (auctionId: string) => {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          seller:sellers(id, shop_name, shop_slug, shop_avatar_url, user_id, rating_average, rating_count),
          product:seller_products(id, title, images, description, price, original_price, category, game_type, account_info)
        `)
        .eq('id', auctionId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Auction;
    },
    enabled: !!auctionId
  });
};

export const useAuctionBids = (auctionId: string) => {
  return useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false });

      if (error) throw error;
      return data as unknown as AuctionBid[];
    },
    enabled: !!auctionId,
    refetchInterval: 5000
  });
};

export const useSellerAuctions = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-auctions', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          product:seller_products(id, title, images)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Auction[];
    },
    enabled: !!sellerId
  });
};

export const useCreateAuction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auctionData: Partial<Auction>) => {
      const { data, error } = await supabase
        .from('auctions')
        .insert(auctionData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['seller-auctions'] });
      toast.success('Đã tạo phiên đấu giá');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi tạo đấu giá');
    }
  });
};

export const useUpdateAuction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Auction> & { id: string }) => {
      const { error } = await supabase
        .from('auctions')
        .update(data as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-auctions'] });
      toast.success('Đã cập nhật đấu giá');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi cập nhật');
    }
  });
};

export const usePlaceBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auctionId, amount, maxAutoBid }: { auctionId: string; amount: number; maxAutoBid?: number }) => {
      const { data, error } = await supabase.rpc('place_auction_bid', {
        p_auction_id: auctionId,
        p_amount: amount,
        p_max_auto_bid: maxAutoBid || null
      });

      if (error) throw error;
      if (data && data[0] && !data[0].success) {
        throw new Error(data[0].message);
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auction-bids', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast.success('Đặt giá thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi đặt giá');
    }
  });
};

export const useBuyNow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auctionId, price }: { auctionId: string; price: number }) => {
      // Use atomic RPC function for safe buy now transaction
      const { data, error } = await supabase.rpc('auction_buy_now', {
        p_auction_id: auctionId,
        p_price: price
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        bid_id?: string;
        order_id?: string;
        order_number?: string;
        amount?: number;
      };

      if (!result.success) {
        throw new Error(result.error || 'Mua thất bại');
      }

      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      toast.success(`Mua thành công! Mã đơn: ${data.order_number}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi mua');
    }
  });
};

export const useWatchAuction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auctionId, watch }: { auctionId: string; watch: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Vui lòng đăng nhập');

      if (watch) {
        const { error } = await supabase
          .from('auction_watchers')
          .insert({
            auction_id: auctionId,
            user_id: userData.user.id
          });
        if (error && error.code !== '23505') throw error; // Ignore duplicate
      } else {
        const { error } = await supabase
          .from('auction_watchers')
          .delete()
          .eq('auction_id', auctionId)
          .eq('user_id', userData.user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-watchers'] });
    }
  });
};

export const useIsWatching = (auctionId: string) => {
  return useQuery({
    queryKey: ['auction-watching', auctionId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { data, error } = await supabase
        .from('auction_watchers')
        .select('id')
        .eq('auction_id', auctionId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!auctionId
  });
};
