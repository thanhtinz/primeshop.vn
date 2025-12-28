import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupBadge {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  criteria: string | null;
  is_auto: boolean;
  auto_criteria_type: string | null;
  auto_criteria_value: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberBadge {
  id: string;
  group_id: string;
  badge_id: string;
  member_id: string;
  assigned_by: string;
  assigned_at: string;
  note: string | null;
  badge?: GroupBadge;
}

// Fetch badges for a group
export function useGroupBadges(groupId: string) {
  return useQuery({
    queryKey: ['group-badges', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_badges')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GroupBadge[];
    },
    enabled: !!groupId,
  });
}

// Fetch badges for a specific member
export function useMemberBadges(memberId: string) {
  return useQuery({
    queryKey: ['member-badges', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_member_badges')
        .select(`
          *,
          badge:group_badges(*)
        `)
        .eq('member_id', memberId);
      
      if (error) throw error;
      return data as (GroupMemberBadge & { badge: GroupBadge })[];
    },
    enabled: !!memberId,
  });
}

// Fetch all member badges for a group
export function useGroupMemberBadges(groupId: string) {
  return useQuery({
    queryKey: ['group-member-badges', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_member_badges')
        .select(`
          *,
          badge:group_badges(*)
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;
      return data as (GroupMemberBadge & { badge: GroupBadge })[];
    },
    enabled: !!groupId,
  });
}

// Create a new badge
export function useCreateGroupBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      group_id: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      criteria?: string;
      is_auto?: boolean;
      auto_criteria_type?: string;
      auto_criteria_value?: number;
    }) => {
      const { data: badge, error } = await supabase
        .from('group_badges')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return badge as GroupBadge;
    },
    onSuccess: (badge) => {
      queryClient.invalidateQueries({ queryKey: ['group-badges', badge.group_id] });
      toast.success('Đã tạo huy hiệu mới!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo huy hiệu');
    },
  });
}

// Update a badge
export function useUpdateGroupBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ badgeId, data }: {
      badgeId: string;
      data: Partial<GroupBadge>;
    }) => {
      const { data: badge, error } = await supabase
        .from('group_badges')
        .update(data)
        .eq('id', badgeId)
        .select()
        .single();
      
      if (error) throw error;
      return badge as GroupBadge;
    },
    onSuccess: (badge) => {
      queryClient.invalidateQueries({ queryKey: ['group-badges', badge.group_id] });
      toast.success('Đã cập nhật huy hiệu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật huy hiệu');
    },
  });
}

// Delete a badge
export function useDeleteGroupBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ badgeId, groupId }: { badgeId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_badges')
        .delete()
        .eq('id', badgeId);
      
      if (error) throw error;
      return { badgeId, groupId };
    },
    onSuccess: ({ groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-badges', groupId] });
      toast.success('Đã xóa huy hiệu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa huy hiệu');
    },
  });
}

// Assign a badge to a member
export function useAssignBadge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      badgeId, 
      memberId, 
      groupId,
      note 
    }: { 
      badgeId: string; 
      memberId: string;
      groupId: string;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from('group_member_badges')
        .insert({
          badge_id: badgeId,
          member_id: memberId,
          group_id: groupId,
          assigned_by: user?.id,
          note,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as GroupMemberBadge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member-badges', data.member_id] });
      queryClient.invalidateQueries({ queryKey: ['group-member-badges', data.group_id] });
      queryClient.invalidateQueries({ queryKey: ['group-members', data.group_id] });
      toast.success('Đã cấp huy hiệu cho thành viên!');
    },
    onError: (error: any) => {
      if (error.message?.includes('unique')) {
        toast.error('Thành viên đã có huy hiệu này');
      } else {
        toast.error(error.message || 'Không thể cấp huy hiệu');
      }
    },
  });
}

// Remove a badge from a member
export function useRemoveBadge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      badgeId, 
      memberId,
      groupId,
    }: { 
      badgeId: string; 
      memberId: string;
      groupId: string;
    }) => {
      const { error } = await supabase
        .from('group_member_badges')
        .delete()
        .eq('badge_id', badgeId)
        .eq('member_id', memberId);
      
      if (error) throw error;
      return { memberId, groupId };
    },
    onSuccess: ({ memberId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-badges', memberId] });
      queryClient.invalidateQueries({ queryKey: ['group-member-badges', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã gỡ huy hiệu khỏi thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gỡ huy hiệu');
    },
  });
}
