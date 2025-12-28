// MySQL version - useMyItems
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MyItem {
  id: string;
  item_id: string;
  item_type: 'avatar_frame' | 'name_color' | 'prime_effect' | 'prime_boost';
  item_name: string;
  purchased_at: string;
  // Visual data
  image_url?: string;
  color_value?: string;
  gradient_value?: string;
  is_gradient?: boolean;
  effect_type?: string;
  effect_config?: any;
}

export const useMyItems = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-items', user?.id],
    queryFn: async (): Promise<MyItem[]> => {
      if (!user?.id) return [];

      const items: MyItem[] = [];

      // 1. Get avatar frames from item_shop_purchases
      const { data: framePurchases } = await apiClient.from('item_shop_purchases')
        .select('id, item_id, item_name, created_at')
        .eq('user_id', user.id)
        .eq('item_type', 'avatar_frame')
        .order('created_at', { ascending: false });

      if (framePurchases && framePurchases.length > 0) {
        const frameIds = framePurchases.map((p: any) => p.item_id || p.itemId);
        const { data: frames } = await apiClient.from('avatar_frames')
          .select('id, image_url')
          .in('id', frameIds);

        const framesMap = (frames || []).reduce((acc: Record<string, string>, f: any) => {
          acc[f.id] = f.image_url || f.imageUrl;
          return acc;
        }, {});

        framePurchases.forEach((p: any) => {
          items.push({
            id: p.id,
            item_id: p.item_id || p.itemId,
            item_type: 'avatar_frame',
            item_name: p.item_name || p.itemName,
            purchased_at: p.created_at || p.createdAt,
            image_url: framesMap[p.item_id || p.itemId],
          });
        });
      }

      // 2. Get name colors from user_name_colors
      const { data: userColors } = await apiClient.from('user_name_colors')
        .select('id, color_id, purchased_at')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (userColors && userColors.length > 0) {
        const colorIds = userColors.map((c: any) => c.color_id || c.colorId);
        const { data: colors } = await apiClient.from('name_colors')
          .select('id, name, color_value, gradient_value, is_gradient')
          .in('id', colorIds);

        const colorsMap = (colors || []).reduce((acc: Record<string, any>, c: any) => {
          acc[c.id] = c;
          return acc;
        }, {});

        userColors.forEach((uc: any) => {
          const colorId = uc.color_id || uc.colorId;
          const color = colorsMap[colorId];
          if (color) {
            items.push({
              id: uc.id,
              item_id: colorId,
              item_type: 'name_color',
              item_name: color.name,
              purchased_at: uc.purchased_at || uc.purchasedAt,
              color_value: color.color_value || color.colorValue,
              gradient_value: color.gradient_value || color.gradientValue,
              is_gradient: color.is_gradient ?? color.isGradient,
            });
          }
        });
      }

      // 3. Get effects from user_prime_effects
      const { data: userEffects } = await apiClient.from('user_prime_effects')
        .select('id, effect_id, purchased_at')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (userEffects && userEffects.length > 0) {
        const effectIds = userEffects.map((e: any) => e.effect_id || e.effectId);
        const { data: effects } = await apiClient.from('prime_effects')
          .select('id, name, effect_type, effect_config')
          .in('id', effectIds);

        const effectsMap = (effects || []).reduce((acc: Record<string, any>, e: any) => {
          acc[e.id] = e;
          return acc;
        }, {});

        userEffects.forEach((ue: any) => {
          const effectId = ue.effect_id || ue.effectId;
          const effect = effectsMap[effectId];
          if (effect) {
            items.push({
              id: ue.id,
              item_id: effectId,
              item_type: 'prime_effect',
              item_name: effect.name,
              purchased_at: ue.purchased_at || ue.purchasedAt,
              effect_type: effect.effect_type || effect.effectType,
              effect_config: effect.effect_config || effect.effectConfig,
            });
          }
        });
      }

      // 4. Get prime boosts from item_shop_purchases
      const { data: boostPurchases } = await apiClient.from('item_shop_purchases')
        .select('id, item_id, item_name, created_at')
        .eq('user_id', user.id)
        .eq('item_type', 'prime_boost')
        .order('created_at', { ascending: false });

      if (boostPurchases) {
        boostPurchases.forEach((p: any) => {
          items.push({
            id: p.id,
            item_id: p.item_id || p.itemId,
            item_type: 'prime_boost',
            item_name: p.item_name || p.itemName,
            purchased_at: p.created_at || p.createdAt,
          });
        });
      }

      return items;
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

      const { error } = await apiClient.from('profiles')
        .update({ active_name_color_id: colorId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile?.();
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
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

      const { error } = await apiClient.from('profiles')
        .update({ active_effect_id: effectId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile?.();
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
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
