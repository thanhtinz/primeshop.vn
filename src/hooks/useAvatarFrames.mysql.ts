// Hooks for Avatar Frames - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvatarFrame {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  price: number;
  primePrice: number | null;
  isActive: boolean;
  sortOrder: number;
  avatarBorderRadius: string;
  createdAt: string;
  updatedAt: string;
  // Legacy
  image_url?: string;
  prime_price?: number | null;
  is_active?: boolean;
  sort_order?: number;
  avatar_border_radius?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserAvatarFrame {
  id: string;
  userId: string;
  frameId: string;
  purchasedAt: string;
  // Legacy
  user_id?: string;
  frame_id?: string;
  purchased_at?: string;
}

const mapFrameToLegacy = (f: any): AvatarFrame => ({
  ...f,
  image_url: f.imageUrl,
  prime_price: f.primePrice,
  is_active: f.isActive,
  sort_order: f.sortOrder,
  avatar_border_radius: f.avatarBorderRadius,
  created_at: f.createdAt,
  updated_at: f.updatedAt,
});

const mapUserFrameToLegacy = (uf: any): UserAvatarFrame => ({
  ...uf,
  user_id: uf.userId,
  frame_id: uf.frameId,
  purchased_at: uf.purchasedAt,
});

export const useAvatarFrames = () => {
  return useQuery({
    queryKey: ['avatarFrames'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('avatar_frames')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapFrameToLegacy);
    },
  });
};

export const useAllAvatarFrames = () => {
  return useQuery({
    queryKey: ['allAvatarFrames'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('avatar_frames')
        .select('*')
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapFrameToLegacy);
    },
  });
};

export const useUserAvatarFrames = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userAvatarFrames', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await db
        .from<any>('user_avatar_frames')
        .select('*')
        .eq('userId', user.id);

      if (error) throw error;
      return (data || []).map(mapUserFrameToLegacy);
    },
    enabled: !!user?.id,
  });
};

export const usePurchaseFrame = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (frame: AvatarFrame) => {
      if (!user?.id || !profile) throw new Error('Not authenticated');
      
      // Determine price based on Prime status
      const hasPrime = profile.has_prime_boost && profile.prime_expires_at && new Date(profile.prime_expires_at) > new Date();
      const finalPrice = hasPrime && (frame.primePrice ?? frame.prime_price) !== null 
        ? (frame.primePrice ?? frame.prime_price!) 
        : frame.price;
      
      // Use RPC function for atomic purchase
      const { data, error } = await rpc.invoke<{ success: boolean; error?: string; new_balance?: number }>('purchase_shop_item', {
        user_id: user.id,
        item_type: 'avatar_frame',
        item_id: frame.id,
        item_name: frame.name,
        price: finalPrice,
        recipient_user_id: null
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Không thể mua khung avatar');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAvatarFrames'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Mua khung avatar thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể mua khung avatar');
    },
  });
};

export const useSetActiveFrame = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (frameId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await db
        .from('profiles')
        .update({ avatarFrameId: frameId })
        .eq('userId', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật khung avatar');
    },
    onError: () => {
      toast.error('Không thể cập nhật khung avatar');
    },
  });
};

export const useCreateAvatarFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frame: Partial<AvatarFrame>) => {
      const { data, error } = await db
        .from<any>('avatar_frames')
        .insert({
          name: frame.name,
          description: frame.description,
          imageUrl: frame.imageUrl || frame.image_url,
          price: frame.price || 0,
          primePrice: frame.primePrice ?? frame.prime_price,
          isActive: frame.isActive ?? frame.is_active ?? true,
          sortOrder: frame.sortOrder ?? frame.sort_order ?? 0,
          avatarBorderRadius: frame.avatarBorderRadius || frame.avatar_border_radius || '50%',
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapFrameToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarFrames'] });
      queryClient.invalidateQueries({ queryKey: ['allAvatarFrames'] });
      toast.success('Tạo khung avatar thành công');
    },
    onError: () => {
      toast.error('Không thể tạo khung avatar');
    },
  });
};

export const useUpdateAvatarFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AvatarFrame> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl ?? updates.image_url;
      }
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.primePrice !== undefined || updates.prime_price !== undefined) {
        updateData.primePrice = updates.primePrice ?? updates.prime_price;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.sortOrder !== undefined || updates.sort_order !== undefined) {
        updateData.sortOrder = updates.sortOrder ?? updates.sort_order;
      }
      if (updates.avatarBorderRadius !== undefined || updates.avatar_border_radius !== undefined) {
        updateData.avatarBorderRadius = updates.avatarBorderRadius ?? updates.avatar_border_radius;
      }

      const { data, error } = await db
        .from<any>('avatar_frames')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapFrameToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarFrames'] });
      queryClient.invalidateQueries({ queryKey: ['allAvatarFrames'] });
      toast.success('Cập nhật khung avatar thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật khung avatar');
    },
  });
};

export const useDeleteAvatarFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Remove frame from users who have it active
      await db.from('profiles').update({ avatarFrameId: null }).eq('avatarFrameId', id);
      
      // Delete user purchases
      await db.from('user_avatar_frames').delete().eq('frameId', id);
      
      // Delete the frame
      const { error } = await db.from('avatar_frames').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarFrames'] });
      queryClient.invalidateQueries({ queryKey: ['allAvatarFrames'] });
      toast.success('Xóa khung avatar thành công');
    },
    onError: () => {
      toast.error('Không thể xóa khung avatar');
    },
  });
};

// Gift frame to user
export const useGiftAvatarFrame = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ frame, recipientUserId }: { frame: AvatarFrame; recipientUserId: string }) => {
      if (!user?.id || !profile) throw new Error('Not authenticated');
      
      const hasPrime = profile.has_prime_boost && profile.prime_expires_at && new Date(profile.prime_expires_at) > new Date();
      const finalPrice = hasPrime && (frame.primePrice ?? frame.prime_price) !== null 
        ? (frame.primePrice ?? frame.prime_price!) 
        : frame.price;
      
      const { data, error } = await rpc.invoke<{ success: boolean; error?: string; new_balance?: number }>('purchase_shop_item', {
        user_id: user.id,
        item_type: 'avatar_frame',
        item_id: frame.id,
        item_name: frame.name,
        price: finalPrice,
        recipient_user_id: recipientUserId
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Không thể tặng khung avatar');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Tặng khung avatar thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tặng khung avatar');
    },
  });
};
