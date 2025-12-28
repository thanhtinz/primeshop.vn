// Hooks for Group Badges - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupBadge {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  criteria: string | null;
  isAuto: boolean;
  autoCriteriaType: string | null;
  autoCriteriaValue: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  group_id?: string;
  is_auto?: boolean;
  auto_criteria_type?: string | null;
  auto_criteria_value?: number | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupMemberBadge {
  id: string;
  groupId: string;
  badgeId: string;
  memberId: string;
  assignedBy: string;
  assignedAt: string;
  note: string | null;
  badge?: GroupBadge;
  // Legacy mappings
  group_id?: string;
  badge_id?: string;
  member_id?: string;
  assigned_by?: string;
  assigned_at?: string;
}

const mapBadgeToLegacy = (b: any): GroupBadge => ({
  ...b,
  group_id: b.groupId,
  is_auto: b.isAuto,
  auto_criteria_type: b.autoCriteriaType,
  auto_criteria_value: b.autoCriteriaValue,
  sort_order: b.sortOrder,
  is_active: b.isActive,
  created_at: b.createdAt,
  updated_at: b.updatedAt,
});

const mapMemberBadgeToLegacy = (mb: any): GroupMemberBadge => ({
  ...mb,
  group_id: mb.groupId,
  badge_id: mb.badgeId,
  member_id: mb.memberId,
  assigned_by: mb.assignedBy,
  assigned_at: mb.assignedAt,
  badge: mb.badge ? mapBadgeToLegacy(mb.badge) : undefined,
});

// Fetch badges for a group
export function useGroupBadges(groupId: string) {
  return useQuery({
    queryKey: ['group-badges', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_badges')
        .select('*')
        .eq('groupId', groupId)
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapBadgeToLegacy) as GroupBadge[];
    },
    enabled: !!groupId,
  });
}

// Fetch badges for a specific member
export function useMemberBadges(memberId: string) {
  return useQuery({
    queryKey: ['member-badges', memberId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_member_badges')
        .select('*')
        .eq('memberId', memberId);

      if (error) throw error;
      if (!data || data.length === 0) return [] as (GroupMemberBadge & { badge: GroupBadge })[];

      // Fetch badges
      const badgeIds = data.map((mb: any) => mb.badgeId);
      const { data: badges } = await db
        .from<any>('group_badges')
        .select('*')
        .in('id', badgeIds);

      const badgeMap = new Map(badges?.map((b: any) => [b.id, mapBadgeToLegacy(b)]) || []);

      return data.map((mb: any) => ({
        ...mapMemberBadgeToLegacy(mb),
        badge: badgeMap.get(mb.badgeId) || null,
      })) as (GroupMemberBadge & { badge: GroupBadge })[];
    },
    enabled: !!memberId,
  });
}

// Fetch all member badges for a group
export function useGroupMemberBadges(groupId: string) {
  return useQuery({
    queryKey: ['group-member-badges', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_member_badges')
        .select('*')
        .eq('groupId', groupId);

      if (error) throw error;
      if (!data || data.length === 0) return [] as (GroupMemberBadge & { badge: GroupBadge })[];

      // Fetch badges
      const badgeIds = [...new Set(data.map((mb: any) => mb.badgeId))];
      const { data: badges } = await db
        .from<any>('group_badges')
        .select('*')
        .in('id', badgeIds);

      const badgeMap = new Map(badges?.map((b: any) => [b.id, mapBadgeToLegacy(b)]) || []);

      return data.map((mb: any) => ({
        ...mapMemberBadgeToLegacy(mb),
        badge: badgeMap.get(mb.badgeId) || null,
      })) as (GroupMemberBadge & { badge: GroupBadge })[];
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
      const { data: badge, error } = await db
        .from('group_badges')
        .insert({
          groupId: data.group_id,
          name: data.name,
          description: data.description,
          icon: data.icon || '🏆',
          color: data.color || '#FFD700',
          criteria: data.criteria,
          isAuto: data.is_auto || false,
          autoCriteriaType: data.auto_criteria_type,
          autoCriteriaValue: data.auto_criteria_value,
        })
        .select()
        .single();

      if (error) throw error;
      return mapBadgeToLegacy(badge) as GroupBadge;
    },
    onSuccess: (badge) => {
      queryClient.invalidateQueries({ queryKey: ['group-badges', badge.groupId] });
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
    mutationFn: async ({
      badgeId,
      data,
    }: {
      badgeId: string;
      data: Partial<GroupBadge>;
    }) => {
      const updates: any = {};
      if (data.name) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description;
      if (data.icon) updates.icon = data.icon;
      if (data.color) updates.color = data.color;
      if (data.criteria !== undefined) updates.criteria = data.criteria;
      if (data.isAuto !== undefined || data.is_auto !== undefined) {
        updates.isAuto = data.isAuto ?? data.is_auto;
      }
      if (data.autoCriteriaType || data.auto_criteria_type) {
        updates.autoCriteriaType = data.autoCriteriaType || data.auto_criteria_type;
      }
      if (data.autoCriteriaValue || data.auto_criteria_value) {
        updates.autoCriteriaValue = data.autoCriteriaValue || data.auto_criteria_value;
      }
      if (data.sortOrder !== undefined || data.sort_order !== undefined) {
        updates.sortOrder = data.sortOrder ?? data.sort_order;
      }
      if (data.isActive !== undefined || data.is_active !== undefined) {
        updates.isActive = data.isActive ?? data.is_active;
      }

      const { data: badge, error } = await db
        .from('group_badges')
        .update(updates)
        .eq('id', badgeId)
        .select()
        .single();

      if (error) throw error;
      return mapBadgeToLegacy(badge) as GroupBadge;
    },
    onSuccess: (badge) => {
      queryClient.invalidateQueries({ queryKey: ['group-badges', badge.groupId] });
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
      const { error } = await db.from('group_badges').delete().eq('id', badgeId);
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
      note,
    }: {
      badgeId: string;
      memberId: string;
      groupId: string;
      note?: string;
    }) => {
      const { data, error } = await db
        .from('group_member_badges')
        .insert({
          badgeId,
          memberId,
          groupId,
          assignedBy: user?.id,
          note,
        })
        .select()
        .single();

      if (error) throw error;
      return mapMemberBadgeToLegacy(data) as GroupMemberBadge;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member-badges', data.memberId] });
      queryClient.invalidateQueries({ queryKey: ['group-member-badges', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', data.groupId] });
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
      const { error } = await db
        .from('group_member_badges')
        .delete()
        .eq('badgeId', badgeId)
        .eq('memberId', memberId);

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
