import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StockWaitlistItem {
  id: string;
  user_id: string;
  product_id: string;
  package_id?: string;
  email: string;
  notified: boolean;
  notified_at?: string;
  created_at: string;
  product?: any;
  package?: any;
}

export const useStockWaitlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stock-waitlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('stock_waitlist')
        .select(`
          *,
          product:products(*),
          package:product_packages(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockWaitlistItem[];
    },
    enabled: !!user?.id
  });
};

export const useAddToWaitlist = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, packageId }: { productId: string; packageId?: string }) => {
      if (!user?.id || !profile?.email) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('stock_waitlist')
        .insert({
          user_id: user.id,
          product_id: productId,
          package_id: packageId || null,
          email: profile.email
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bạn đã đăng ký nhận thông báo cho sản phẩm này');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-waitlist'] });
      toast.success('Đã đăng ký nhận thông báo khi có hàng');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi đăng ký');
    }
  });
};

export const useRemoveFromWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_waitlist')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-waitlist'] });
      toast.success('Đã hủy đăng ký nhận thông báo');
    }
  });
};

export const useCheckWaitlist = (productId: string, packageId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stock-waitlist-check', user?.id, productId, packageId],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from('stock_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (packageId) {
        query = query.eq('package_id', packageId);
      } else {
        query = query.is('package_id', null);
      }

      const { data } = await query.maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!productId
  });
};
