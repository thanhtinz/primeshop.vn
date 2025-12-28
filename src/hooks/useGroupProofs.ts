import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupProof {
  id: string;
  group_id: string;
  reference_type: string;
  reference_id: string | null;
  description: string | null;
  media_urls: string[] | null;
  captured_at: string;
  ip_address: string | null;
  submitted_by: string;
  hash: string | null;
  created_at: string;
  submitter?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch proofs for a reference
export function useGroupProofs(groupId: string, referenceType?: string, referenceId?: string) {
  return useQuery({
    queryKey: ['group-proofs', groupId, referenceType, referenceId],
    queryFn: async () => {
      let query = supabase
        .from('group_proofs')
        .select('*')
        .eq('group_id', groupId)
        .order('captured_at', { ascending: false });
      
      if (referenceType) {
        query = query.eq('reference_type', referenceType);
      }
      if (referenceId) {
        query = query.eq('reference_id', referenceId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupProof[];
      
      // Fetch submitter profiles
      const submitterIds = [...new Set(data.map(p => p.submitted_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', submitterIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(proof => ({
        ...proof,
        submitter: profileMap.get(proof.submitted_by) || null,
      })) as GroupProof[];
    },
    enabled: !!groupId,
  });
}

// Submit proof
export function useSubmitProof() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      groupId, 
      referenceType,
      referenceId,
      description,
      mediaUrls,
    }: { 
      groupId: string; 
      referenceType: string;
      referenceId?: string;
      description?: string;
      mediaUrls?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Generate simple hash for verification
      const content = `${groupId}-${referenceType}-${referenceId || ''}-${Date.now()}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { data: proof, error } = await supabase
        .from('group_proofs')
        .insert({
          group_id: groupId,
          reference_type: referenceType,
          reference_id: referenceId || null,
          description,
          media_urls: mediaUrls || null,
          submitted_by: user.id,
          hash,
        })
        .select()
        .single();
      
      if (error) throw error;
      return proof as GroupProof;
    },
    onSuccess: (proof) => {
      queryClient.invalidateQueries({ queryKey: ['group-proofs', proof.group_id] });
      toast.success('Đã gửi bằng chứng!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi bằng chứng');
    },
  });
}

// Contribution history
export interface ContributionHistory {
  id: string;
  group_id: string;
  user_id: string;
  points_change: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export function useContributionHistory(groupId: string, userId?: string) {
  return useQuery({
    queryKey: ['contribution-history', groupId, userId],
    queryFn: async () => {
      let query = supabase
        .from('group_contribution_history')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ContributionHistory[];
    },
    enabled: !!groupId,
  });
}

// Add contribution points
export function useAddContributionPoints() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      groupId, 
      userId,
      points,
      reason,
      referenceType,
      referenceId,
    }: { 
      groupId: string; 
      userId: string;
      points: number;
      reason: string;
      referenceType?: string;
      referenceId?: string;
    }) => {
      const { error } = await supabase
        .from('group_contribution_history')
        .insert({
          group_id: groupId,
          user_id: userId,
          points_change: points,
          reason,
          reference_type: referenceType || null,
          reference_id: referenceId || null,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['contribution-history', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã cập nhật điểm đóng góp!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật điểm');
    },
  });
}
