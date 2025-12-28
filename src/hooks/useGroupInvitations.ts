import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_user_id: string | null;
  invite_code: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  group?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  inviter?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Get pending invitations for current user
export function useMyInvitations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('invited_user_id', user.id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch group info
      const groupIds = [...new Set(data.map(i => i.group_id))];
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, avatar_url')
        .in('id', groupIds);

      // Fetch inviter profiles
      const inviterIds = [...new Set(data.map(i => i.invited_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', inviterIds);

      const groupMap = new Map(groups?.map(g => [g.id, g]) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(inv => ({
        ...inv,
        group: groupMap.get(inv.group_id),
        inviter: profileMap.get(inv.invited_by),
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
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingMember) {
        throw new Error('Người này đã là thành viên của nhóm');
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from('group_invitations')
        .select('id')
        .eq('group_id', groupId)
        .eq('invited_user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();

      if (existingInvite) {
        throw new Error('Đã có lời mời đang chờ xử lý');
      }

      const { error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          invited_by: user.id,
          invited_user_id: userId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      const { data: invitation, error: invError } = await supabase
        .from('group_invitations')
        .select('group_id, invited_user_id')
        .eq('id', invitationId)
        .single();

      if (invError) throw invError;
      if (invitation.invited_user_id !== user.id) {
        throw new Error('Bạn không có quyền chấp nhận lời mời này');
      }

      // Add user to group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      // Delete invitation
      await supabase
        .from('group_invitations')
        .delete()
        .eq('id', invitationId);
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
      const { error } = await supabase
        .from('group_invitations')
        .delete()
        .eq('id', invitationId);

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
    mutationFn: async ({ groupId, maxUses, expiresInDays }: { 
      groupId: string; 
      maxUses?: number;
      expiresInDays?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          invited_by: user.id,
          invite_code: inviteCode,
          max_uses: maxUses || null,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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

      const { data: invitation, error } = await supabase
        .from('group_invitations')
        .select('id, group_id, max_uses, used_count, expires_at')
        .eq('invite_code', code.toUpperCase())
        .single();

      if (error) throw new Error('Mã mời không hợp lệ');
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error('Mã mời đã hết hạn');
      }
      if (invitation.max_uses && invitation.used_count >= invitation.max_uses) {
        throw new Error('Mã mời đã hết lượt sử dụng');
      }

      // Check if already member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invitation.group_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingMember) {
        throw new Error('Bạn đã là thành viên của nhóm này');
      }

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      // Increment used count
      await supabase
        .from('group_invitations')
        .update({ used_count: invitation.used_count + 1 })
        .eq('id', invitation.id);

      return invitation.group_id;
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
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('is_active', true);

      const memberIds = members?.map(m => m.user_id) || [];

      // Search users
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out existing members
      return (data || []).filter(u => !memberIds.includes(u.user_id));
    },
    enabled: query.length >= 2,
  });
}
