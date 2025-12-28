// Hooks for Group Management - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types with legacy mappings
export interface GroupBan {
  id: string;
  groupId: string;
  userId: string;
  bannedBy: string;
  reason: string | null;
  banType: 'permanent' | 'temporary' | 'shadow';
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  };
  // Legacy mappings
  group_id?: string;
  user_id?: string;
  banned_by?: string;
  ban_type?: 'permanent' | 'temporary' | 'shadow';
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface GroupViolation {
  id: string;
  groupId: string;
  userId: string;
  violationType: string;
  description: string | null;
  reportedBy: string | null;
  actionTaken: string | null;
  createdAt: string;
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  };
  // Legacy mappings
  group_id?: string;
  user_id?: string;
  violation_type?: string;
  reported_by?: string | null;
  action_taken?: string | null;
  created_at?: string;
}

export interface GroupCustomRole {
  id: string;
  groupId: string;
  name: string;
  color: string;
  icon: string | null;
  price: number;
  maxCount: number | null;
  currentCount: number;
  permissions: Record<string, boolean>;
  isActive: boolean;
  sortOrder: number;
  // Legacy mappings
  group_id?: string;
  max_count?: number | null;
  current_count?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface GroupActivityLog {
  id: string;
  groupId: string;
  userId: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  details: Record<string, any> | null;
  createdAt: string;
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  };
  // Legacy mappings
  group_id?: string;
  user_id?: string | null;
  target_id?: string | null;
  target_type?: string | null;
  created_at?: string;
}

export interface GroupAutoRule {
  id: string;
  groupId: string;
  name: string;
  ruleType: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  isActive: boolean;
  // Legacy mappings
  group_id?: string;
  rule_type?: string;
  is_active?: boolean;
}

// Map functions
const mapBanToLegacy = (b: any): GroupBan => ({
  ...b,
  group_id: b.groupId,
  user_id: b.userId,
  banned_by: b.bannedBy,
  ban_type: b.banType,
  expires_at: b.expiresAt,
  is_active: b.isActive,
  created_at: b.createdAt,
  user: b.user ? { full_name: b.user.fullName, avatar_url: b.user.avatarUrl } : undefined,
});

const mapViolationToLegacy = (v: any): GroupViolation => ({
  ...v,
  group_id: v.groupId,
  user_id: v.userId,
  violation_type: v.violationType,
  reported_by: v.reportedBy,
  action_taken: v.actionTaken,
  created_at: v.createdAt,
  user: v.user ? { full_name: v.user.fullName, avatar_url: v.user.avatarUrl } : undefined,
});

const mapRoleToLegacy = (r: any): GroupCustomRole => ({
  ...r,
  group_id: r.groupId,
  max_count: r.maxCount,
  current_count: r.currentCount,
  is_active: r.isActive,
  sort_order: r.sortOrder,
});

const mapLogToLegacy = (l: any): GroupActivityLog => ({
  ...l,
  group_id: l.groupId,
  user_id: l.userId,
  target_id: l.targetId,
  target_type: l.targetType,
  created_at: l.createdAt,
  user: l.user ? { full_name: l.user.fullName, avatar_url: l.user.avatarUrl } : undefined,
});

const mapAutoRuleToLegacy = (r: any): GroupAutoRule => ({
  ...r,
  group_id: r.groupId,
  rule_type: r.ruleType,
  is_active: r.isActive,
});

// ==================== BANS ====================

export function useGroupBans(groupId: string) {
  return useQuery({
    queryKey: ['group-bans', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_bans')
        .select('*')
        .eq('groupId', groupId)
        .eq('isActive', true)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupBan[];

      // Fetch user profiles
      const userIds = [...new Set(data.map((b: any) => b.userId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return data.map((ban: any) => ({
        ...mapBanToLegacy(ban),
        user: profileMap.get(ban.userId) || null,
      })) as GroupBan[];
    },
    enabled: !!groupId,
  });
}

export function useBanMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      reason,
      banType = 'permanent',
      expiresAt,
    }: {
      groupId: string;
      userId: string;
      reason?: string;
      banType?: 'permanent' | 'temporary' | 'shadow';
      expiresAt?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // If shadow ban, just update member record
      if (banType === 'shadow') {
        await db
          .from('group_members')
          .update({
            isShadowBanned: true,
            shadowBannedAt: new Date().toISOString(),
            shadowBannedBy: user.id,
          })
          .eq('groupId', groupId)
          .eq('userId', userId);
      } else {
        // Remove from members
        await db.from('group_members').delete().eq('groupId', groupId).eq('userId', userId);
      }

      // Add to bans
      const { error } = await db.from('group_bans').insert({
        groupId,
        userId,
        bannedBy: user.id,
        reason,
        banType,
        expiresAt: expiresAt || null,
        isActive: true,
      });

      if (error) throw error;

      // Log violation
      await db.from('group_member_violations').insert({
        groupId,
        userId,
        violationType: 'ban',
        description: reason,
        reportedBy: user.id,
        actionTaken: banType === 'shadow' ? 'shadow_ban' : 'ban',
      });

      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-bans', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã cấm thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cấm thành viên');
    },
  });
}

export function useUnbanMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, banId }: { groupId: string; banId: string }) => {
      const { error } = await db
        .from('group_bans')
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq('id', banId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-bans', groupId] });
      toast.success('Đã gỡ cấm thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gỡ cấm');
    },
  });
}

// ==================== VIOLATIONS ====================

export function useGroupViolations(groupId: string) {
  return useQuery({
    queryKey: ['group-violations', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_member_violations')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupViolation[];

      const userIds = [...new Set(data.map((v: any) => v.userId))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return data.map((v: any) => ({
        ...mapViolationToLegacy(v),
        user: profileMap.get(v.userId) || null,
      })) as GroupViolation[];
    },
    enabled: !!groupId,
  });
}

export function useAddViolation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      violationType,
      description,
      actionTaken,
    }: {
      groupId: string;
      userId: string;
      violationType: string;
      description?: string;
      actionTaken?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await db.from('group_member_violations').insert({
        groupId,
        userId,
        violationType,
        description,
        reportedBy: user.id,
        actionTaken,
      });

      if (error) throw error;

      // Increment warning count
      const { data: currentMember } = await db
        .from<any>('group_members')
        .select('warningCount')
        .eq('groupId', groupId)
        .eq('userId', userId)
        .single();

      if (currentMember) {
        await db
          .from('group_members')
          .update({ warningCount: (currentMember.warningCount || 0) + 1 })
          .eq('groupId', groupId)
          .eq('userId', userId);
      }

      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-violations', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã ghi nhận vi phạm!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ghi nhận vi phạm');
    },
  });
}

// ==================== CUSTOM ROLES ====================

export function useGroupCustomRoles(groupId: string) {
  return useQuery({
    queryKey: ['group-custom-roles', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_custom_roles')
        .select('*')
        .eq('groupId', groupId)
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapRoleToLegacy) as GroupCustomRole[];
    },
    enabled: !!groupId,
  });
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      color,
      icon,
      price,
      maxCount,
      permissions,
    }: {
      groupId: string;
      name: string;
      color?: string;
      icon?: string;
      price?: number;
      maxCount?: number;
      permissions?: Record<string, boolean>;
    }) => {
      const { error } = await db.from('group_custom_roles').insert({
        groupId,
        name,
        color: color || '#6366f1',
        icon,
        price: price || 0,
        maxCount,
        permissions: permissions || {},
      });

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-custom-roles', groupId] });
      toast.success('Đã tạo vai trò!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo vai trò');
    },
  });
}

export function useUpdateCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      groupId,
      data,
    }: {
      roleId: string;
      groupId: string;
      data: Partial<GroupCustomRole>;
    }) => {
      const updates: any = { updatedAt: new Date().toISOString() };
      if (data.name) updates.name = data.name;
      if (data.color) updates.color = data.color;
      if (data.icon !== undefined) updates.icon = data.icon;
      if (data.price !== undefined) updates.price = data.price;
      if (data.maxCount !== undefined || data.max_count !== undefined) {
        updates.maxCount = data.maxCount ?? data.max_count;
      }
      if (data.permissions) updates.permissions = data.permissions;
      if (data.sortOrder !== undefined || data.sort_order !== undefined) {
        updates.sortOrder = data.sortOrder ?? data.sort_order;
      }

      const { error } = await db.from('group_custom_roles').update(updates).eq('id', roleId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-custom-roles', groupId] });
      toast.success('Đã cập nhật vai trò!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật vai trò');
    },
  });
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, groupId }: { roleId: string; groupId: string }) => {
      const { error } = await db.from('group_custom_roles').update({ isActive: false }).eq('id', roleId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-custom-roles', groupId] });
      toast.success('Đã xóa vai trò!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa vai trò');
    },
  });
}

// ==================== ACTIVITY LOGS ====================

export function useGroupActivityLogs(groupId: string, limit = 50) {
  return useQuery({
    queryKey: ['group-activity-logs', groupId, limit],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_activity_logs')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupActivityLog[];

      const userIds = [...new Set(data.map((l: any) => l.userId).filter(Boolean) as string[])];
      let profileMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', userIds);

        profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      }

      return data.map((log: any) => ({
        ...mapLogToLegacy(log),
        user: log.userId ? profileMap.get(log.userId) || null : null,
      })) as GroupActivityLog[];
    },
    enabled: !!groupId,
  });
}

// ==================== AUTO RULES ====================

export function useGroupAutoRules(groupId: string) {
  return useQuery({
    queryKey: ['group-auto-rules', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_auto_rules')
        .select('*')
        .eq('groupId', groupId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapAutoRuleToLegacy) as GroupAutoRule[];
    },
    enabled: !!groupId,
  });
}

export function useCreateAutoRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      ruleType,
      conditions,
      actions,
    }: {
      groupId: string;
      name: string;
      ruleType: string;
      conditions: Record<string, any>;
      actions: Record<string, any>;
    }) => {
      const { error } = await db.from('group_auto_rules').insert({
        groupId,
        name,
        ruleType,
        conditions,
        actions,
      });

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-auto-rules', groupId] });
      toast.success('Đã tạo quy tắc!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo quy tắc');
    },
  });
}

export function useToggleAutoRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ruleId,
      groupId,
      isActive,
    }: {
      ruleId: string;
      groupId: string;
      isActive: boolean;
    }) => {
      const { error } = await db
        .from('group_auto_rules')
        .update({ isActive, updatedAt: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-auto-rules', groupId] });
      toast.success('Đã cập nhật quy tắc!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật quy tắc');
    },
  });
}

export function useDeleteAutoRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, groupId }: { ruleId: string; groupId: string }) => {
      const { error } = await db.from('group_auto_rules').delete().eq('id', ruleId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-auto-rules', groupId] });
      toast.success('Đã xóa quy tắc!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa quy tắc');
    },
  });
}

// ==================== OWNERSHIP TRANSFER ====================

export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }) => {
      const { error } = await rpc('transfer_group_ownership', {
        p_group_id: groupId,
        p_new_owner_id: newOwnerId,
      });

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã chuyển quyền sở hữu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể chuyển quyền');
    },
  });
}

// ==================== MEMBER LABELS ====================

export function useUpdateMemberLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      groupId,
      label,
    }: {
      memberId: string;
      groupId: string;
      label: string | null;
    }) => {
      const { error } = await db.from('group_members').update({ label }).eq('id', memberId);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã cập nhật nhãn!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật nhãn');
    },
  });
}

// ==================== ROLE PERMISSIONS ====================

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      role,
      permissions,
    }: {
      groupId: string;
      role: 'owner' | 'manager' | 'seller' | 'member' | 'viewer';
      permissions: Record<string, boolean>;
    }) => {
      const { error } = await db
        .from('group_role_permissions')
        .update({
          ...permissions,
          updatedAt: new Date().toISOString(),
        })
        .eq('groupId', groupId)
        .eq('role', role);

      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-permissions', groupId] });
      toast.success('Đã cập nhật quyền!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật quyền');
    },
  });
}

export function useAllGroupPermissions(groupId: string) {
  return useQuery({
    queryKey: ['group-all-permissions', groupId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('group_role_permissions')
        .select('*')
        .eq('groupId', groupId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
  });
}

// ==================== GROUP STATS ====================

export function useGroupStats(groupId: string) {
  return useQuery({
    queryKey: ['group-stats', groupId],
    queryFn: async () => {
      // Get member stats
      const { data: members } = await db
        .from<any>('group_members')
        .select('role, isActive, joinedAt')
        .eq('groupId', groupId);

      // Get post count
      const { data: posts } = await db
        .from<any>('group_posts')
        .select('id')
        .eq('groupId', groupId);

      const postCount = posts?.length || 0;

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentPostsData } = await db
        .from<any>('group_posts')
        .select('id')
        .eq('groupId', groupId)
        .gte('createdAt', sevenDaysAgo);

      const recentPosts = recentPostsData?.length || 0;

      const { data: newMembersData } = await db
        .from<any>('group_members')
        .select('id')
        .eq('groupId', groupId)
        .gte('joinedAt', sevenDaysAgo);

      const newMembers = newMembersData?.length || 0;

      // Get wallet stats
      const { data: wallet } = await db
        .from<any>('group_wallets')
        .select('balance, totalIncome, totalExpense')
        .eq('groupId', groupId)
        .single();

      return {
        totalMembers: members?.filter((m: any) => m.isActive).length || 0,
        membersByRole:
          members?.reduce((acc: Record<string, number>, m: any) => {
            acc[m.role] = (acc[m.role] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
        totalPosts: postCount,
        recentPosts,
        newMembers,
        wallet: wallet || { balance: 0, totalIncome: 0, totalExpense: 0 },
      };
    },
    enabled: !!groupId,
  });
}
