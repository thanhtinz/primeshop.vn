// MySQL version - useSellerBlacklist
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface BlacklistedBuyer {
  id: string;
  seller_id: string;
  buyer_id: string;
  reason: string | null;
  created_at: string;
  buyer?: {
    user_id: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

// Legacy snake_case mapping
function mapBlacklistedBuyer(data: any): BlacklistedBuyer {
  if (!data) return data;
  return {
    id: data.id,
    seller_id: data.sellerId || data.seller_id,
    buyer_id: data.buyerId || data.buyer_id,
    reason: data.reason,
    created_at: data.createdAt || data.created_at,
    buyer: data.buyer ? {
      user_id: data.buyer.userId || data.buyer.user_id,
      email: data.buyer.email,
      full_name: data.buyer.fullName || data.buyer.full_name,
      username: data.buyer.username,
      avatar_url: data.buyer.avatarUrl || data.buyer.avatar_url,
    } : undefined,
  };
}

export const useSellerBlacklist = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-blacklist', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await apiClient.from('seller_buyer_blacklist')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get buyer profiles
      if (data && data.length > 0) {
        const buyerIds = data.map((b: any) => b.buyer_id || b.buyerId);
        const { data: profiles } = await apiClient.from('profiles')
          .select('user_id, email, full_name, username, avatar_url')
          .in('user_id', buyerIds);

        return data.map((blacklist: any) => 
          mapBlacklistedBuyer({
            ...blacklist,
            buyer: profiles?.find((p: any) => (p.user_id || p.userId) === (blacklist.buyer_id || blacklist.buyerId)),
          })
        );
      }

      return (data || []).map(mapBlacklistedBuyer);
    },
    enabled: !!sellerId,
  });
};

export const useAddToBlacklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, buyerId, reason }: { sellerId: string; buyerId: string; reason?: string }) => {
      const { data, error } = await apiClient.from('seller_buyer_blacklist')
        .insert({
          seller_id: sellerId,
          buyer_id: buyerId,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return mapBlacklistedBuyer(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-blacklist'] });
      toast.success('Đã thêm vào danh sách đen');
    },
    onError: () => {
      toast.error('Không thể thêm vào danh sách đen');
    },
  });
};

export const useRemoveFromBlacklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.from('seller_buyer_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-blacklist'] });
      toast.success('Đã xóa khỏi danh sách đen');
    },
    onError: () => {
      toast.error('Không thể xóa khỏi danh sách đen');
    },
  });
};

export const useCheckBlacklisted = (sellerId?: string, buyerId?: string) => {
  return useQuery({
    queryKey: ['is-blacklisted', sellerId, buyerId],
    queryFn: async () => {
      if (!sellerId || !buyerId) return false;

      const { data, error } = await apiClient.from('seller_buyer_blacklist')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('buyer_id', buyerId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!sellerId && !!buyerId,
  });
};
