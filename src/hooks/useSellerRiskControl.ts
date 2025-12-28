import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SellerRiskSettings {
  id: string;
  seller_id: string;
  block_new_buyers: boolean;
  new_buyer_threshold_days: number;
  block_disputed_buyers: boolean;
  max_disputes_allowed: number;
  max_concurrent_orders: number;
  delay_delivery_for_risky: boolean;
  delay_minutes: number;
  require_phone_verified: boolean;
  require_email_verified: boolean;
  min_buyer_completed_orders: number;
  blacklisted_countries: string[];
  created_at: string;
  updated_at: string;
}

export interface BuyerRiskScore {
  id: string;
  buyer_id: string;
  risk_score: number;
  total_orders: number;
  completed_orders: number;
  disputed_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  account_age_days: number;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  is_high_risk: boolean;
  risk_factors: string[];
  last_updated: string;
}

// Get seller risk settings
export const useSellerRiskSettings = (sellerId: string) => {
  return useQuery({
    queryKey: ['seller-risk-settings', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_risk_settings')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SellerRiskSettings | null;
    },
    enabled: !!sellerId
  });
};

// Create or update risk settings
export const useUpsertRiskSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Omit<SellerRiskSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('seller_risk_settings')
        .upsert({
          ...settings,
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
      queryClient.invalidateQueries({ queryKey: ['seller-risk-settings', variables.seller_id] });
      toast.success('Đã lưu cài đặt rủi ro');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Get buyer risk score
export const useBuyerRiskScore = (buyerId: string) => {
  return useQuery({
    queryKey: ['buyer-risk-score', buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_risk_scores')
        .select('*')
        .eq('buyer_id', buyerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BuyerRiskScore | null;
    },
    enabled: !!buyerId
  });
};

// Check if buyer can purchase from seller
export const useCanBuyerPurchase = (sellerId: string, buyerId?: string) => {
  return useQuery({
    queryKey: ['can-buyer-purchase', sellerId, buyerId],
    queryFn: async () => {
      if (!buyerId) return { canPurchase: true, reason: null };

      // Get seller risk settings
      const { data: settings, error: settingsError } = await supabase
        .from('seller_risk_settings')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // If no settings, allow purchase
      if (!settings) return { canPurchase: true, reason: null };

      // Get buyer risk score
      const { data: riskScore, error: riskError } = await supabase
        .from('buyer_risk_scores')
        .select('*')
        .eq('buyer_id', buyerId)
        .single();

      if (riskError && riskError.code !== 'PGRST116') throw riskError;

      // Get buyer profile for account age
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, phone')
        .eq('user_id', buyerId)
        .single();

      const accountAgeDays = profile 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Check conditions
      const reasons: string[] = [];

      if (settings.block_new_buyers && accountAgeDays < settings.new_buyer_threshold_days) {
        reasons.push(`Tài khoản phải tạo trước ${settings.new_buyer_threshold_days} ngày`);
      }

      if (settings.block_disputed_buyers && (riskScore?.disputed_orders || 0) >= settings.max_disputes_allowed) {
        reasons.push(`Bạn đã có quá nhiều tranh chấp`);
      }

      if (settings.require_phone_verified && !profile?.phone) {
        reasons.push(`Yêu cầu xác minh số điện thoại`);
      }

      if (settings.min_buyer_completed_orders > 0 && (riskScore?.completed_orders || 0) < settings.min_buyer_completed_orders) {
        reasons.push(`Cần hoàn thành ít nhất ${settings.min_buyer_completed_orders} đơn hàng trước`);
      }

      // Check concurrent orders
      if (settings.max_concurrent_orders > 0) {
        const { count } = await supabase
          .from('seller_orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('buyer_id', buyerId)
          .in('status', ['pending', 'processing']);

        if ((count || 0) >= settings.max_concurrent_orders) {
          reasons.push(`Bạn đang có ${count} đơn đang xử lý với shop này`);
        }
      }

      return {
        canPurchase: reasons.length === 0,
        reason: reasons.length > 0 ? reasons.join('. ') : null,
        shouldDelay: settings.delay_delivery_for_risky && (riskScore?.is_high_risk || false),
        delayMinutes: settings.delay_minutes
      };
    },
    enabled: !!sellerId
  });
};

// Calculate and update buyer risk score
export const useUpdateBuyerRiskScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buyerId: string) => {
      // Get buyer's order history
      const { data: orders, error: ordersError } = await supabase
        .from('seller_orders')
        .select('status')
        .eq('buyer_id', buyerId);

      if (ordersError) throw ordersError;

      const stats = {
        total_orders: orders?.length || 0,
        completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
        disputed_orders: orders?.filter(o => o.status === 'disputed').length || 0,
        cancelled_orders: orders?.filter(o => o.status === 'cancelled').length || 0,
        refunded_orders: orders?.filter(o => o.status === 'refunded').length || 0
      };

      // Get profile for account age
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, phone')
        .eq('user_id', buyerId)
        .single();

      const accountAgeDays = profile 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate risk score (0-100, higher = riskier)
      let riskScore = 0;
      const riskFactors: string[] = [];

      // New account risk
      if (accountAgeDays < 7) {
        riskScore += 30;
        riskFactors.push('Tài khoản mới');
      } else if (accountAgeDays < 30) {
        riskScore += 15;
        riskFactors.push('Tài khoản < 30 ngày');
      }

      // Dispute rate
      if (stats.total_orders > 0) {
        const disputeRate = (stats.disputed_orders / stats.total_orders) * 100;
        if (disputeRate > 20) {
          riskScore += 40;
          riskFactors.push('Tỉ lệ tranh chấp cao');
        } else if (disputeRate > 10) {
          riskScore += 20;
          riskFactors.push('Có lịch sử tranh chấp');
        }

        const cancelRate = (stats.cancelled_orders / stats.total_orders) * 100;
        if (cancelRate > 30) {
          riskScore += 15;
          riskFactors.push('Hay hủy đơn');
        }
      }

      // No phone
      if (!profile?.phone) {
        riskScore += 10;
        riskFactors.push('Chưa xác minh SĐT');
      }

      // Cap at 100
      riskScore = Math.min(100, riskScore);

      const { data, error } = await supabase
        .from('buyer_risk_scores')
        .upsert({
          buyer_id: buyerId,
          risk_score: riskScore,
          ...stats,
          account_age_days: accountAgeDays,
          is_phone_verified: !!profile?.phone,
          is_email_verified: true,
          is_high_risk: riskScore >= 50,
          risk_factors: riskFactors,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'buyer_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, buyerId) => {
      queryClient.invalidateQueries({ queryKey: ['buyer-risk-score', buyerId] });
    }
  });
};
