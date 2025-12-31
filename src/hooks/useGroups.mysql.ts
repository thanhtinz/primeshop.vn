// Hooks for Groups - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type GroupVisibility = 'public' | 'private' | 'hidden';
export type GroupJoinType = 'open' | 'link' | 'code' | 'approval' | 'conditional';
export type GroupMemberRole = 'owner' | 'manager' | 'seller' | 'member' | 'viewer';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  visibility: GroupVisibility;
  joinType: GroupJoinType;
  joinCode: string | null;
  minReputationToJoin: number;
  minLevelToJoin: number;
  category: string | null;
  tags: string[] | null;
  entryFee: number;
  monthlyFee: number;
  sellerRolePrice: number;
  vipRolePrice: number;
  dealCommissionPercent: number;
  memberCount: number;
  postCount: number;
  settings: Record<string, any>;
  rules: any[];
  ownerId: string;
  chatRoomId: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  avatar_url?: string | null;
  cover_url?: string | null;
  join_type?: GroupJoinType;
  join_code?: string | null;
  min_reputation_to_join?: number;
  min_level_to_join?: number;
  entry_fee?: number;
  monthly_fee?: number;
  seller_role_price?: number;
  vip_role_price?: number;
  deal_commission_percent?: number;
  member_count?: number;
  post_count?: number;
  owner_id?: string;
  chat_room_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  customPermissions: Record<string, any>;
  contributionPoints: number;
  isActive: boolean;
  mutedUntil: string | null;
  paidUntil: string | null;
  roleExpiresAt: string | null;
  joinedAt: string;
  updatedAt: string;
  profile?: any;
  // Legacy mappings
  group_id?: string;
  user_id?: string;
  custom_permissions?: Record<string, any>;
  contribution_points?: number;
  is_active?: boolean;
  muted_until?: string | null;
  paid_until?: string | null;
  role_expires_at?: string | null;
  joined_at?: string;
  updated_at?: string;
}

export interface CreateGroupData {
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  visibility?: GroupVisibility;
  join_type?: GroupJoinType;
  category?: string;
  tags?: string[];
  entry_fee?: number;
  monthly_fee?: number;
}

const mapGroupToLegacy = (g: any): Group => ({
  ...g,
  avatar_url: g.avatarUrl,
  cover_url: g.coverUrl,
  join_type: g.joinType,
  join_code: g.joinCode,
  min_reputation_to_join: g.minReputationToJoin,
  min_level_to_join: g.minLevelToJoin,
  entry_fee: g.entryFee,
  monthly_fee: g.monthlyFee,
  seller_role_price: g.sellerRolePrice,
  vip_role_price: g.vipRolePrice,
  deal_commission_percent: g.dealCommissionPercent,
  member_count: g.memberCount,
  post_count: g.postCount,
  owner_id: g.ownerId,
  chat_room_id: g.chatRoomId,
  created_at: g.createdAt,
  updated_at: g.updatedAt,
});

const mapMemberToLegacy = (m: any): GroupMember => ({
  ...m,
  group_id: m.groupId,
  user_id: m.userId,
  custom_permissions: m.customPermissions,
  contribution_points: m.contributionPoints,
  is_active: m.isActive,
  muted_until: m.mutedUntil,
  paid_until: m.paidUntil,
  role_expires_at: m.roleExpiresAt,
  joined_at: m.joinedAt,
  updated_at: m.updatedAt,
});

// Fetch all groups
export function useGroups(filter?: 'all' | 'my' | 'joined') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['groups', filter, user?.id],
    queryFn: async () => {
      if ((filter === 'my' || filter === 'joined') && !user) {
        return [];
      }
      
      if (filter === 'my' && user) {
        const { data, error } = await db
          .from<any>('groups')
          .select('*')
          .eq('ownerId', user.id)
          .order('memberCount', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(mapGroupToLegacy);
      } 
      
      if (filter === 'joined' && user) {
        const { data: memberships } = await db
          .from<any>('group_members')
          .select('groupId')
          .eq('userId', user.id)
          .eq('isActive', true);
        
        const groupIds = memberships?.map((m: any) => m.groupId) || [];
        if (groupIds.length === 0) return [];
        
        const { data, error } = await db
          .from<any>('groups')
          .select('*')
          .in('id', groupIds)
          .order('memberCount', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(mapGroupToLegacy);
      }
      
      // All public groups
      const { data, error } = await db
        .from<any>('groups')
        .select('*')
        .eq('visibility', 'public')
        .order('memberCount', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapGroupToLegacy);
    },
  });
}

// Fetch single group
export function useGroup(slugOrId: string) {
  return useQuery({
    queryKey: ['group', slugOrId],
    queryFn: async () => {
      // Try by slug first
      let { data, error } = await db
        .from<any>('groups')
        .select('*')
        .eq('slug', slugOrId)
        .single();
      
      if (!data && !error) {
        const result = await db
          .from<any>('groups')
          .select('*')
          .eq('id', slugOrId)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data ? mapGroupToLegacy(data) : null;
    },
    enabled: !!slugOrId,
  });
}

// Get group members
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_members')
        .select('*')
        .eq('groupId', groupId)
        .eq('isActive', true)
        .order('joinedAt', { ascending: false });
      
      if (error) throw error;
      
      // Get profiles
      const userIds = data?.map((m: any) => m.userId) || [];
      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('userId, fullName, avatarUrl')
          .in('userId', userIds);
        
        const profileMap = new Map(profiles?.map((p: any) => [p.userId, {
          full_name: p.fullName,
          avatar_url: p.avatarUrl,
        }]));
        
        return (data || []).map((m: any) => ({
          ...mapMemberToLegacy(m),
          profile: profileMap.get(m.userId),
        }));
      }
      
      return (data || []).map(mapMemberToLegacy);
    },
    enabled: !!groupId,
  });
}

// Check membership
export function useGroupMembership(groupId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-membership', groupId, user?.id],
    queryFn: async () => {
      if (!user?.id || !groupId) return null;
      
      const { data, error } = await db
        .from<any>('group_members')
        .select('*')
        .eq('groupId', groupId)
        .eq('userId', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapMemberToLegacy(data) : null;
    },
    enabled: !!user?.id && !!groupId,
  });
}

// Create group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (groupData: CreateGroupData) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await db
        .from<any>('groups')
        .insert({
          name: groupData.name,
          slug: groupData.slug,
          description: groupData.description,
          avatarUrl: groupData.avatar_url,
          coverUrl: groupData.cover_url,
          visibility: groupData.visibility || 'public',
          joinType: groupData.join_type || 'open',
          category: groupData.category,
          tags: groupData.tags,
          entryFee: groupData.entry_fee || 0,
          monthlyFee: groupData.monthly_fee || 0,
          ownerId: user.id,
          memberCount: 1,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Add owner as member
      await db
        .from('group_members')
        .insert({
          groupId: data.id,
          userId: user.id,
          role: 'owner',
          isActive: true,
        });
      
      return mapGroupToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Tạo nhóm thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Join group
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ groupId, joinCode }: { groupId: string; joinCode?: string }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      // Check if already member
      const { data: existing } = await db
        .from<any>('group_members')
        .select('id')
        .eq('groupId', groupId)
        .eq('userId', user.id)
        .single();
      
      if (existing) throw new Error('Bạn đã là thành viên của nhóm này');
      
      // Get group to check join type
      const { data: group } = await db
        .from<any>('groups')
        .select('joinType, joinCode, entryFee')
        .eq('id', groupId)
        .single();
      
      if (!group) throw new Error('Không tìm thấy nhóm');
      
      // Verify join code if needed
      if (group.joinType === 'code' && group.joinCode !== joinCode) {
        throw new Error('Mã tham gia không đúng');
      }
      
      // Add member
      const { data, error } = await db
        .from<any>('group_members')
        .insert({
          groupId,
          userId: user.id,
          role: 'member',
          isActive: group.joinType === 'approval' ? false : true,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update member count
      await db
        .from<any>('groups')
        .update({ memberCount: (group.memberCount || 0) + 1 })
        .eq('id', groupId);
      
      return mapMemberToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã tham gia nhóm!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Leave group
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { error } = await db
        .from('group_members')
        .delete()
        .eq('groupId', groupId)
        .eq('userId', user.id);
      
      if (error) throw error;
      
      // Decrease member count
      const { data: group } = await db
        .from<any>('groups')
        .select('memberCount')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await db
          .from<any>('groups')
          .update({ memberCount: Math.max(0, (group.memberCount || 1) - 1) })
          .eq('id', groupId);
      }
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã rời nhóm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update group
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Group> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.avatarUrl !== undefined || updates.avatar_url !== undefined) {
        updateData.avatarUrl = updates.avatarUrl ?? updates.avatar_url;
      }
      if (updates.coverUrl !== undefined || updates.cover_url !== undefined) {
        updateData.coverUrl = updates.coverUrl ?? updates.cover_url;
      }
      if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
      if (updates.joinType !== undefined || updates.join_type !== undefined) {
        updateData.joinType = updates.joinType ?? updates.join_type;
      }
      if (updates.settings !== undefined) updateData.settings = updates.settings;
      if (updates.rules !== undefined) updateData.rules = updates.rules;
      
      const { data, error } = await db
        .from<any>('groups')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapGroupToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group'] });
      toast.success('Đã cập nhật nhóm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete group
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      // Delete members first
      await db.from('group_members').delete().eq('groupId', groupId);
      
      // Delete group posts
      await db.from('group_posts').delete().eq('groupId', groupId);
      
      // Delete group
      const { error } = await db.from('groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã xóa nhóm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: GroupMemberRole }) => {
      const { data, error } = await db
        .from<any>('group_members')
        .update({ role })
        .eq('id', memberId)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapMemberToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast.success('Đã cập nhật vai trò');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Remove member
export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, groupId }: { memberId: string; groupId: string }) => {
      const { error } = await db.from('group_members').delete().eq('id', memberId);
      if (error) throw error;
      
      // Decrease count
      const { data: group } = await db
        .from<any>('groups')
        .select('memberCount')
        .eq('id', groupId)
        .single();
      
      if (group) {
        await db
          .from<any>('groups')
          .update({ memberCount: Math.max(0, (group.memberCount || 1) - 1) })
          .eq('id', groupId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã xóa thành viên');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Search groups
export function useSearchGroups(query: string) {
  return useQuery({
    queryKey: ['groups', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await db
        .from<any>('groups')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('visibility', 'public')
        .limit(20);
      
      if (error) throw error;
      return (data || []).map(mapGroupToLegacy);
    },
    enabled: query.length >= 2,
  });
}