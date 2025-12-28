// Hooks for Marketplace Settings - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

interface MarketplaceSetting {
  id: string;
  settingKey: string;
  settingValue: Record<string, unknown>;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  setting_key?: string;
  setting_value?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

const mapToLegacy = (s: any): MarketplaceSetting => ({
  ...s,
  setting_key: s.settingKey,
  setting_value: s.settingValue,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

export const useMarketplaceSettings = () => {
  return useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('marketplace_settings')
        .select('*');

      if (error) throw error;
      return (data || []).map(mapToLegacy) as MarketplaceSetting[];
    },
  });
};

export const useMarketplaceSetting = (key: string) => {
  return useQuery({
    queryKey: ['marketplace-settings', key],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('marketplace_settings')
        .select('*')
        .eq('settingKey', key)
        .single();

      if (error) throw error;
      return mapToLegacy(data) as MarketplaceSetting;
    },
  });
};

export const useWithdrawalFees = () => {
  return useQuery({
    queryKey: ['withdrawal-fees'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('marketplace_settings')
        .select('*')
        .in('settingKey', ['withdrawal_normal_fee', 'withdrawal_fast_fee', 'min_withdrawal_amount']);

      if (error) throw error;

      const settings = (data || []).map(mapToLegacy) as MarketplaceSetting[];
      const normalFee = settings.find(s => s.settingKey === 'withdrawal_normal_fee');
      const fastFee = settings.find(s => s.settingKey === 'withdrawal_fast_fee');
      const minAmount = settings.find(s => s.settingKey === 'min_withdrawal_amount');

      return {
        normalFeeRate: (normalFee?.settingValue as { rate?: number })?.rate ?? 0.01,
        fastFeeRate: (fastFee?.settingValue as { rate?: number })?.rate ?? 0.02,
        minWithdrawalAmount: (minAmount?.settingValue as { amount?: number })?.amount ?? 50000,
      };
    },
  });
};

export const useUpdateMarketplaceSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      // Check if setting exists
      const { data: existing } = await db
        .from<any>('marketplace_settings')
        .select('id')
        .eq('settingKey', key)
        .single();

      if (existing) {
        // Update
        const { data, error } = await db
          .from('marketplace_settings')
          .update({
            settingValue: value,
            updatedAt: new Date().toISOString(),
          })
          .eq('settingKey', key)
          .select()
          .single();

        if (error) throw error;
        return mapToLegacy(data);
      } else {
        // Insert
        const { data, error } = await db
          .from('marketplace_settings')
          .insert({
            settingKey: key,
            settingValue: value,
          })
          .select()
          .single();

        if (error) throw error;
        return mapToLegacy(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-settings'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-fees'] });
    },
  });
};
