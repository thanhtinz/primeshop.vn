// Hooks for Affiliate - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Affiliate {
  id: string;
  userId: string;
  affiliateCode: string;
  commissionRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  user_id?: string;
  affiliate_code?: string;
  commission_rate?: number;
  total_clicks?: number;
  total_conversions?: number;
  total_earnings?: number;
  pending_earnings?: number;
  paid_earnings?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  visitorIp?: string;
  landingPage?: string;
  clickedAt: string;
  // Legacy mappings
  affiliate_id?: string;
  visitor_ip?: string;
  landing_page?: string;
  clicked_at?: string;
}

export interface AffiliateConversion {
  id: string;
  affiliateId: string;
  orderId?: string;
  customerId?: string;
  orderAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  // Legacy mappings
  affiliate_id?: string;
  order_id?: string;
  customer_id?: string;
  order_amount?: number;
  commission_amount?: number;
  commission_rate?: number;
  approved_at?: string;
  paid_at?: string;
  created_at?: string;
}

export const tierConfig = {
  bronze: { name: 'Bronze', color: 'bg-amber-700', minEarnings: 0, rate: 5 },
  silver: { name: 'Silver', color: 'bg-gray-400', minEarnings: 1000000, rate: 7 },
  gold: { name: 'Gold', color: 'bg-yellow-500', minEarnings: 5000000, rate: 10 },
  platinum: { name: 'Platinum', color: 'bg-cyan-400', minEarnings: 20000000, rate: 12 },
  diamond: { name: 'Diamond', color: 'bg-purple-500', minEarnings: 50000000, rate: 15 }
};

const mapAffiliateToLegacy = (a: any): Affiliate => ({
  ...a,
  user_id: a.userId,
  affiliate_code: a.affiliateCode,
  commission_rate: a.commissionRate,
  total_clicks: a.totalClicks,
  total_conversions: a.totalConversions,
  total_earnings: a.totalEarnings,
  pending_earnings: a.pendingEarnings,
  paid_earnings: a.paidEarnings,
  created_at: a.createdAt,
  updated_at: a.updatedAt,
});

const mapClickToLegacy = (c: any): AffiliateClick => ({
  ...c,
  affiliate_id: c.affiliateId,
  visitor_ip: c.visitorIp,
  landing_page: c.landingPage,
  clicked_at: c.clickedAt,
});

const mapConversionToLegacy = (c: any): AffiliateConversion => ({
  ...c,
  affiliate_id: c.affiliateId,
  order_id: c.orderId,
  customer_id: c.customerId,
  order_amount: c.orderAmount,
  commission_amount: c.commissionAmount,
  commission_rate: c.commissionRate,
  approved_at: c.approvedAt,
  paid_at: c.paidAt,
  created_at: c.createdAt,
});

export const useAffiliate = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['affiliate', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await db
        .from<any>('affiliates')
        .select('*')
        .eq('userId', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapAffiliateToLegacy(data) : null;
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
      const code = `AFF${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await db
        .from<any>('affiliates')
        .insert({
          userId: user.id,
          affiliateCode: code,
          commissionRate: 5,
          tier: 'bronze',
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          status: 'active',
        })
        .select('*')
        .single();

      if (error) throw error;
      return mapAffiliateToLegacy(data);
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
      
      let query = db
        .from<any>('affiliate_clicks')
        .select('*')
        .eq('affiliateId', affiliate.id)
        .order('clickedAt', { ascending: false });

      if (dateRange) {
        query = query
          .gte('clickedAt', dateRange.from.toISOString())
          .lte('clickedAt', dateRange.to.toISOString());
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data || []).map(mapClickToLegacy);
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
      
      const { data, error } = await db
        .from<any>('affiliate_conversions')
        .select('*')
        .eq('affiliateId', affiliate.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapConversionToLegacy);
    },
    enabled: !!affiliate
  });
};

export const useAffiliateStats = () => {
  const { data: affiliate } = useAffiliate();
  
  return useQuery({
    queryKey: ['affiliate-stats', affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return null;
      
      // Get today's stats
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayClicks } = await db
        .from<any>('affiliate_clicks')
        .select('id')
        .eq('affiliateId', affiliate.id)
        .gte('clickedAt', today);
      
      const { data: todayConversions } = await db
        .from<any>('affiliate_conversions')
        .select('id, commissionAmount')
        .eq('affiliateId', affiliate.id)
        .gte('createdAt', today);
      
      const todayEarnings = todayConversions?.reduce((sum, c) => sum + (c.commissionAmount || 0), 0) || 0;
      
      // Get this month's stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const { data: monthClicks } = await db
        .from<any>('affiliate_clicks')
        .select('id')
        .eq('affiliateId', affiliate.id)
        .gte('clickedAt', monthStart.toISOString());
      
      const { data: monthConversions } = await db
        .from<any>('affiliate_conversions')
        .select('id, commissionAmount')
        .eq('affiliateId', affiliate.id)
        .gte('createdAt', monthStart.toISOString());
      
      const monthEarnings = monthConversions?.reduce((sum, c) => sum + (c.commissionAmount || 0), 0) || 0;
      
      return {
        today: {
          clicks: todayClicks?.length || 0,
          conversions: todayConversions?.length || 0,
          earnings: todayEarnings,
        },
        thisMonth: {
          clicks: monthClicks?.length || 0,
          conversions: monthConversions?.length || 0,
          earnings: monthEarnings,
        },
        total: {
          clicks: affiliate.totalClicks || affiliate.total_clicks || 0,
          conversions: affiliate.totalConversions || affiliate.total_conversions || 0,
          earnings: affiliate.totalEarnings || affiliate.total_earnings || 0,
          pending: affiliate.pendingEarnings || affiliate.pending_earnings || 0,
          paid: affiliate.paidEarnings || affiliate.paid_earnings || 0,
        },
        conversionRate: affiliate.totalClicks > 0 
          ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(2)
          : '0.00',
      };
    },
    enabled: !!affiliate
  });
};

export const useTrackClick = () => {
  return useMutation({
    mutationFn: async ({ affiliateCode, landingPage }: { affiliateCode: string; landingPage?: string }) => {
      // Find affiliate by code
      const { data: affiliate } = await db
        .from<any>('affiliates')
        .select('id')
        .eq('affiliateCode', affiliateCode)
        .eq('status', 'active')
        .single();
      
      if (!affiliate) throw new Error('Invalid affiliate code');
      
      // Record click
      const { error } = await db
        .from<any>('affiliate_clicks')
        .insert({
          affiliateId: affiliate.id,
          landingPage,
          clickedAt: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Update total clicks
      await db
        .from<any>('affiliates')
        .update({ totalClicks: (affiliate.totalClicks || 0) + 1 })
        .eq('id', affiliate.id);
    },
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  const { data: affiliate } = useAffiliate();

  return useMutation({
    mutationFn: async ({ amount, bankInfo }: { 
      amount: number;
      bankInfo: {
        bankName: string;
        bankAccount: string;
        bankHolder: string;
      };
    }) => {
      if (!affiliate) throw new Error('Không phải affiliate');
      
      if (amount > (affiliate.pendingEarnings || affiliate.pending_earnings || 0)) {
        throw new Error('Số tiền vượt quá số dư khả dụng');
      }
      
      const { data, error } = await db
        .from<any>('affiliate_payouts')
        .insert({
          affiliateId: affiliate.id,
          amount,
          bankName: bankInfo.bankName,
          bankAccount: bankInfo.bankAccount,
          bankHolder: bankInfo.bankHolder,
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts'] });
      toast.success('Đã gửi yêu cầu rút tiền');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useAffiliatePayouts = () => {
  const { data: affiliate } = useAffiliate();
  
  return useQuery({
    queryKey: ['affiliate-payouts', affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return [];
      
      const { data, error } = await db
        .from<any>('affiliate_payouts')
        .select('*')
        .eq('affiliateId', affiliate.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        ...p,
        affiliate_id: p.affiliateId,
        bank_name: p.bankName,
        bank_account: p.bankAccount,
        bank_holder: p.bankHolder,
        processed_at: p.processedAt,
        processed_by: p.processedBy,
        admin_notes: p.adminNotes,
        created_at: p.createdAt,
      }));
    },
    enabled: !!affiliate
  });
};

// Admin hooks
export const useAllAffiliates = () => {
  return useQuery({
    queryKey: ['all-affiliates'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('affiliates')
        .select('*')
        .order('totalEarnings', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAffiliateToLegacy);
    }
  });
};

export const useUpdateAffiliateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Affiliate['status'] }) => {
      const { data, error } = await db
        .from<any>('affiliates')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return mapAffiliateToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-affiliates'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
