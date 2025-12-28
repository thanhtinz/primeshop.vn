import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  notify_on_sale: boolean;
  created_at: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    price: number | null;
  };
}

export const useWishlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await (supabase as any)
        .from('wishlist')
        .select(`
          *,
          product:products(id, name, slug, image_url, price, product_images(image_url, is_primary))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map data to include image from product_images if main image_url is empty
      return (data || []).map((item: any) => {
        if (item.product) {
          const primaryImage = item.product.product_images?.find((img: any) => img.is_primary);
          const firstImage = item.product.product_images?.[0];
          
          if (!item.product.image_url && (primaryImage || firstImage)) {
            item.product.image_url = primaryImage?.image_url || firstImage?.image_url;
          }
        }
        return item;
      }) as WishlistItem[];
    },
    enabled: !!user,
  });
};

export const useIsInWishlist = (productId: string) => {
  const { data: wishlist } = useWishlist();
  return wishlist?.some(item => item.product_id === productId) || false;
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, notifyOnSale = false }: { productId: string; notifyOnSale?: boolean }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await (supabase as any)
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: productId,
          notify_on_sale: notifyOnSale,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Sản phẩm đã có trong danh sách yêu thích');
        }
        throw error;
      }
      return data;
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

      const { error } = await (supabase as any)
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

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

export const useToggleWishlistNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ productId, notifyOnSale }: { productId: string; notifyOnSale: boolean }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { error } = await (supabase as any)
        .from('wishlist')
        .update({ notify_on_sale: notifyOnSale })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(variables.notifyOnSale 
        ? 'Đã bật thông báo khi giảm giá' 
        : 'Đã tắt thông báo khi giảm giá'
      );
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};
