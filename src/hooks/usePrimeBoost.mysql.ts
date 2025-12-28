// MySQL version - usePrimeBoost
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface PrimeBoostPlan {
  id: string;
  name: string;
  name_en: string | null;
  duration_days: number;
  price: number;
  discount_percent: number;
  points_multiplier: number;
  is_active: boolean;
  sort_order: number;
}

export interface PrimeBoostSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  purchased_at: string;
  amount_paid: number;
}

export interface NameColor {
  id: string;
  name: string;
  name_en: string | null;
  color_value: string;
  gradient_value: string | null;
  is_gradient: boolean;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface PrimeEffect {
  id: string;
  name: string;
  name_en: string | null;
  effect_type: string;
  effect_config: Record<string, any>;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface PrimeBoostBenefit {
  id: string;
  benefit_key: string;
  benefit_name: string;
  benefit_name_en: string | null;
  benefit_value: string | null;
  is_enabled: boolean;
  sort_order: number;
}

// Legacy mappings
function mapPlan(data: any): PrimeBoostPlan {
  if (!data) return data;
  return {
    id: data.id,
    name: data.name,
    name_en: data.nameEn || data.name_en,
    duration_days: data.durationDays || data.duration_days,
    price: data.price,
    discount_percent: data.discountPercent || data.discount_percent || 0,
    points_multiplier: data.pointsMultiplier || data.points_multiplier || 1,
    is_active: data.isActive ?? data.is_active ?? true,
    sort_order: data.sortOrder || data.sort_order || 0,
  };
}

function mapSubscription(data: any): PrimeBoostSubscription {
  if (!data) return data;
  return {
    id: data.id,
    user_id: data.userId || data.user_id,
    plan_id: data.planId || data.plan_id,
    starts_at: data.startsAt || data.starts_at,
    expires_at: data.expiresAt || data.expires_at,
    is_active: data.isActive ?? data.is_active ?? true,
    purchased_at: data.purchasedAt || data.purchased_at,
    amount_paid: data.amountPaid || data.amount_paid,
  };
}

function mapNameColor(data: any): NameColor {
  if (!data) return data;
  return {
    id: data.id,
    name: data.name,
    name_en: data.nameEn || data.name_en,
    color_value: data.colorValue || data.color_value,
    gradient_value: data.gradientValue || data.gradient_value,
    is_gradient: data.isGradient ?? data.is_gradient ?? false,
    price: data.price,
    is_active: data.isActive ?? data.is_active ?? true,
    sort_order: data.sortOrder || data.sort_order || 0,
  };
}

function mapPrimeEffect(data: any): PrimeEffect {
  if (!data) return data;
  return {
    id: data.id,
    name: data.name,
    name_en: data.nameEn || data.name_en,
    effect_type: data.effectType || data.effect_type,
    effect_config: data.effectConfig || data.effect_config || {},
    price: data.price,
    is_active: data.isActive ?? data.is_active ?? true,
    sort_order: data.sortOrder || data.sort_order || 0,
  };
}

// Fetch Prime Boost plans
export const usePrimeBoostPlans = () => {
  return useQuery({
    queryKey: ['prime-boost-plans'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('prime_boost_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map(mapPlan);
    }
  });
};

// Fetch user's Prime Boost subscription
export const useUserPrimeSubscription = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-prime-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await apiClient.from('prime_boost_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data ? mapSubscription(data) : null;
    },
    enabled: !!user?.id
  });
};

// Check if user has active Prime Boost
export const useHasPrimeBoost = () => {
  const { profile } = useAuth();
  const { data: subscription, isLoading } = useUserPrimeSubscription();
  
  const hasActiveSubscription = !!subscription && new Date(subscription.expires_at) > new Date();
  
  const hasProfilePrime = !!profile?.has_prime_boost && 
    !!profile?.prime_expires_at && 
    new Date(profile.prime_expires_at) > new Date();
  
  const hasActivePrime = hasActiveSubscription || hasProfilePrime;
  
  const primeType = profile?.prime_plan_type as 'basic' | 'boost' | null | undefined;
  
  return {
    hasPrime: hasActivePrime,
    hasPrimeBasic: hasActivePrime && primeType === 'basic',
    hasPrimeBoost: hasActivePrime && (primeType === 'boost' || !primeType),
    primeType: hasActivePrime ? (primeType || 'boost') : null,
    subscription,
    isLoading
  };
};

// Purchase Prime Boost
export const usePurchasePrimeBoost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId, amountPaid }: { planId: string; amountPaid: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await apiClient.post('/prime/purchase', {
        userId: user.id,
        planId,
        amountPaid
      });

      if (error) throw error;
      
      if (!data.success) {
        if (data.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        }
        throw new Error(data.error || 'Không thể mua Prime Boost');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prime-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Mua Prime Boost thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    }
  });
};

// Fetch name colors
export const useNameColors = () => {
  return useQuery({
    queryKey: ['name-colors'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('name_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map(mapNameColor);
    }
  });
};

// Fetch user's purchased name colors
export const useUserNameColors = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-name-colors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await apiClient.from('user_name_colors')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Get color details
      const colorIds = (data || []).map((d: any) => d.color_id || d.colorId);
      if (colorIds.length > 0) {
        const { data: colors } = await apiClient.from('name_colors')
          .select('*')
          .in('id', colorIds);

        return (data || []).map((d: any) => ({
          ...d,
          name_colors: colors?.find((c: any) => c.id === (d.color_id || d.colorId))
        }));
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });
};

// Purchase name color
export const usePurchaseNameColor = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (colorId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: color, error: colorError } = await apiClient.from('name_colors')
        .select('name, price')
        .eq('id', colorId)
        .single();
      
      if (colorError) throw colorError;
      
      const { data, error } = await apiClient.post('/shop/purchase-item', {
        userId: user.id,
        itemType: 'name_color',
        itemId: colorId,
        itemName: color.name,
        price: color.price,
      });

      if (error) throw error;
      
      if (!data.success) {
        if (data.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        } else if (data.error === 'Already owns this item') {
          throw new Error('Bạn đã sở hữu màu tên này');
        }
        throw new Error(data.error || 'Không thể mua màu tên');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-name-colors'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Mua màu tên thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    }
  });
};

// Set active name color
export const useSetActiveNameColor = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (colorId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Deactivate all colors
      await apiClient.from('user_name_colors')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (colorId) {
        // Activate selected color
        await apiClient.from('user_name_colors')
          .update({ is_active: true })
          .eq('user_id', user.id)
          .eq('color_id', colorId);
      }
      
      // Update profile
      await apiClient.from('profiles')
        .update({ active_name_color_id: colorId })
        .eq('user_id', user.id);
      
      return colorId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-name-colors'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật màu tên!');
    }
  });
};

// Fetch prime effects
export const usePrimeEffects = () => {
  return useQuery({
    queryKey: ['prime-effects'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('prime_effects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map(mapPrimeEffect);
    }
  });
};

// Fetch user's purchased effects
export const useUserPrimeEffects = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-prime-effects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await apiClient.from('user_prime_effects')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Get effect details
      const effectIds = (data || []).map((d: any) => d.effect_id || d.effectId);
      if (effectIds.length > 0) {
        const { data: effects } = await apiClient.from('prime_effects')
          .select('*')
          .in('id', effectIds);

        return (data || []).map((d: any) => ({
          ...d,
          prime_effects: effects?.find((e: any) => e.id === (d.effect_id || d.effectId))
        }));
      }
      
      return data || [];
    },
    enabled: !!user?.id
  });
};

// Purchase effect
export const usePurchasePrimeEffect = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (effectId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: effect, error: effectError } = await apiClient.from('prime_effects')
        .select('name, price')
        .eq('id', effectId)
        .single();
      
      if (effectError) throw effectError;
      
      const { data, error } = await apiClient.post('/shop/purchase-item', {
        userId: user.id,
        itemType: 'prime_effect',
        itemId: effectId,
        itemName: effect.name,
        price: effect.price,
      });

      if (error) throw error;
      
      if (!data.success) {
        if (data.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        } else if (data.error === 'Already owns this item') {
          throw new Error('Bạn đã sở hữu hiệu ứng này');
        }
        throw new Error(data.error || 'Không thể mua hiệu ứng');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prime-effects'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Mua hiệu ứng thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    }
  });
};

// Set active effect
export const useSetActivePrimeEffect = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (effectId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Deactivate all effects
      await apiClient.from('user_prime_effects')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (effectId) {
        // Activate selected effect
        await apiClient.from('user_prime_effects')
          .update({ is_active: true })
          .eq('user_id', user.id)
          .eq('effect_id', effectId);
      }
      
      // Update profile
      await apiClient.from('profiles')
        .update({ active_effect_id: effectId })
        .eq('user_id', user.id);
      
      return effectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prime-effects'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Đã cập nhật hiệu ứng!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    }
  });
};

// Fetch benefits
export const usePrimeBoostBenefits = () => {
  return useQuery({
    queryKey: ['prime-boost-benefits'],
    queryFn: async () => {
      const { data, error } = await apiClient.from('prime_boost_benefits')
        .select('*')
        .eq('is_enabled', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        benefit_key: d.benefitKey || d.benefit_key,
        benefit_name: d.benefitName || d.benefit_name,
        benefit_name_en: d.benefitNameEn || d.benefit_name_en,
        benefit_value: d.benefitValue || d.benefit_value,
        is_enabled: d.isEnabled ?? d.is_enabled ?? true,
        sort_order: d.sortOrder || d.sort_order || 0,
      }));
    }
  });
};
