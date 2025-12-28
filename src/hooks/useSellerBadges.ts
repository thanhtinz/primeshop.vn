import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SellerBadge {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  description: string | null;
  icon: string | null;
  badge_color: string;
  requirements: Record<string, unknown>;
  benefits: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

export interface SellerEarnedBadge {
  id: string;
  seller_id: string;
  badge_id: string;
  earned_at: string;
  badge?: SellerBadge;
}

export interface SellerLevel {
  id: string;
  level: number;
  name: string;
  name_en: string | null;
  min_sales: number;
  min_revenue: number;
  min_trust_score: number;
  commission_rate: number;
  benefits: Record<string, unknown>;
  icon: string | null;
  color: string;
}

export const useSellerBadges = () => {
  return useQuery({
    queryKey: ['seller-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as SellerBadge[];
    },
  });
};

export const useSellerEarnedBadges = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-earned-badges', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('seller_earned_badges')
        .select(`
          *,
          badge:seller_badges(*)
        `)
        .eq('seller_id', sellerId);

      if (error) throw error;
      return data as SellerEarnedBadge[];
    },
    enabled: !!sellerId,
  });
};

export const useSellerLevels = () => {
  return useQuery({
    queryKey: ['seller-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_levels')
        .select('*')
        .order('level');

      if (error) throw error;
      return data as SellerLevel[];
    },
  });
};

export const useCurrentSellerLevel = (sellerId?: string) => {
  return useQuery({
    queryKey: ['current-seller-level', sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('seller_level_id')
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;

      if (!seller.seller_level_id) {
        // Return level 1 as default
        const { data: defaultLevel } = await supabase
          .from('seller_levels')
          .select('*')
          .eq('level', 1)
          .single();
        return defaultLevel as SellerLevel | null;
      }

      const { data, error } = await supabase
        .from('seller_levels')
        .select('*')
        .eq('id', seller.seller_level_id)
        .single();

      if (error) throw error;
      return data as SellerLevel;
    },
    enabled: !!sellerId,
  });
};
