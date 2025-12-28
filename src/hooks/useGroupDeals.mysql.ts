// Hooks for Group Deals - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DealStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface GroupDeal {
  id: string;
  groupId: string;
  postId: string | null;
  title: string;
  description: string | null;
  conditions: Record<string, any>;
  startTime: string;
  endTime: string | null;
  totalPool: number;
  winnerReward: number;
  maxParticipants: number | null;
  status: DealStatus;
  result: Record<string, any> | null;
  resultNotes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  participants?: GroupDealParticipant[];
  participantCount?: number;
  // Legacy mappings
  group_id?: string;
  post_id?: string | null;
  start_time?: string;
  end_time?: string | null;
  total_pool?: number;
  winner_reward?: number;
  max_participants?: number | null;
  result_notes?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  participant_count?: number;
}

export interface GroupDealParticipant {
  id: string;
  dealId: string;
  userId: string;
  contributionAmount: number;
  role: string | null;
  result: Record<string, any> | null;
  joinedAt: string;
  profile?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  // Legacy mappings
  deal_id?: string;
  user_id?: string;
  contribution_amount?: number;
  joined_at?: string;
}

export interface CreateDealData {
  group_id: string;
  title: string;
  description?: string;
  conditions?: Record<string, any>;
  end_time?: string;
  total_pool?: number;
  winner_reward?: number;
  max_participants?: number;
}

const mapDealToLegacy = (d: any): GroupDeal => ({
  ...d,
  group_id: d.groupId,
  post_id: d.postId,
  start_time: d.startTime,
  end_time: d.endTime,
  total_pool: d.totalPool,
  winner_reward: d.winnerReward,
  max_participants: d.maxParticipants,
  result_notes: d.resultNotes,
  created_by: d.createdBy,
  created_at: d.createdAt,
  updated_at: d.updatedAt,
  participant_count: d.participantCount,
  creator: d.creator ? {
    full_name: d.creator.fullName,
    avatar_url: d.creator.avatarUrl,
  } : null,
});

const mapParticipantToLegacy = (p: any): GroupDealParticipant => ({
  ...p,
  deal_id: p.dealId,
  user_id: p.userId,
  contribution_amount: p.contributionAmount,
  joined_at: p.joinedAt,
  profile: p.profile ? {
    full_name: p.profile.fullName,
    avatar_url: p.profile.avatarUrl,
  } : null,
});

// Fetch group deals
export function useGroupDeals(groupId: string, status?: DealStatus) {
  return useQuery({
    queryKey: ['group-deals', groupId, status],
    queryFn: async () => {
      let query = db
        .from<any>('group_deals')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupDeal[];

      // Fetch creator profiles
      const creatorIds = [...new Set(data.map((d: any) => d.createdBy))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', creatorIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      // Fetch participant counts
      const { data: counts } = await db
        .from<any>('group_deal_participants')
        .select('dealId')
        .in('dealId', data.map((d: any) => d.id));

      const countMap = new Map<string, number>();
      counts?.forEach((c: any) => {
        countMap.set(c.dealId, (countMap.get(c.dealId) || 0) + 1);
      });

      return data.map((deal: any) => ({
        ...mapDealToLegacy(deal),
        creator: profileMap.get(deal.createdBy) || null,
        participantCount: countMap.get(deal.id) || 0,
      })) as GroupDeal[];
    },
    enabled: !!groupId,
  });
}

// Fetch single deal with participants
export function useGroupDeal(dealId: string) {
  return useQuery({
    queryKey: ['group-deal', dealId],
    queryFn: async () => {
      const { data: deal, error } = await db
        .from<any>('group_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;

      // Fetch creator profile
      const { data: creator } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .eq('id', deal.createdBy)
        .single();

      // Fetch participants
      const { data: participants } = await db
        .from<any>('group_deal_participants')
        .select('*')
        .eq('dealId', dealId)
        .order('joinedAt', { ascending: true });

      // Fetch participant profiles
      let participantsWithProfiles: GroupDealParticipant[] = [];
      if (participants && participants.length > 0) {
        const userIds = participants.map((p: any) => p.userId);
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
        participantsWithProfiles = participants.map((p: any) => ({
          ...mapParticipantToLegacy(p),
          profile: profileMap.get(p.userId) || null,
        })) as GroupDealParticipant[];
      }

      return {
        ...mapDealToLegacy(deal),
        creator,
        participants: participantsWithProfiles,
      } as GroupDeal;
    },
    enabled: !!dealId,
  });
}

// Create deal
export function useCreateGroupDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateDealData) => {
      if (!user) throw new Error('Must be logged in');

      const { data: deal, error } = await db
        .from('group_deals')
        .insert({
          groupId: data.group_id,
          title: data.title,
          description: data.description,
          conditions: data.conditions,
          endTime: data.end_time,
          totalPool: data.total_pool || 0,
          winnerReward: data.winner_reward || 0,
          maxParticipants: data.max_participants,
          createdBy: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDealToLegacy(deal) as GroupDeal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['group-deals', deal.groupId] });
      toast.success('Đã tạo kèo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo kèo');
    },
  });
}

// Join deal
export function useJoinGroupDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      dealId,
      contributionAmount,
    }: {
      dealId: string;
      contributionAmount?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await db.from('group_deal_participants').insert({
        dealId,
        userId: user.id,
        contributionAmount: contributionAmount || 0,
      });

      if (error) throw error;

      // Update total pool
      if (contributionAmount && contributionAmount > 0) {
        const { data: deal } = await db
          .from<any>('group_deals')
          .select('totalPool')
          .eq('id', dealId)
          .single();

        await db
          .from('group_deals')
          .update({ totalPool: (deal?.totalPool || 0) + contributionAmount })
          .eq('id', dealId);
      }
    },
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['group-deals'] });
      toast.success('Đã tham gia kèo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tham gia');
    },
  });
}

// Update deal status
export function useUpdateDealStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      groupId,
      status,
      result,
      resultNotes,
    }: {
      dealId: string;
      groupId: string;
      status: DealStatus;
      result?: Record<string, any>;
      resultNotes?: string;
    }) => {
      const { data: deal, error } = await db
        .from('group_deals')
        .update({
          status,
          result: result || null,
          resultNotes: resultNotes || null,
        })
        .eq('id', dealId)
        .select()
        .single();

      if (error) throw error;
      return mapDealToLegacy(deal) as GroupDeal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['group-deals', deal.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-deal', deal.id] });
      toast.success('Đã cập nhật kèo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật');
    },
  });
}

// Update participant result
export function useUpdateParticipantResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      dealId,
      role,
      result,
    }: {
      participantId: string;
      dealId: string;
      role?: string;
      result?: Record<string, any>;
    }) => {
      const { error } = await db
        .from('group_deal_participants')
        .update({ role, result })
        .eq('id', participantId);

      if (error) throw error;
      return dealId;
    },
    onSuccess: (dealId) => {
      queryClient.invalidateQueries({ queryKey: ['group-deal', dealId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật');
    },
  });
}

// Delete deal
export function useDeleteGroupDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId, groupId }: { dealId: string; groupId: string }) => {
      const { error } = await db.from('group_deals').delete().eq('id', dealId);
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-deals', groupId] });
      toast.success('Đã xóa kèo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa');
    },
  });
}
