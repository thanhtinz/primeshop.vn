import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface GroupBan {
  id: string;
  group_id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  ban_type: 'permanent' | 'temporary' | 'shadow';
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupViolation {
  id: string;
  group_id: string;
  user_id: string;
  violation_type: string;
  description: string | null;
  reported_by: string | null;
  action_taken: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupCustomRole {
  id: string;
  group_id: string;
  name: string;
  color: string;
  icon: string | null;
  price: number;
  max_count: number | null;
  current_count: number;
  permissions: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
}

export interface GroupActivityLog {
  id: string;
  group_id: string;
  user_id: string | null;
  action: string;
  target_id: string | null;
  target_type: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupAutoRule {
  id: string;
  group_id: string;
  name: string;
  rule_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
}

// ==================== BANS ====================

export function useGroupBans(groupId: string) {
  return useQuery({
    queryKey: ['group-bans', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_bans')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupBan[];
      
      // Fetch user profiles
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(ban => ({
        ...ban,
        user: profileMap.get(ban.user_id) || null,
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
        await supabase
          .from('group_members')
          .update({
            is_shadow_banned: true,
            shadow_banned_at: new Date().toISOString(),
            shadow_banned_by: user.id,
          })
          .eq('group_id', groupId)
          .eq('user_id', userId);
      } else {
        // Remove from members
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', userId);
      }
      
      // Add to bans
      const { error } = await supabase
        .from('group_bans')
        .upsert({
          group_id: groupId,
          user_id: userId,
          banned_by: user.id,
          reason,
          ban_type: banType,
          expires_at: expiresAt || null,
          is_active: true,
        });
      
      if (error) throw error;
      
      // Log violation
      await supabase.from('group_member_violations').insert({
        group_id: groupId,
        user_id: userId,
        violation_type: 'ban',
        description: reason,
        reported_by: user.id,
        action_taken: banType === 'shadow' ? 'shadow_ban' : 'ban',
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
      const { error } = await supabase
        .from('group_bans')
        .update({ is_active: false, updated_at: new Date().toISOString() })
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
      const { data, error } = await supabase
        .from('group_member_violations')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupViolation[];
      
      const userIds = [...new Set(data.map(v => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(v => ({
        ...v,
        user: profileMap.get(v.user_id) || null,
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
      
      const { error } = await supabase.from('group_member_violations').insert({
        group_id: groupId,
        user_id: userId,
        violation_type: violationType,
        description,
        reported_by: user.id,
        action_taken: actionTaken,
      });
      
      if (error) throw error;
      
      // Increment warning count - use raw SQL update
      const { data: currentMember } = await supabase
        .from('group_members')
        .select('warning_count')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();
      
      if (currentMember) {
        await supabase
          .from('group_members')
          .update({ warning_count: (currentMember.warning_count || 0) + 1 })
          .eq('group_id', groupId)
          .eq('user_id', userId);
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
      const { data, error } = await supabase
        .from('group_custom_roles')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as GroupCustomRole[];
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
      const { error } = await supabase.from('group_custom_roles').insert({
        group_id: groupId,
        name,
        color: color || '#6366f1',
        icon,
        price: price || 0,
        max_count: maxCount,
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
      const { error } = await supabase
        .from('group_custom_roles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', roleId);
      
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
      const { error } = await supabase
        .from('group_custom_roles')
        .update({ is_active: false })
        .eq('id', roleId);
      
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
      const { data, error } = await supabase
        .from('group_activity_logs')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupActivityLog[];
      
      const userIds = [...new Set(data.map(l => l.user_id).filter(Boolean) as string[])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(log => ({
        ...log,
        user: log.user_id ? profileMap.get(log.user_id) || null : null,
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
      const { data, error } = await supabase
        .from('group_auto_rules')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at');
      
      if (error) throw error;
      return (data || []) as GroupAutoRule[];
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
      const { error } = await supabase.from('group_auto_rules').insert({
        group_id: groupId,
        name,
        rule_type: ruleType,
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
    mutationFn: async ({ ruleId, groupId, isActive }: { ruleId: string; groupId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('group_auto_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
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
      const { error } = await supabase
        .from('group_auto_rules')
        .delete()
        .eq('id', ruleId);
      
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
      const { error } = await supabase.rpc('transfer_group_ownership', {
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
      const { error } = await supabase
        .from('group_members')
        .update({ label })
        .eq('id', memberId);
      
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
      const { error } = await supabase
        .from('group_role_permissions')
        .update({
          ...permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('group_id', groupId)
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
      const { data, error } = await supabase
        .from('group_role_permissions')
        .select('*')
        .eq('group_id', groupId);
      
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
      const { data: members } = await supabase
        .from('group_members')
        .select('role, is_active, created_at:joined_at')
        .eq('group_id', groupId);
      
      // Get post stats
      const { count: postCount } = await supabase
        .from('group_posts')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
      
      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { count: recentPosts } = await supabase
        .from('group_posts')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('created_at', sevenDaysAgo);
      
      const { count: newMembers } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('joined_at', sevenDaysAgo);
      
      // Get wallet stats
      const { data: wallet } = await supabase
        .from('group_wallets')
        .select('balance, total_income, total_expense')
        .eq('group_id', groupId)
        .single();
      
      return {
        totalMembers: members?.filter(m => m.is_active).length || 0,
        membersByRole: members?.reduce((acc, m) => {
          acc[m.role] = (acc[m.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        totalPosts: postCount || 0,
        recentPosts: recentPosts || 0,
        newMembers: newMembers || 0,
        wallet: wallet || { balance: 0, total_income: 0, total_expense: 0 },
      };
    },
    enabled: !!groupId,
  });
}
