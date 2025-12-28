import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useMarketplaceSettings = () => {
  return useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('*');
      
      if (error) throw error;
      return data as MarketplaceSetting[];
    },
  });
};

export const useMarketplaceSetting = (key: string) => {
  return useQuery({
    queryKey: ['marketplace-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('*')
        .eq('setting_key', key)
        .single();
      
      if (error) throw error;
      return data as MarketplaceSetting;
    },
  });
};

export const useWithdrawalFees = () => {
  return useQuery({
    queryKey: ['withdrawal-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('*')
        .in('setting_key', ['withdrawal_normal_fee', 'withdrawal_fast_fee', 'min_withdrawal_amount']);
      
      if (error) throw error;
      
      const settings = data as MarketplaceSetting[];
      const normalFee = settings.find(s => s.setting_key === 'withdrawal_normal_fee');
      const fastFee = settings.find(s => s.setting_key === 'withdrawal_fast_fee');
      const minAmount = settings.find(s => s.setting_key === 'min_withdrawal_amount');
      
      return {
        normalFeeRate: (normalFee?.setting_value as { rate?: number })?.rate ?? 0.01,
        fastFeeRate: (fastFee?.setting_value as { rate?: number })?.rate ?? 0.02,
        minWithdrawalAmount: (minAmount?.setting_value as { amount?: number })?.amount ?? 50000,
      };
    },
  });
};

export const useUpdateMarketplaceSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('marketplace_settings')
        .upsert({ 
          setting_key: key,
          setting_value: value as unknown as import('@/integrations/supabase/types').Json,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-settings'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-fees'] });
    },
  });
};
