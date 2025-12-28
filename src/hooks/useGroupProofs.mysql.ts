// Hooks for Group Proofs - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupProof {
  id: string;
  groupId: string;
  referenceType: string;
  referenceId: string | null;
  description: string | null;
  mediaUrls: string[] | null;
  capturedAt: string;
  ipAddress: string | null;
  submittedBy: string;
  hash: string | null;
  createdAt: string;
  submitter?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  // Legacy mappings
  group_id?: string;
  reference_type?: string;
  reference_id?: string | null;
  media_urls?: string[] | null;
  captured_at?: string;
  ip_address?: string | null;
  submitted_by?: string;
  created_at?: string;
}

const mapProofToLegacy = (p: any): GroupProof => ({
  ...p,
  group_id: p.groupId,
  reference_type: p.referenceType,
  reference_id: p.referenceId,
  media_urls: p.mediaUrls,
  captured_at: p.capturedAt,
  ip_address: p.ipAddress,
  submitted_by: p.submittedBy,
  created_at: p.createdAt,
  submitter: p.submitter ? {
    full_name: p.submitter.fullName,
    avatar_url: p.submitter.avatarUrl,
  } : null,
});

// Fetch proofs for a reference
export function useGroupProofs(groupId: string, referenceType?: string, referenceId?: string) {
  return useQuery({
    queryKey: ['group-proofs', groupId, referenceType, referenceId],
    queryFn: async () => {
      let query = db
        .from<any>('group_proofs')
        .select('*')
        .eq('groupId', groupId)
        .order('capturedAt', { ascending: false });

      if (referenceType) {
        query = query.eq('referenceType', referenceType);
      }
      if (referenceId) {
        query = query.eq('referenceId', referenceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupProof[];

      // Fetch submitter profiles
      const submitterIds = [...new Set(data.map((p: any) => p.submittedBy))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', submitterIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return data.map((proof: any) => ({
        ...mapProofToLegacy(proof),
        submitter: profileMap.get(proof.submittedBy) || null,
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

      const { data: proof, error } = await db
        .from('group_proofs')
        .insert({
          groupId,
          referenceType,
          referenceId: referenceId || null,
          description,
          mediaUrls: mediaUrls || null,
          submittedBy: user.id,
          hash,
        })
        .select()
        .single();

      if (error) throw error;
      return mapProofToLegacy(proof) as GroupProof;
    },
    onSuccess: (proof) => {
      queryClient.invalidateQueries({ queryKey: ['group-proofs', proof.groupId] });
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
  groupId: string;
  userId: string;
  pointsChange: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  // Legacy mappings
  group_id?: string;
  user_id?: string;
  points_change?: number;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string;
}

const mapContributionToLegacy = (c: any): ContributionHistory => ({
  ...c,
  group_id: c.groupId,
  user_id: c.userId,
  points_change: c.pointsChange,
  reference_type: c.referenceType,
  reference_id: c.referenceId,
  created_at: c.createdAt,
});

export function useContributionHistory(groupId: string, userId?: string) {
  return useQuery({
    queryKey: ['contribution-history', groupId, userId],
    queryFn: async () => {
      let query = db
        .from<any>('group_contribution_history')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: false });

      if (userId) {
        query = query.eq('userId', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapContributionToLegacy) as ContributionHistory[];
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
      const { error } = await db.from('group_contribution_history').insert({
        groupId,
        userId,
        pointsChange: points,
        reason,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
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
