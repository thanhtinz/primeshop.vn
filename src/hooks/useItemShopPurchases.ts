import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Re-export refreshProfile hook for external use
export const useRefreshProfile = () => {
  const { refreshProfile } = useAuth();
  return refreshProfile;
};

export interface ItemShopPurchase {
  id: string;
  user_id: string;
  item_type: 'avatar_frame' | 'name_color' | 'prime_effect' | 'prime_boost';
  item_id: string;
  item_name: string;
  price: number;
  is_gift: boolean;
  gift_recipient_id: string | null;
  gift_recipient_name: string | null;
  created_at: string;
  // Joined data
  image_url?: string;
  color_value?: string;
  gradient_value?: string;
  is_gradient?: boolean;
  effect_type?: string;
  effect_config?: any;
}

export const useItemShopPurchases = (limit: number = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['item-shop-purchases', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get purchases
      const { data: purchases, error } = await supabase
        .from('item_shop_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get avatar frames
      const frameIds = purchases.filter(p => p.item_type === 'avatar_frame').map(p => p.item_id);
      let framesMap: Record<string, { image_url: string }> = {};
      if (frameIds.length > 0) {
        const { data: frames } = await supabase
          .from('avatar_frames')
          .select('id, image_url')
          .in('id', frameIds);
        if (frames) {
          framesMap = frames.reduce((acc, f) => {
            acc[f.id] = { image_url: f.image_url };
            return acc;
          }, {} as Record<string, { image_url: string }>);
        }
      }

      // Get name colors
      const colorIds = purchases.filter(p => p.item_type === 'name_color').map(p => p.item_id);
      let colorsMap: Record<string, { color_value: string; gradient_value?: string; is_gradient: boolean }> = {};
      if (colorIds.length > 0) {
        const { data: colors } = await supabase
          .from('name_colors')
          .select('id, color_value, gradient_value, is_gradient')
          .in('id', colorIds);
        if (colors) {
          colorsMap = colors.reduce((acc, c) => {
            acc[c.id] = { color_value: c.color_value, gradient_value: c.gradient_value, is_gradient: c.is_gradient };
            return acc;
          }, {} as Record<string, { color_value: string; gradient_value?: string; is_gradient: boolean }>);
        }
      }

      // Get prime effects
      const effectIds = purchases.filter(p => p.item_type === 'prime_effect').map(p => p.item_id);
      let effectsMap: Record<string, { effect_type: string; effect_config: any }> = {};
      if (effectIds.length > 0) {
        const { data: effects } = await supabase
          .from('prime_effects')
          .select('id, effect_type, effect_config')
          .in('id', effectIds);
        if (effects) {
          effectsMap = effects.reduce((acc, e) => {
            acc[e.id] = { effect_type: e.effect_type, effect_config: e.effect_config };
            return acc;
          }, {} as Record<string, { effect_type: string; effect_config: any }>);
        }
      }

      // Attach extra data to purchases
      return purchases.map(p => {
        if (p.item_type === 'avatar_frame' && framesMap[p.item_id]) {
          return { ...p, image_url: framesMap[p.item_id].image_url };
        }
        if (p.item_type === 'name_color' && colorsMap[p.item_id]) {
          return { ...p, ...colorsMap[p.item_id] };
        }
        if (p.item_type === 'prime_effect' && effectsMap[p.item_id]) {
          return { ...p, ...effectsMap[p.item_id] };
        }
        return p;
      }) as ItemShopPurchase[];
    },
    enabled: !!user?.id,
  });
};

export const useSetActiveNameColor = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (colorId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ active_name_color_id: colorId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật màu tên');
    },
    onError: () => {
      toast.error('Không thể cập nhật màu tên');
    },
  });
};

export const useSetActiveEffect = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (effectId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ active_effect_id: effectId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật hiệu ứng');
    },
    onError: () => {
      toast.error('Không thể cập nhật hiệu ứng');
    },
  });
};

export const getItemTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    avatar_frame: 'Khung avatar',
    name_color: 'Màu tên',
    prime_effect: 'Hiệu ứng',
    prime_boost: 'Prime Boost',
  };
  return labels[type] || type;
};

export const getItemTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    avatar_frame: 'bg-green-500/20 text-green-600',
    name_color: 'bg-purple-500/20 text-purple-600',
    prime_effect: 'bg-blue-500/20 text-blue-600',
    prime_boost: 'bg-amber-500/20 text-amber-600',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
};
