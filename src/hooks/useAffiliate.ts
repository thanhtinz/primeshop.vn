import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  visitor_ip?: string;
  landing_page?: string;
  clicked_at: string;
}

export interface AffiliateConversion {
  id: string;
  affiliate_id: string;
  order_id?: string;
  customer_id?: string;
  order_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_at?: string;
  paid_at?: string;
  created_at: string;
}

export const tierConfig = {
  bronze: { name: 'Bronze', color: 'bg-amber-700', minEarnings: 0, rate: 5 },
  silver: { name: 'Silver', color: 'bg-gray-400', minEarnings: 1000000, rate: 7 },
  gold: { name: 'Gold', color: 'bg-yellow-500', minEarnings: 5000000, rate: 10 },
  platinum: { name: 'Platinum', color: 'bg-cyan-400', minEarnings: 20000000, rate: 12 },
  diamond: { name: 'Diamond', color: 'bg-purple-500', minEarnings: 50000000, rate: 15 }
};

export const useAffiliate = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['affiliate', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Affiliate | null;
    },
    enabled: !!user
  });
};

export const useRegisterAffiliate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Chưa đăng nhập');
      
      // Generate affiliate code
      const { data: code } = await supabase.rpc('generate_affiliate_code');
      
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: code || `AFF${Date.now().toString(36).toUpperCase()}`
        })
        .select()
        .single();

      if (error) throw error;
      return data as Affiliate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate'] });
      toast.success('Đăng ký Affiliate thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useAffiliateClicks = (dateRange?: { from: Date; to: Date }) => {
  const { data: affiliate } = useAffiliate();
  
  return useQuery({
    queryKey: ['affiliate-clicks', affiliate?.id, dateRange],
    queryFn: async () => {
      if (!affiliate) return [];
      
      let query = supabase
        .from('affiliate_clicks')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('clicked_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('clicked_at', dateRange.from.toISOString())
          .lte('clicked_at', dateRange.to.toISOString());
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data as AffiliateClick[];
    },
    enabled: !!affiliate
  });
};

export const useAffiliateConversions = () => {
  const { data: affiliate } = useAffiliate();
  
  return useQuery({
    queryKey: ['affiliate-conversions', affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return [];
      
      const { data, error } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AffiliateConversion[];
    },
    enabled: !!affiliate
  });
};

export const useAffiliateStats = () => {
  const { data: affiliate, isLoading: affiliateLoading } = useAffiliate();
  const { data: clicks = [], isLoading: clicksLoading } = useAffiliateClicks();
  const { data: conversions = [], isLoading: conversionsLoading } = useAffiliateConversions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayClicks = clicks.filter(c => new Date(c.clicked_at) >= today).length;
  const monthClicks = clicks.filter(c => new Date(c.clicked_at) >= thisMonth).length;
  
  const pendingConversions = conversions.filter(c => c.status === 'pending');
  const approvedConversions = conversions.filter(c => c.status === 'approved' || c.status === 'paid');
  
  const conversionRate = clicks.length > 0 
    ? ((conversions.length / clicks.length) * 100).toFixed(2) 
    : '0';

  return {
    affiliate,
    clicks,
    conversions,
    todayClicks,
    monthClicks,
    pendingConversions,
    approvedConversions,
    conversionRate,
    isLoading: affiliateLoading || clicksLoading || conversionsLoading
  };
};

// Track affiliate click (for public use)
export const trackAffiliateClick = async (affiliateCode: string, landingPage: string) => {
  try {
    await supabase.rpc('track_affiliate_click', {
      p_affiliate_code: affiliateCode,
      p_visitor_ip: null,
      p_user_agent: navigator.userAgent,
      p_landing_page: landingPage
    });
    
    // Store in session for conversion tracking
    sessionStorage.setItem('affiliate_code', affiliateCode);
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
};

// Get stored affiliate code
export const getStoredAffiliateCode = () => {
  return sessionStorage.getItem('affiliate_code');
};
