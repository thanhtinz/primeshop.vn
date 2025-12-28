// Hooks for Wishlist - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  notifyOnSale: boolean;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    price: number | null;
  };
  // Legacy mappings
  user_id?: string;
  product_id?: string;
  notify_on_sale?: boolean;
  created_at?: string;
}

const mapToLegacy = (item: any): WishlistItem => ({
  ...item,
  user_id: item.userId,
  product_id: item.productId,
  notify_on_sale: item.notifyOnSale,
  created_at: item.createdAt,
  product: item.product ? {
    ...item.product,
    image_url: item.product.imageUrl,
  } : undefined,
});

export const useWishlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<WishlistItem>('wishlist_items')
        .select('*, product:products(id, name, slug, imageUrl, price)')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacy);
    },
    enabled: !!user,
  });
};

export const useIsInWishlist = (productId: string) => {
  const { data: wishlist } = useWishlist();
  return wishlist?.some(item => item.productId === productId || item.product_id === productId) || false;
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, notifyOnSale = false }: { productId: string; notifyOnSale?: boolean }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<WishlistItem>('wishlist_items')
        .insert({
          userId: user.id,
          productId,
          notifyOnSale,
        })
        .select('*')
        .single();

      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('Sản phẩm đã có trong danh sách yêu thích');
        }
        throw error;
      }
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Đã thêm vào danh sách yêu thích');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await db
        .from('wishlist_items')
        .delete()
        .eq('userId', user.id)
        .eq('productId', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Đã xóa khỏi danh sách yêu thích');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data } = await rpc('toggle_wishlist', { productId });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(data?.added ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateWishlistNotify = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, notifyOnSale }: { productId: string; notifyOnSale: boolean }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await db
        .from<WishlistItem>('wishlist_items')
        .update({ notifyOnSale })
        .eq('userId', user.id)
        .eq('productId', productId)
        .select('*')
        .single();

      if (error) throw error;
      return mapToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};
