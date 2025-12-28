import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbReferralCode {
  id: string;
  email: string;
  code: string;
  total_referrals: number;
  total_credits: number;
  available_credits: number;
  created_at: string;
  updated_at: string;
}

export interface DbReferralTransaction {
  id: string;
  referral_code_id: string;
  order_id: string;
  credit_amount: number;
  status: 'pending' | 'credited' | 'reversed';
  created_at: string;
}

export interface DbRewardRequest {
  id: string;
  referral_code_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  voucher_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useReferralCodes = () => {
  return useQuery({
    queryKey: ['referral-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbReferralCode[];
    },
  });
};

export const useReferralCodeByEmail = (email: string) => {
  return useQuery({
    queryKey: ['referral-code', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data as DbReferralCode | null;
    },
    enabled: !!email,
  });
};

export const useValidateReferralCode = () => {
  return useMutation({
    mutationFn: async ({ code, customerEmail }: { code: string; customerEmail: string }) => {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Mã giới thiệu không tồn tại');
      
      // Prevent self-referral
      if (data.email.toLowerCase() === customerEmail.toLowerCase()) {
        throw new Error('Không thể sử dụng mã giới thiệu của chính bạn');
      }
      
      return data as DbReferralCode;
    },
  });
};

export const useCreateOrGetReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      // Check if exists
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (existing) return existing as DbReferralCode;
      
      // Generate new code
      const { data: codeResult } = await supabase.rpc('generate_referral_code');
      const code = codeResult || `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ email: email.toLowerCase(), code })
        .select()
        .single();
      
      if (error) throw error;
      return data as DbReferralCode;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral-codes'] }),
  });
};

export const useReferralTransactions = (referralCodeId?: string) => {
  return useQuery({
    queryKey: ['referral-transactions', referralCodeId],
    queryFn: async () => {
      let query = supabase
        .from('referral_transactions')
        .select('*, order:orders(*)')
        .order('created_at', { ascending: false });
      
      if (referralCodeId) {
        query = query.eq('referral_code_id', referralCodeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useRewardRequests = () => {
  return useQuery({
    queryKey: ['reward-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_requests')
        .select('*, referral_code:referral_codes(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateRewardRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ referralCodeId, amount }: { referralCodeId: string; amount: number }) => {
      const { data, error } = await supabase
        .from('reward_requests')
        .insert({ referral_code_id: referralCodeId, amount })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward-requests'] }),
  });
};

export const useUpdateRewardRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbRewardRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('reward_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reward-requests'] }),
  });
};
