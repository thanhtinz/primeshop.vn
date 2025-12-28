import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShopPolicy {
  id: string;
  seller_id: string;
  title: string;
  content: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyAcceptance {
  id: string;
  policy_id: string;
  buyer_id: string;
  order_id: string | null;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  policy_version_hash: string | null;
}

// Get shop policies for a seller
export const useShopPolicies = (sellerId: string) => {
  return useQuery({
    queryKey: ['shop-policies', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_policies')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ShopPolicy[];
    },
    enabled: !!sellerId
  });
};

// Get all policies for seller management
export const useMyShopPolicies = (sellerId: string) => {
  return useQuery({
    queryKey: ['my-shop-policies', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_policies')
        .select('*')
        .eq('seller_id', sellerId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ShopPolicy[];
    },
    enabled: !!sellerId
  });
};

// Create policy
export const useCreatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: Omit<ShopPolicy, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('shop_policies')
        .insert(policy)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã tạo điều khoản mới');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Update policy
export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopPolicy> & { id: string }) => {
      const { data, error } = await supabase
        .from('shop_policies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã cập nhật điều khoản');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Delete policy
export const useDeletePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policyId: string) => {
      const { error } = await supabase
        .from('shop_policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã xóa điều khoản');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
};

// Accept policy
export const useAcceptPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      policyId, 
      orderId 
    }: { 
      policyId: string; 
      orderId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Chưa đăng nhập');

      // Get policy content for hash
      const { data: policy } = await supabase
        .from('shop_policies')
        .select('content')
        .eq('id', policyId)
        .single();

      // Create a simple hash of the policy content
      const encoder = new TextEncoder();
      const data = encoder.encode(policy?.content || '');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('policy_acceptances')
        .insert({
          policy_id: policyId,
          buyer_id: user.id,
          order_id: orderId || null,
          user_agent: navigator.userAgent,
          policy_version_hash: hashHex
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-acceptances'] });
    }
  });
};

// Check if user accepted all required policies
export const useCheckPolicyAcceptance = (sellerId: string, buyerId?: string) => {
  return useQuery({
    queryKey: ['policy-acceptance-check', sellerId, buyerId],
    queryFn: async () => {
      if (!buyerId) return { allAccepted: false, pendingPolicies: [] };

      // Get required policies
      const { data: policies, error: policiesError } = await supabase
        .from('shop_policies')
        .select('id, title, content')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .eq('is_required', true);

      if (policiesError) throw policiesError;

      if (!policies || policies.length === 0) {
        return { allAccepted: true, pendingPolicies: [] };
      }

      // Get user's acceptances
      const { data: acceptances, error: acceptancesError } = await supabase
        .from('policy_acceptances')
        .select('policy_id')
        .eq('buyer_id', buyerId)
        .in('policy_id', policies.map(p => p.id));

      if (acceptancesError) throw acceptancesError;

      const acceptedIds = new Set(acceptances?.map(a => a.policy_id) || []);
      const pendingPolicies = policies.filter(p => !acceptedIds.has(p.id));

      return {
        allAccepted: pendingPolicies.length === 0,
        pendingPolicies
      };
    },
    enabled: !!sellerId
  });
};

// Get policy acceptance logs for seller
export const usePolicyAcceptanceLogs = (sellerId: string) => {
  return useQuery({
    queryKey: ['policy-acceptance-logs', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policy_acceptances')
        .select(`
          *,
          policy:shop_policies!inner(id, title, seller_id)
        `)
        .eq('policy.seller_id', sellerId)
        .order('accepted_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!sellerId
  });
};
