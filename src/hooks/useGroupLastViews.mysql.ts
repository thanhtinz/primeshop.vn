// Hooks for Group Last Views - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface GroupLastView {
  id: string;
  userId: string;
  groupId: string;
  lastViewedAt: string;
  createdAt: string;
  // Legacy mappings
  user_id?: string;
  group_id?: string;
  last_viewed_at?: string;
  created_at?: string;
}

const mapToLegacy = (v: any): GroupLastView => ({
  ...v,
  user_id: v.userId,
  group_id: v.groupId,
  last_viewed_at: v.lastViewedAt,
  created_at: v.createdAt,
});

// Fetch last views for all joined groups
export function useGroupLastViews() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-last-views', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await db
        .from<any>('group_last_views')
        .select('*')
        .eq('userId', user.id);

      if (error) throw error;
      return (data || []).map(mapToLegacy) as GroupLastView[];
    },
    enabled: !!user,
  });
}

// Fetch joined groups with unread post counts and custom order
export function useJoinedGroupsWithUnread() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['joined-groups-with-unread', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's joined groups
      const { data: memberships, error: membershipError } = await db
        .from<any>('group_members')
        .select('groupId')
        .eq('userId', user.id)
        .eq('isActive', true);

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m: any) => m.groupId);

      // Get groups info
      const { data: groups, error: groupsError } = await db
        .from<any>('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;
      if (!groups) return [];

      // Get last views for these groups
      const { data: lastViews } = await db
        .from<any>('group_last_views')
        .select('groupId, lastViewedAt')
        .eq('userId', user.id)
        .in('groupId', groupIds);

      const lastViewMap = new Map(
        lastViews?.map((v: any) => [v.groupId, v.lastViewedAt]) || []
      );

      // Get user's custom order
      const { data: customOrder } = await db
        .from<any>('user_group_orders')
        .select('groupId, sortOrder')
        .eq('userId', user.id)
        .order('sortOrder', { ascending: true });

      const orderMap = new Map(
        customOrder?.map((o: any) => [o.groupId, o.sortOrder]) || []
      );

      // For each group, count posts since last view
      const groupsWithUnread = await Promise.all(
        groups.map(async (group: any) => {
          const lastViewedAt = lastViewMap.get(group.id);

          let unreadCount = 0;
          if (lastViewedAt) {
            // Count posts after last view
            const { data: posts } = await db
              .from<any>('group_posts')
              .select('id')
              .eq('groupId', group.id)
              .gt('createdAt', lastViewedAt);

            unreadCount = posts?.length || 0;
          }
          // If never viewed, unreadCount stays 0

          return {
            ...group,
            // Legacy mappings
            avatar_url: group.avatarUrl,
            member_count: group.memberCount,
            created_at: group.createdAt,
            updated_at: group.updatedAt,
            unread_count: unreadCount,
          };
        })
      );

      // Sort by custom order if available, otherwise by member_count
      groupsWithUnread.sort((a, b) => {
        const orderA = orderMap.get(a.id);
        const orderB = orderMap.get(b.id);

        // If both have custom order, use it
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }
        // If only one has custom order, prioritize it
        if (orderA !== undefined) return -1;
        if (orderB !== undefined) return 1;
        // Otherwise sort by member_count
        return (b.memberCount || b.member_count || 0) - (a.memberCount || a.member_count || 0);
      });

      return groupsWithUnread;
    },
    enabled: !!user,
  });
}

// Update last view time for a group
export function useUpdateGroupLastView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Try to update existing record first
      const { data: existing } = await db
        .from<any>('group_last_views')
        .select('id')
        .eq('userId', user.id)
        .eq('groupId', groupId)
        .single();

      if (existing) {
        const { error } = await db
          .from('group_last_views')
          .update({ lastViewedAt: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await db.from('group_last_views').insert({
          userId: user.id,
          groupId,
          lastViewedAt: new Date().toISOString(),
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-last-views'] });
      queryClient.invalidateQueries({ queryKey: ['joined-groups-with-unread'] });
    },
  });
}
