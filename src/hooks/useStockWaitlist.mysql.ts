// Hooks for Stock Waitlist - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StockWaitlistItem {
  id: string;
  userId: string;
  productId: string;
  packageId?: string;
  email: string;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
  product?: any;
  package?: any;
  // Legacy mappings
  user_id?: string;
  product_id?: string;
  package_id?: string;
  notified_at?: string;
  created_at?: string;
}

const mapToLegacy = (item: any): StockWaitlistItem => ({
  ...item,
  user_id: item.userId,
  product_id: item.productId,
  package_id: item.packageId,
  notified_at: item.notifiedAt,
  created_at: item.createdAt,
});

export const useStockWaitlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stock-waitlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await db
        .from<any>('stock_waitlist')
        .select('*, product:products(*), package:product_packages(*)')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacy) as StockWaitlistItem[];
    },
    enabled: !!user?.id,
  });
};

export const useAddToWaitlist = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, packageId }: { productId: string; packageId?: string }) => {
      if (!user?.id || !profile?.email) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from('stock_waitlist')
        .insert({
          userId: user.id,
          productId,
          packageId: packageId || null,
          email: profile.email,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          throw new Error('Bạn đã đăng ký nhận thông báo cho sản phẩm này');
        }
        throw error;
      }
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-waitlist'] });
      toast.success('Đã đăng ký nhận thông báo khi có hàng');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi khi đăng ký');
    },
  });
};

export const useRemoveFromWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('stock_waitlist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-waitlist'] });
      toast.success('Đã hủy đăng ký nhận thông báo');
    },
  });
};

export const useCheckWaitlist = (productId: string, packageId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['check-waitlist', productId, packageId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      let query = db
        .from<any>('stock_waitlist')
        .select('id')
        .eq('userId', user.id)
        .eq('productId', productId);

      if (packageId) {
        query = query.eq('packageId', packageId);
      }

      const { data, error } = await query.single();

      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id && !!productId,
  });
};

// Admin: Get all waitlist items for a product
export const useProductWaitlist = (productId: string) => {
  return useQuery({
    queryKey: ['product-waitlist', productId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('stock_waitlist')
        .select('*')
        .eq('productId', productId)
        .eq('notified', false)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapToLegacy) as StockWaitlistItem[];
    },
    enabled: !!productId,
  });
};
