import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export type GroupVisibility = 'public' | 'private' | 'hidden';
export type GroupJoinType = 'open' | 'link' | 'code' | 'approval' | 'conditional';
export type GroupMemberRole = 'owner' | 'manager' | 'seller' | 'member' | 'viewer';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  visibility: GroupVisibility;
  join_type: GroupJoinType;
  join_code: string | null;
  min_reputation_to_join: number;
  min_level_to_join: number;
  category: string | null;
  tags: string[] | null;
  entry_fee: number;
  monthly_fee: number;
  seller_role_price: number;
  vip_role_price: number;
  deal_commission_percent: number;
  member_count: number;
  post_count: number;
  settings: Record<string, any>;
  rules: any[];
  owner_id: string;
  chat_room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  custom_permissions: Record<string, any>;
  contribution_points: number;
  is_active: boolean;
  muted_until: string | null;
  paid_until: string | null;
  role_expires_at: string | null;
  joined_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface GroupRolePermissions {
  id: string;
  group_id: string;
  role: GroupMemberRole;
  can_post: boolean;
  can_comment: boolean;
  can_create_deal: boolean;
  can_create_task: boolean;
  can_create_poll: boolean;
  can_view_insights: boolean;
  can_invite: boolean;
  can_manage_members: boolean;
  can_manage_posts: boolean;
  can_manage_wallet: boolean;
  can_manage_rules: boolean;
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

// Fetch all groups (public or user's groups)
export function useGroups(filter?: 'all' | 'my' | 'joined') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['groups', filter, user?.id],
    queryFn: async () => {
      // Return empty array for user-specific filters when not logged in
      if ((filter === 'my' || filter === 'joined') && !user) {
        return [];
      }
      
      let query = supabase
        .from('groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (filter === 'my' && user) {
        query = query.eq('owner_id', user.id);
      } else if (filter === 'joined' && user) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        const groupIds = memberships?.map(m => m.group_id) || [];
        if (groupIds.length === 0) return [];
        query = query.in('id', groupIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Group[];
    },
  });
}

// Fetch single group by slug or id
export function useGroup(slugOrId: string) {
  return useQuery({
    queryKey: ['group', slugOrId],
    queryFn: async () => {
      // First try by slug
      let { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('slug', slugOrId)
        .maybeSingle();
      
      // If not found by slug, try by id
      if (!data && !error) {
        const result = await supabase
          .from('groups')
          .select('*')
          .eq('id', slugOrId)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      if (!data) throw new Error('Group not found');
      return data as Group;
    },
    enabled: !!slugOrId,
  });
}

// Fetch group members
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('contribution_points', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupMember[];
      
      // Fetch profiles separately with extended info
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, avatar_frame_id, is_verified, has_prime_boost, total_spent, vip_level_id')
        .in('user_id', userIds);
      
      // Get VIP level names
      const vipLevelIds = [...new Set(profiles?.map(p => p.vip_level_id).filter(Boolean) || [])];
      let vipLevelMap = new Map<string, string>();
      if (vipLevelIds.length > 0) {
        const { data: vipLevels } = await supabase
          .from('vip_levels')
          .select('id, name')
          .in('id', vipLevelIds);
        vipLevelMap = new Map(vipLevels?.map(v => [v.id, v.name]) || []);
      }
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, {
        ...p,
        vip_level_name: p.vip_level_id ? vipLevelMap.get(p.vip_level_id) : null,
      }]) || []);
      
      return data.map(member => ({
        ...member,
        profile: profileMap.get(member.user_id) || null,
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });
}

// Check if user is member
export function useGroupMembership(groupId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-membership', groupId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as GroupMember | null;
    },
    enabled: !!groupId && !!user,
  });
}

// Fetch group permissions for current role
export function useGroupPermissions(groupId: string, role?: GroupMemberRole) {
  return useQuery({
    queryKey: ['group-permissions', groupId, role],
    queryFn: async () => {
      if (!role) return null;
      
      const { data, error } = await supabase
        .from('group_role_permissions')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', role)
        .single();
      
      if (error) throw error;
      return data as GroupRolePermissions;
    },
    enabled: !!groupId && !!role,
  });
}

// Create group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateGroupData) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data: group, error } = await supabase
        .from('groups')
        .insert({
          ...data,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return group as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Tạo group thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo group');
    },
  });
}

// Update group
export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: Partial<Group> }) => {
      const { data: group, error } = await supabase
        .from('groups')
        .update(data)
        .eq('id', groupId)
        .select()
        .single();
      
      if (error) throw error;
      return group as Group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', group.slug] });
      toast.success('Cập nhật group thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật group');
    },
  });
}

// Join group
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ groupId, joinCode }: { groupId: string; joinCode?: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Check group join requirements
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      
      if (groupError) throw groupError;
      
      // Check join code if required
      if (group.join_type === 'code' && group.join_code !== joinCode) {
        throw new Error('Mã tham gia không đúng');
      }
      
      // If approval required, create join request instead
      if (group.join_type === 'approval') {
        const { error } = await supabase
          .from('group_join_requests')
          .insert({
            group_id: groupId,
            user_id: user.id,
          });
        
        if (error) throw error;
        return { type: 'request' as const };
      }
      
      // Handle entry fee if any - MUST deduct from user balance first
      if (group.entry_fee > 0) {
        // Check user balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        const currentBalance = profile?.balance || 0;
        if (currentBalance < group.entry_fee) {
          throw new Error(`Số dư không đủ. Cần ${group.entry_fee.toLocaleString()}đ để tham gia nhóm này.`);
        }
        
        // Deduct from user balance
        const { error: deductError } = await supabase
          .from('profiles')
          .update({ balance: currentBalance - group.entry_fee })
          .eq('user_id', user.id);
        
        if (deductError) throw deductError;
        
        // Record user's wallet transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            amount: -group.entry_fee,
            type: 'withdraw',
            description: `Phí vào nhóm: ${group.name}`,
            status: 'completed',
          });
      }
      
      // Direct join
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });
      
      if (error) throw error;
      
      // Record group wallet income if there was an entry fee
      if (group.entry_fee > 0) {
        await supabase
          .from('group_wallet_transactions')
          .insert({
            group_id: groupId,
            amount: group.entry_fee,
            type: 'income',
            category: 'entry_fee',
            user_id: user.id,
            description: 'Phí vào group',
          });
      }
      
      return { type: 'joined' as const };
    },
    onSuccess: (result, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      
      if (result.type === 'request') {
        toast.success('Yêu cầu tham gia đã được gửi!');
      } else {
        toast.success('Đã tham gia group!');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tham gia group');
    },
  });
}

// Leave group
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã rời khỏi group!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể rời group');
    },
  });
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      groupId, 
      role 
    }: { 
      memberId: string; 
      groupId: string; 
      role: GroupMemberRole;
    }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã cập nhật vai trò!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật vai trò');
    },
  });
}

// Remove member
export function useRemoveMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, groupId }: { memberId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã xóa thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa thành viên');
    },
  });
}

// Search groups
export function useSearchGroups(query: string) {
  return useQuery({
    queryKey: ['groups-search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('visibility', 'public')
        .ilike('name', `%${query}%`)
        .order('member_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Group[];
    },
    enabled: query.length >= 2,
  });
}

// Join requests management
export function useGroupJoinRequests(groupId: string) {
  return useQuery({
    queryKey: ['group-join-requests', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Fetch user profiles
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(req => ({
        ...req,
        user: profileMap.get(req.user_id) || null,
      }));
    },
    enabled: !!groupId,
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ requestId, groupId, userId }: { requestId: string; groupId: string; userId: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Update request status
      await supabase
        .from('group_join_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      
      // Add member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã duyệt yêu cầu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể duyệt yêu cầu');
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ requestId, groupId, reason }: { requestId: string; groupId: string; reason?: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('group_join_requests')
        .update({ 
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq('id', requestId);
      
      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', groupId] });
      toast.success('Đã từ chối yêu cầu!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể từ chối yêu cầu');
    },
  });
}

// Get reported content for a group
export function useGroupReportedContent(groupId: string) {
  return useQuery({
    queryKey: ['group-reported-content', groupId],
    queryFn: async () => {
      // Get reports for posts in this group
      const { data: postReports, error: postError } = await supabase
        .from('post_reports')
        .select('*')
        .eq('post_type', 'group_post')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (postError) throw postError;
      
      // Filter by group_id in post if exists
      // Since post_reports may not have group_id, we need to join with group_posts
      const { data: groupPostIds } = await supabase
        .from('group_posts')
        .select('id')
        .eq('group_id', groupId);
      
      const validPostIds = new Set(groupPostIds?.map(p => p.id) || []);
      const filteredReports = postReports?.filter(r => validPostIds.has(r.post_id)) || [];
      
      return filteredReports;
    },
    enabled: !!groupId,
  });
}

// Get pending posts for approval
export function useGroupPendingPosts(groupId: string) {
  return useQuery({
    queryKey: ['group-pending-posts', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_hidden', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Fetch author profiles
      const authorIds = [...new Set(data.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(post => ({
        ...post,
        author: profileMap.get(post.author_id) || null,
      }));
    },
    enabled: !!groupId,
  });
}

// Approve pending post
export function useApproveGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId }: { postId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_posts')
        .update({ is_hidden: false })
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-pending-posts', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('Đã duyệt bài viết!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể duyệt bài');
    },
  });
}

// Get group activity log - simplified since table may not exist
export function useGroupActivityLog(groupId: string) {
  return useQuery({
    queryKey: ['group-activity-log', groupId],
    queryFn: async () => {
      // For now, return empty array since group_activity_logs table may not exist
      // This can be enhanced later when the table is created
      return [] as { id: string; action: string; user_id: string; created_at: string; details?: any; user?: any }[];
    },
    enabled: !!groupId,
  });
}

// Mute member
export function useMuteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      memberId, 
      groupId, 
      mutedUntil 
    }: { 
      memberId: string; 
      groupId: string; 
      mutedUntil: string;
    }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ muted_until: mutedUntil })
        .eq('id', memberId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã tắt tiếng thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tắt tiếng');
    },
  });
}

// Unmute member
export function useUnmuteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, groupId }: { memberId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ muted_until: null })
        .eq('id', memberId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Đã bỏ tắt tiếng thành viên!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể bỏ tắt tiếng');
    },
  });
}

// Pause group (owner only)
export function usePauseGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, isPaused }: { groupId: string; isPaused: boolean }) => {
      const { error } = await supabase
        .from('groups')
        .update({ 
          settings: {
            is_paused: isPaused,
            paused_at: isPaused ? new Date().toISOString() : null,
          } as unknown as Json
        })
        .eq('id', groupId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã cập nhật trạng thái nhóm!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật trạng thái');
    },
  });
}

// Delete group (owner only)
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      // Delete all group members first
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);
      
      // Delete all group posts
      await supabase
        .from('group_posts')
        .delete()
        .eq('group_id', groupId);
      
      // Delete the group
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã xóa nhóm!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa nhóm');
    },
  });
}

// Toggle member notification
export function useToggleGroupMute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ groupId, isMuted }: { groupId: string; isMuted: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Get current membership
      const { data: membership, error: fetchError } = await supabase
        .from('group_members')
        .select('id, muted_until')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('group_members')
        .update({ 
          muted_until: isMuted ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() : null 
        })
        .eq('id', membership.id);
      
      if (error) throw error;
      return { groupId, isMuted };
    },
    onSuccess: ({ groupId, isMuted }) => {
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      toast.success(isMuted ? 'Đã tắt thông báo' : 'Đã bật thông báo');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật thông báo');
    },
  });
}

// Pin group post
export function usePinGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId, isPinned }: { postId: string; groupId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('group_posts')
        .update({ is_pinned: isPinned })
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('Đã cập nhật bài ghim!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể ghim bài');
    },
  });
}

// Lock group post (prevent comments)
export function useLockGroupPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId, isLocked }: { postId: string; groupId: string; isLocked: boolean }) => {
      const { error } = await supabase
        .from('group_posts')
        .update({ is_locked: isLocked })
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('Đã cập nhật trạng thái bình luận!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể khóa bình luận');
    },
  });
}
