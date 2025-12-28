// Hooks for Site Settings - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface DbSiteSetting {
  id: string;
  key: string;
  value: any;
  group: string | null;
  updatedAt: string;
  // Legacy
  updated_at?: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await db.from<DbSiteSetting>('site_settings').select('*');
      if (error) throw error;
      
      // Convert to key-value object
      const settings: Record<string, any> = {};
      (data || []).forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    },
  });
};

export const useSiteSetting = (key: string) => {
  return useQuery({
    queryKey: ['site-setting', key],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbSiteSetting>('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? null;
    },
  });
};

export const useSiteSettingsByGroup = (group: string) => {
  return useQuery({
    queryKey: ['site-settings', 'group', group],
    queryFn: async () => {
      const { data, error } = await db
        .from<DbSiteSetting>('site_settings')
        .select('*')
        .eq('group', group);
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      (data || []).forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    },
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, group }: { key: string; value: any; group?: string }) => {
      // Check if setting exists
      const { data: existing } = await db
        .from<DbSiteSetting>('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await db
          .from<DbSiteSetting>('site_settings')
          .update({ value })
          .eq('key', key)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await db
          .from<DbSiteSetting>('site_settings')
          .insert({ key, value, group })
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
    },
  });
};

export const useUpdateMultipleSiteSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      
      for (const { key, value } of updates) {
        const { data: existing } = await db
          .from<DbSiteSetting>('site_settings')
          .select('id')
          .eq('key', key)
          .maybeSingle();

        if (existing) {
          await db
            .from<DbSiteSetting>('site_settings')
            .update({ value })
            .eq('key', key);
        } else {
          await db
            .from<DbSiteSetting>('site_settings')
            .insert({ key, value });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
    },
  });
};

export const useDeleteSiteSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await db.from('site_settings').delete().eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
    },
  });
};
