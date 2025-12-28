import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopBranding {
  id: string;
  seller_id: string;
  theme_preset: string;
  primary_color: string;
  secondary_color: string;
  background_color: string | null;
  text_color: string | null;
  font_family: string;
  banner_type: string;
  banner_url: string | null;
  banner_video_url: string | null;
  layout_style: string;
  show_seller_avatar: boolean;
  show_stats: boolean;
  show_badges: boolean;
  custom_css: string | null;
  qr_code_url: string | null;
  subdomain: string | null;
  created_at: string;
  updated_at: string;
}

export const themePresets = {
  default: {
    name: 'Mặc định',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    background_color: null,
    text_color: null
  },
  dark: {
    name: 'Tối',
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    background_color: '#1F2937',
    text_color: '#F9FAFB'
  },
  gaming: {
    name: 'Gaming',
    primary_color: '#EF4444',
    secondary_color: '#F59E0B',
    background_color: '#0F172A',
    text_color: '#E2E8F0'
  },
  minimal: {
    name: 'Tối giản',
    primary_color: '#1F2937',
    secondary_color: '#6B7280',
    background_color: '#FFFFFF',
    text_color: '#111827'
  },
  nature: {
    name: 'Thiên nhiên',
    primary_color: '#059669',
    secondary_color: '#84CC16',
    background_color: '#ECFDF5',
    text_color: '#064E3B'
  },
  ocean: {
    name: 'Đại dương',
    primary_color: '#0891B2',
    secondary_color: '#06B6D4',
    background_color: '#ECFEFF',
    text_color: '#164E63'
  }
};

// Get shop branding
export const useShopBranding = (sellerId: string) => {
  return useQuery({
    queryKey: ['shop-branding', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_branding')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ShopBranding | null;
    },
    enabled: !!sellerId
  });
};

// Create or update shop branding
export const useUpsertShopBranding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: Omit<ShopBranding, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('shop_branding')
        .upsert({
          ...branding,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'seller_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shop-branding', variables.seller_id] });
      toast.success('Đã lưu cài đặt giao diện');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Generate QR code for shop
export const useGenerateShopQR = () => {
  return useMutation({
    mutationFn: async ({ sellerId, shopSlug }: { sellerId: string; shopSlug: string }) => {
      const shopUrl = `${window.location.origin}/shops/${shopSlug}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}`;
      
      return {
        qrUrl: qrApiUrl,
        shopUrl
      };
    }
  });
};

// Check subdomain availability
export const useCheckSubdomain = () => {
  return useMutation({
    mutationFn: async (subdomain: string) => {
      const { data, error } = await supabase
        .from('shop_branding')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found = available
        return { available: true };
      }
      
      if (error) throw error;
      return { available: false };
    }
  });
};

// Apply theme preset
export const applyThemePreset = (preset: keyof typeof themePresets): Partial<ShopBranding> => {
  return {
    theme_preset: preset,
    ...themePresets[preset]
  };
};
