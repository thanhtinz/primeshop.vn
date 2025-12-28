import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// Fetch Prime Boost plans
export const usePrimeBoostPlans = () => {
  return useQuery({
    queryKey: ['prime-boost-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prime_boost_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as PrimeBoostPlan[];
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
      
      const { data, error } = await supabase
        .from('prime_boost_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as PrimeBoostSubscription | null;
    },
    enabled: !!user?.id
  });
};

// Check if user has active Prime Boost
export const useHasPrimeBoost = () => {
  const { profile } = useAuth();
  const { data: subscription, isLoading } = useUserPrimeSubscription();
  
  // Check subscription-based prime
  const hasActiveSubscription = !!subscription && new Date(subscription.expires_at) > new Date();
  
  // Check profile-based prime (legacy or direct)
  const hasProfilePrime = !!profile?.has_prime_boost && 
    !!profile?.prime_expires_at && 
    new Date(profile.prime_expires_at) > new Date();
  
  // User has prime if either subscription or profile flag is active
  const hasActivePrime = hasActiveSubscription || hasProfilePrime;
  
  const primeType = profile?.prime_plan_type as 'basic' | 'boost' | null | undefined;
  
  return {
    hasPrime: hasActivePrime,
    hasPrimeBasic: hasActivePrime && primeType === 'basic',
    // If no plan type set but has active prime, treat as boost (null, undefined, or 'boost')
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
      
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('purchase_prime_boost', {
        p_user_id: user.id,
        p_plan_id: planId,
        p_amount_paid: amountPaid
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; subscription_id?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        }
        throw new Error(result.error || 'Không thể mua Prime Boost');
      }

      return result;
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
      const { data, error } = await supabase
        .from('name_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as NameColor[];
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
      
      const { data, error } = await supabase
        .from('user_name_colors')
        .select('*, name_colors(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
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
      
      // Get color details for name
      const { data: color, error: colorError } = await supabase
        .from('name_colors')
        .select('name, price')
        .eq('id', colorId)
        .single();
      
      if (colorError) throw colorError;
      
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'name_color',
        p_item_id: colorId,
        p_item_name: color.name,
        p_price: color.price,
        p_recipient_user_id: null
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        } else if (result.error === 'Already owns this item') {
          throw new Error('Bạn đã sở hữu màu tên này');
        }
        throw new Error(result.error || 'Không thể mua màu tên');
      }

      return result;
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
      await supabase
        .from('user_name_colors')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (colorId) {
        // Activate selected color
        await supabase
          .from('user_name_colors')
          .update({ is_active: true })
          .eq('user_id', user.id)
          .eq('color_id', colorId);
      }
      
      // Update profile
      await supabase
        .from('profiles')
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
      const { data, error } = await supabase
        .from('prime_effects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as PrimeEffect[];
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
      
      const { data, error } = await supabase
        .from('user_prime_effects')
        .select('*, prime_effects(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
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
      
      // Get effect details for name
      const { data: effect, error: effectError } = await supabase
        .from('prime_effects')
        .select('name, price')
        .eq('id', effectId)
        .single();
      
      if (effectError) throw effectError;
      
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('purchase_shop_item', {
        p_user_id: user.id,
        p_item_type: 'prime_effect',
        p_item_id: effectId,
        p_item_name: effect.name,
        p_price: effect.price,
        p_recipient_user_id: null
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          throw new Error('Số dư không đủ');
        } else if (result.error === 'Already owns this item') {
          throw new Error('Bạn đã sở hữu hiệu ứng này');
        }
        throw new Error(result.error || 'Không thể mua hiệu ứng');
      }

      return result;
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
      const { error: deactivateError } = await supabase
        .from('user_prime_effects')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (deactivateError) throw deactivateError;
      
      if (effectId) {
        // Activate selected effect
        const { error: activateError } = await supabase
          .from('user_prime_effects')
          .update({ is_active: true })
          .eq('user_id', user.id)
          .eq('effect_id', effectId);
        
        if (activateError) throw activateError;
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_effect_id: effectId })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
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
      const { data, error } = await supabase
        .from('prime_boost_benefits')
        .select('*')
        .eq('is_enabled', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as PrimeBoostBenefit[];
    }
  });
};
