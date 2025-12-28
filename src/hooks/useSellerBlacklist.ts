import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

export const useSellerBlacklist = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-blacklist', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('seller_buyer_blacklist')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get buyer profiles
      if (data.length > 0) {
        const buyerIds = data.map(b => b.buyer_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, username, avatar_url')
          .in('user_id', buyerIds);

        return data.map(blacklist => ({
          ...blacklist,
          buyer: profiles?.find(p => p.user_id === blacklist.buyer_id),
        })) as BlacklistedBuyer[];
      }

      return data as BlacklistedBuyer[];
    },
    enabled: !!sellerId,
  });
};

export const useAddToBlacklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sellerId, buyerId, reason }: { sellerId: string; buyerId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('seller_buyer_blacklist')
        .insert({
          seller_id: sellerId,
          buyer_id: buyerId,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('seller_buyer_blacklist')
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

      const { data, error } = await supabase
        .from('seller_buyer_blacklist')
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
