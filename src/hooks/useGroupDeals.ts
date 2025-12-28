import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DealStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface GroupDeal {
  id: string;
  group_id: string;
  post_id: string | null;
  title: string;
  description: string | null;
  conditions: Record<string, any>;
  start_time: string;
  end_time: string | null;
  total_pool: number;
  winner_reward: number;
  max_participants: number | null;
  status: DealStatus;
  result: Record<string, any> | null;
  result_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  participants?: GroupDealParticipant[];
  participant_count?: number;
}

export interface GroupDealParticipant {
  id: string;
  deal_id: string;
  user_id: string;
  contribution_amount: number;
  role: string | null;
  result: Record<string, any> | null;
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
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

// Fetch group deals
export function useGroupDeals(groupId: string, status?: DealStatus) {
  return useQuery({
    queryKey: ['group-deals', groupId, status],
    queryFn: async () => {
      let query = supabase
        .from('group_deals')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupDeal[];
      
      // Fetch creator profiles
      const creatorIds = [...new Set(data.map(d => d.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', creatorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Fetch participant counts
      const { data: counts } = await supabase
        .from('group_deal_participants')
        .select('deal_id')
        .in('deal_id', data.map(d => d.id));
      
      const countMap = new Map<string, number>();
      counts?.forEach(c => {
        countMap.set(c.deal_id, (countMap.get(c.deal_id) || 0) + 1);
      });
      
      return data.map(deal => ({
        ...deal,
        creator: profileMap.get(deal.created_by) || null,
        participant_count: countMap.get(deal.id) || 0,
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
      const { data: deal, error } = await supabase
        .from('group_deals')
        .select('*')
        .eq('id', dealId)
        .single();
      
      if (error) throw error;
      
      // Fetch creator profile
      const { data: creator } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', deal.created_by)
        .single();
      
      // Fetch participants
      const { data: participants } = await supabase
        .from('group_deal_participants')
        .select('*')
        .eq('deal_id', dealId)
        .order('joined_at', { ascending: true });
      
      // Fetch participant profiles
      let participantsWithProfiles: GroupDealParticipant[] = [];
      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        participantsWithProfiles = participants.map(p => ({
          ...p,
          profile: profileMap.get(p.user_id) || null,
        })) as GroupDealParticipant[];
      }
      
      return {
        ...deal,
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
      
      const { data: deal, error } = await supabase
        .from('group_deals')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return deal as GroupDeal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['group-deals', deal.group_id] });
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
      contributionAmount 
    }: { 
      dealId: string; 
      contributionAmount?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_deal_participants')
        .insert({
          deal_id: dealId,
          user_id: user.id,
          contribution_amount: contributionAmount || 0,
        });
      
      if (error) throw error;
      
      // Update total pool
      if (contributionAmount && contributionAmount > 0) {
        const { data: deal } = await supabase
          .from('group_deals')
          .select('total_pool')
          .eq('id', dealId)
          .single();
        
        await supabase
          .from('group_deals')
          .update({ total_pool: (deal?.total_pool || 0) + contributionAmount })
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
      const { data: deal, error } = await supabase
        .from('group_deals')
        .update({ 
          status, 
          result: result || null,
          result_notes: resultNotes || null,
        })
        .eq('id', dealId)
        .select()
        .single();
      
      if (error) throw error;
      return deal as GroupDeal;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['group-deals', deal.group_id] });
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
      const { error } = await supabase
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
      const { error } = await supabase
        .from('group_deals')
        .delete()
        .eq('id', dealId);
      
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
