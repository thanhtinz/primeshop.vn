import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvatarFrame {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  prime_price: number | null;
  is_active: boolean;
  sort_order: number;
  avatar_border_radius: string;
  created_at: string;
  updated_at: string;
}

interface UserAvatarFrame {
  id: string;
  user_id: string;
  frame_id: string;
  purchased_at: string;
}

export const useAvatarFrames = () => {
  return useQuery({
    queryKey: ['avatarFrames'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatar_frames')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as AvatarFrame[];
    },
  });
};

export const useAllAvatarFrames = () => {
  return useQuery({
    queryKey: ['allAvatarFrames'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatar_frames')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as AvatarFrame[];
    },
  });
};

export const useUserAvatarFrames = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userAvatarFrames', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_avatar_frames')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserAvatarFrame[];
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
      const finalPrice = hasPrime && frame.prime_price !== null ? frame.prime_price : frame.price;
      
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'avatar_frame',
        p_item_id: frame.id,
        p_item_name: frame.name,
        p_price: finalPrice,
        p_recipient_user_id: null
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể mua khung avatar');
      }

      return result;
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

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_frame_id: frameId })
        .eq('user_id', user.id);

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
    mutationFn: async (frame: Omit<AvatarFrame, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('avatar_frames')
        .insert(frame)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('avatar_frames')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
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
      const { error } = await supabase
        .from('avatar_frames')
        .delete()
        .eq('id', id);

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
