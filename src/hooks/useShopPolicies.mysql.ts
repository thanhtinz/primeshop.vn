// Hooks for Shop Policies - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

export interface ShopPolicy {
  id: string;
  sellerId: string;
  title: string;
  content: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  seller_id?: string;
  is_required?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PolicyAcceptance {
  id: string;
  policyId: string;
  buyerId: string;
  orderId: string | null;
  acceptedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  policyVersionHash: string | null;
  // Legacy mappings
  policy_id?: string;
  buyer_id?: string;
  order_id?: string | null;
  accepted_at?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  policy_version_hash?: string | null;
}

const mapPolicyToLegacy = (p: any): ShopPolicy => ({
  ...p,
  seller_id: p.sellerId,
  is_required: p.isRequired,
  is_active: p.isActive,
  sort_order: p.sortOrder,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

// Get shop policies for a seller
export const useShopPolicies = (sellerId: string) => {
  return useQuery({
    queryKey: ['shop-policies', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('shop_policies')
        .select('*')
        .eq('sellerId', sellerId)
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapPolicyToLegacy) as ShopPolicy[];
    },
    enabled: !!sellerId,
  });
};

// Get all policies for seller management
export const useMyShopPolicies = (sellerId: string) => {
  return useQuery({
    queryKey: ['my-shop-policies', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('shop_policies')
        .select('*')
        .eq('sellerId', sellerId)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapPolicyToLegacy) as ShopPolicy[];
    },
    enabled: !!sellerId,
  });
};

// Create policy
export const useCreatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: any) => {
      const { data, error } = await db
        .from('shop_policies')
        .insert({
          sellerId: policy.seller_id,
          title: policy.title,
          content: policy.content,
          isRequired: policy.is_required ?? false,
          isActive: policy.is_active ?? true,
          sortOrder: policy.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return mapPolicyToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã tạo điều khoản mới');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Update policy
export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const mappedUpdates: any = { updatedAt: new Date().toISOString() };
      if (updates.title) mappedUpdates.title = updates.title;
      if (updates.content) mappedUpdates.content = updates.content;
      if (updates.is_required !== undefined) mappedUpdates.isRequired = updates.is_required;
      if (updates.is_active !== undefined) mappedUpdates.isActive = updates.is_active;
      if (updates.sort_order !== undefined) mappedUpdates.sortOrder = updates.sort_order;

      const { data, error } = await db
        .from('shop_policies')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPolicyToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã cập nhật điều khoản');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Delete policy
export const useDeletePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('shop_policies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-policies'] });
      queryClient.invalidateQueries({ queryKey: ['shop-policies'] });
      toast.success('Đã xóa điều khoản');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Accept policy
export const useAcceptPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      policyId,
      buyerId,
      orderId,
    }: {
      policyId: string;
      buyerId: string;
      orderId?: string;
    }) => {
      const { data, error } = await db
        .from('policy_acceptances')
        .insert({
          policyId,
          buyerId,
          orderId: orderId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-acceptances'] });
    },
  });
};

// Check if user accepted required policies
export const useCheckPolicyAcceptance = (sellerId: string, buyerId: string) => {
  return useQuery({
    queryKey: ['policy-acceptance-check', sellerId, buyerId],
    queryFn: async () => {
      // Get required policies
      const { data: policies } = await db
        .from<any>('shop_policies')
        .select('id')
        .eq('sellerId', sellerId)
        .eq('isActive', true)
        .eq('isRequired', true);

      if (!policies?.length) return { allAccepted: true, missingPolicies: [] };

      // Check acceptances
      const { data: acceptances } = await db
        .from<any>('policy_acceptances')
        .select('policyId')
        .eq('buyerId', buyerId)
        .in('policyId', policies.map((p: any) => p.id));

      const acceptedIds = new Set(acceptances?.map((a: any) => a.policyId) || []);
      const missingPolicies = policies.filter((p: any) => !acceptedIds.has(p.id));

      return {
        allAccepted: missingPolicies.length === 0,
        missingPolicies: missingPolicies.map((p: any) => p.id),
      };
    },
    enabled: !!sellerId && !!buyerId,
  });
};
