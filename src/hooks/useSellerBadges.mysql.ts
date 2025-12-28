// Hooks for Seller Badges - MySQL version
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface SellerBadge {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  icon: string | null;
  badgeColor: string;
  requirements: Record<string, unknown>;
  benefits: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  // Legacy mappings
  name_en?: string | null;
  badge_color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SellerEarnedBadge {
  id: string;
  sellerId: string;
  badgeId: string;
  earnedAt: string;
  badge?: SellerBadge;
  // Legacy mappings
  seller_id?: string;
  badge_id?: string;
  earned_at?: string;
}

export interface SellerLevel {
  id: string;
  level: number;
  name: string;
  nameEn: string | null;
  minSales: number;
  minRevenue: number;
  minTrustScore: number;
  commissionRate: number;
  benefits: Record<string, unknown>;
  icon: string | null;
  color: string;
  // Legacy mappings
  name_en?: string | null;
  min_sales?: number;
  min_revenue?: number;
  min_trust_score?: number;
  commission_rate?: number;
}

const mapBadgeToLegacy = (b: any): SellerBadge => ({
  ...b,
  name_en: b.nameEn,
  badge_color: b.badgeColor,
  sort_order: b.sortOrder,
  is_active: b.isActive,
});

const mapEarnedBadgeToLegacy = (eb: any): SellerEarnedBadge => ({
  ...eb,
  seller_id: eb.sellerId,
  badge_id: eb.badgeId,
  earned_at: eb.earnedAt,
  badge: eb.badge ? mapBadgeToLegacy(eb.badge) : undefined,
});

const mapLevelToLegacy = (l: any): SellerLevel => ({
  ...l,
  name_en: l.nameEn,
  min_sales: l.minSales,
  min_revenue: l.minRevenue,
  min_trust_score: l.minTrustScore,
  commission_rate: l.commissionRate,
});

export const useSellerBadges = () => {
  return useQuery({
    queryKey: ['seller-badges'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('seller_badges')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder');

      if (error) throw error;
      return (data || []).map(mapBadgeToLegacy) as SellerBadge[];
    },
  });
};

export const useSellerEarnedBadges = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-earned-badges', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('seller_earned_badges')
        .select('*, badge:seller_badges(*)')
        .eq('sellerId', sellerId);

      if (error) throw error;
      return (data || []).map(mapEarnedBadgeToLegacy) as SellerEarnedBadge[];
    },
    enabled: !!sellerId,
  });
};

export const useSellerLevels = () => {
  return useQuery({
    queryKey: ['seller-levels'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('seller_levels')
        .select('*')
        .order('level');

      if (error) throw error;
      return (data || []).map(mapLevelToLegacy) as SellerLevel[];
    },
  });
};

export const useCurrentSellerLevel = (sellerId?: string) => {
  return useQuery({
    queryKey: ['current-seller-level', sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      const { data: seller, error: sellerError } = await db
        .from<any>('sellers')
        .select('sellerLevelId')
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;

      if (!seller.sellerLevelId) {
        // Return level 1 as default
        const { data: defaultLevel } = await db
          .from<any>('seller_levels')
          .select('*')
          .eq('level', 1)
          .single();

        return defaultLevel ? mapLevelToLegacy(defaultLevel) : null;
      }

      const { data, error } = await db
        .from<any>('seller_levels')
        .select('*')
        .eq('id', seller.sellerLevelId)
        .single();

      if (error) throw error;
      return mapLevelToLegacy(data) as SellerLevel;
    },
    enabled: !!sellerId,
  });
};
