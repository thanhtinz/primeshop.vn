import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GroupLastView {
  id: string;
  user_id: string;
  group_id: string;
  last_viewed_at: string;
  created_at: string;
}

// Fetch last views for all joined groups
export function useGroupLastViews() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['group-last-views', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('group_last_views')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as GroupLastView[];
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
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];
      
      const groupIds = memberships.map(m => m.group_id);
      
      // Get groups info
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      
      if (groupsError) throw groupsError;
      if (!groups) return [];
      
      // Get last views for these groups
      const { data: lastViews } = await supabase
        .from('group_last_views')
        .select('group_id, last_viewed_at')
        .eq('user_id', user.id)
        .in('group_id', groupIds);
      
      const lastViewMap = new Map(
        lastViews?.map(v => [v.group_id, v.last_viewed_at]) || []
      );
      
      // Get user's custom order
      const { data: customOrder } = await supabase
        .from('user_group_orders')
        .select('group_id, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      const orderMap = new Map(
        customOrder?.map(o => [o.group_id, o.sort_order]) || []
      );
      
      // For each group, count posts since last view
      const groupsWithUnread = await Promise.all(
        groups.map(async (group) => {
          const lastViewedAt = lastViewMap.get(group.id);
          
          let unreadCount = 0;
          if (lastViewedAt) {
            // Count posts after last view
            const { count } = await supabase
              .from('group_posts')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id)
              .gt('created_at', lastViewedAt);
            
            unreadCount = count || 0;
          }
          // If never viewed, unreadCount stays 0 (user hasn't visited yet, so we don't show as "new")
          
          return {
            ...group,
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
        return (b.member_count || 0) - (a.member_count || 0);
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
      
      const { error } = await supabase
        .from('group_last_views')
        .upsert(
          {
            user_id: user.id,
            group_id: groupId,
            last_viewed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,group_id',
          }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-last-views'] });
      queryClient.invalidateQueries({ queryKey: ['joined-groups-with-unread'] });
    },
  });
}
