// Hooks for Group Invitations - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedUserId: string | null;
  inviteCode: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  group?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  inviter?: {
    fullName: string | null;
    avatarUrl: string | null;
  };
  // Legacy mappings
  group_id?: string;
  invited_by?: string;
  invited_user_id?: string | null;
  invite_code?: string | null;
  max_uses?: number | null;
  used_count?: number;
  expires_at?: string | null;
  created_at?: string;
}

const mapInvitationToLegacy = (inv: any): GroupInvitation => ({
  ...inv,
  group_id: inv.groupId,
  invited_by: inv.invitedBy,
  invited_user_id: inv.invitedUserId,
  invite_code: inv.inviteCode,
  max_uses: inv.maxUses,
  used_count: inv.usedCount,
  expires_at: inv.expiresAt,
  created_at: inv.createdAt,
  group: inv.group ? {
    id: inv.group.id,
    name: inv.group.name,
    avatar_url: inv.group.avatarUrl,
  } : undefined,
  inviter: inv.inviter ? {
    full_name: inv.inviter.fullName,
    avatar_url: inv.inviter.avatarUrl,
  } : undefined,
});

// Get pending invitations for current user
export function useMyInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await db
        .from<any>('group_invitations')
        .select('*')
        .eq('invitedUserId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Filter valid invitations (not expired)
      const now = new Date().toISOString();
      const validInvitations = data.filter((i: any) => !i.expiresAt || i.expiresAt > now);

      // Fetch group info
      const groupIds = [...new Set(validInvitations.map((i: any) => i.groupId))];
      const { data: groups } = await db
        .from<any>('groups')
        .select('id, name, avatarUrl')
        .in('id', groupIds);

      // Fetch inviter profiles
      const inviterIds = [...new Set(validInvitations.map((i: any) => i.invitedBy))];
      const { data: profiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', inviterIds);

      const groupMap = new Map(groups?.map((g: any) => [g.id, g]) || []);
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      return validInvitations.map((inv: any) => ({
        ...mapInvitationToLegacy(inv),
        group: groupMap.get(inv.groupId),
        inviter: profileMap.get(inv.invitedBy),
      })) as GroupInvitation[];
    },
    enabled: !!user,
  });
}

// Invite a user to a group
export function useInviteToGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if user is already a member
      const { data: existingMember } = await db
        .from<any>('group_members')
        .select('id')
        .eq('groupId', groupId)
        .eq('userId', userId)
        .eq('isActive', true)
        .single();

      if (existingMember) {
        throw new Error('Người này đã là thành viên của nhóm');
      }

      // Check for existing pending invitation
      const { data: existingInvites } = await db
        .from<any>('group_invitations')
        .select('id, expiresAt')
        .eq('groupId', groupId)
        .eq('invitedUserId', userId);

      const now = new Date().toISOString();
      const pendingInvite = existingInvites?.find(
        (i: any) => !i.expiresAt || i.expiresAt > now
      );

      if (pendingInvite) {
        throw new Error('Đã có lời mời đang chờ xử lý');
      }

      const { error } = await db.from('group_invitations').insert({
        groupId,
        invitedBy: user.id,
        invitedUserId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
      toast.success('Đã gửi lời mời!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể gửi lời mời');
    },
  });
}

// Accept invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Get invitation details
      const { data: invitation, error: invError } = await db
        .from<any>('group_invitations')
        .select('groupId, invitedUserId')
        .eq('id', invitationId)
        .single();

      if (invError) throw invError;
      if (invitation.invitedUserId !== user.id) {
        throw new Error('Bạn không có quyền chấp nhận lời mời này');
      }

      // Add user to group
      const { error: joinError } = await db.from('group_members').insert({
        groupId: invitation.groupId,
        userId: user.id,
        role: 'member',
      });

      if (joinError) throw joinError;

      // Delete invitation
      await db.from('group_invitations').delete().eq('id', invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Đã tham gia nhóm!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể chấp nhận lời mời');
    },
  });
}

// Decline invitation
export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await db.from('group_invitations').delete().eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-group-invitations'] });
      toast.success('Đã từ chối lời mời');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể từ chối lời mời');
    },
  });
}

// Create invite link
export function useCreateInviteLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      groupId,
      maxUses,
      expiresInDays,
    }: {
      groupId: string;
      maxUses?: number;
      expiresInDays?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await db
        .from('group_invitations')
        .insert({
          groupId,
          invitedBy: user.id,
          inviteCode,
          maxUses: maxUses || null,
          expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return mapInvitationToLegacy(data);
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations', groupId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo link mời');
    },
  });
}

// Join by invite code
export function useJoinByInviteCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data: invitations, error } = await db
        .from<any>('group_invitations')
        .select('id, groupId, maxUses, usedCount, expiresAt')
        .eq('inviteCode', code.toUpperCase());

      if (error || !invitations?.length) {
        throw new Error('Mã mời không hợp lệ');
      }

      const invitation = invitations[0];

      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        throw new Error('Mã mời đã hết hạn');
      }
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        throw new Error('Mã mời đã hết lượt sử dụng');
      }

      // Check if already member
      const { data: existingMember } = await db
        .from<any>('group_members')
        .select('id')
        .eq('groupId', invitation.groupId)
        .eq('userId', user.id)
        .eq('isActive', true)
        .single();

      if (existingMember) {
        throw new Error('Bạn đã là thành viên của nhóm này');
      }

      // Join group
      const { error: joinError } = await db.from('group_members').insert({
        groupId: invitation.groupId,
        userId: user.id,
        role: 'member',
      });

      if (joinError) throw joinError;

      // Increment used count
      await db
        .from('group_invitations')
        .update({ usedCount: invitation.usedCount + 1 })
        .eq('id', invitation.id);

      return invitation.groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-membership', groupId] });
      toast.success('Đã tham gia nhóm!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tham gia nhóm');
    },
  });
}

// Search users to invite
export function useSearchUsersToInvite(query: string, groupId: string) {
  return useQuery({
    queryKey: ['search-users-invite', query, groupId],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      // Get current members
      const { data: members } = await db
        .from<any>('group_members')
        .select('userId')
        .eq('groupId', groupId)
        .eq('isActive', true);

      const memberIds = members?.map((m: any) => m.userId) || [];

      // Search users - note: MySQL search would need LIKE operator
      const { data, error } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl, email')
        .limit(50);

      if (error) throw error;

      // Filter by query and exclude existing members
      const filtered = (data || [])
        .filter((u: any) => {
          const matchesQuery =
            u.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            u.email?.toLowerCase().includes(query.toLowerCase());
          const notMember = !memberIds.includes(u.id);
          return matchesQuery && notMember;
        })
        .slice(0, 10);

      // Map to legacy format
      return filtered.map((u: any) => ({
        ...u,
        user_id: u.id,
        full_name: u.fullName,
        avatar_url: u.avatarUrl,
      }));
    },
    enabled: query.length >= 2,
  });
}
