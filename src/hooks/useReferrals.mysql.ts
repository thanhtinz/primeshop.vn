// Hooks for Referrals - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';

export interface DbReferralCode {
  id: string;
  email: string;
  code: string;
  totalReferrals: number;
  totalCredits: number;
  availableCredits: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  total_referrals?: number;
  total_credits?: number;
  available_credits?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbReferralTransaction {
  id: string;
  referralCodeId: string;
  orderId: string;
  creditAmount: number;
  status: 'pending' | 'credited' | 'reversed';
  createdAt: string;
  // Legacy mappings
  referral_code_id?: string;
  order_id?: string;
  credit_amount?: number;
  created_at?: string;
}

export interface DbRewardRequest {
  id: string;
  referralCodeId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  voucherId: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  referral_code_id?: string;
  voucher_id?: string | null;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapCodeToLegacy = (r: any): DbReferralCode => ({
  ...r,
  total_referrals: r.totalReferrals,
  total_credits: r.totalCredits,
  available_credits: r.availableCredits,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

const mapTransactionToLegacy = (t: any): DbReferralTransaction => ({
  ...t,
  referral_code_id: t.referralCodeId,
  order_id: t.orderId,
  credit_amount: t.creditAmount,
  created_at: t.createdAt,
});

export const useReferralCodes = () => {
  return useQuery({
    queryKey: ['referral-codes'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('referral_codes')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapCodeToLegacy) as DbReferralCode[];
    },
  });
};

export const useReferralCodeByEmail = (email: string) => {
  return useQuery({
    queryKey: ['referral-code', email],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('referral_codes')
        .select('*')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapCodeToLegacy(data) : null;
    },
    enabled: !!email,
  });
};

export const useValidateReferralCode = () => {
  return useMutation({
    mutationFn: async ({ code, customerEmail }: { code: string; customerEmail: string }) => {
      const { data, error } = await db
        .from<any>('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      
      if (error || !data) throw new Error('Mã giới thiệu không tồn tại');
      
      // Prevent self-referral
      if (data.email.toLowerCase() === customerEmail.toLowerCase()) {
        throw new Error('Không thể sử dụng mã giới thiệu của chính bạn');
      }
      
      return mapCodeToLegacy(data);
    },
  });
};

export const useCreateOrGetReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      // Check if exists
      const { data: existing } = await db
        .from<any>('referral_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existing) return mapCodeToLegacy(existing);
      
      // Generate new code
      const code = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data, error } = await db
        .from<any>('referral_codes')
        .insert({ 
          email: email.toLowerCase(), 
          code,
          totalReferrals: 0,
          totalCredits: 0,
          availableCredits: 0,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapCodeToLegacy(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral-codes'] }),
  });
};

export const useReferralTransactions = (referralCodeId?: string) => {
  return useQuery({
    queryKey: ['referral-transactions', referralCodeId],
    queryFn: async () => {
      let query = db
        .from<any>('referral_transactions')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (referralCodeId) {
        query = query.eq('referralCodeId', referralCodeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        ...mapTransactionToLegacy(t),
      }));
    },
  });
};

export const useRewardRequests = () => {
  return useQuery({
    queryKey: ['reward-requests'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('reward_requests')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      
      // Get referral codes
      const codeIds = [...new Set(data?.map((r: any) => r.referralCodeId).filter(Boolean) || [])];
      const { data: codes } = codeIds.length > 0 ? await db
        .from<any>('referral_codes')
        .select('*')
        .in('id', codeIds) : { data: [] };
      
      const codeMap = new Map(codes?.map((c: any) => [c.id, mapCodeToLegacy(c)]) || []);
      
      return (data || []).map((r: any) => ({
        ...r,
        referral_code_id: r.referralCodeId,
        voucher_id: r.voucherId,
        admin_notes: r.adminNotes,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
        referral_code: codeMap.get(r.referralCodeId),
      }));
    },
  });
};

export const useCreateRewardRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ referralCodeId, amount }: { referralCodeId: string; amount: number }) => {
      const { data, error } = await db
        .from<any>('reward_requests')
        .insert({
          referralCodeId,
          amount,
          status: 'pending',
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-requests'] });
    },
  });
};

export const useUpdateRewardRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, adminNotes, voucherId }: {
      id: string;
      status: 'approved' | 'rejected';
      adminNotes?: string;
      voucherId?: string;
    }) => {
      const updateData: any = { status };
      if (adminNotes) updateData.adminNotes = adminNotes;
      if (voucherId) updateData.voucherId = voucherId;
      
      const { data, error } = await db
        .from<any>('reward_requests')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-requests'] });
    },
  });
};
