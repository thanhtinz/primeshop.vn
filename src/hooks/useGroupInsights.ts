import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface GroupInsights {
  memberStats: {
    total: number;
    active: number;
    newThisWeek: number;
    topContributors: Array<{
      user_id: string;
      full_name: string | null;
      avatar_url: string | null;
      contribution_points: number;
    }>;
  };
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    doing: number;
    completionRate: number;
  };
  dealStats: {
    total: number;
    active: number;
    completed: number;
    totalPool: number;
  };
  walletStats: {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: number;
  };
  activityStats: {
    postsThisWeek: number;
    commentsThisWeek: number;
    proofsSubmitted: number;
  };
}

export function useGroupInsights(groupId: string) {
  return useQuery({
    queryKey: ['group-insights', groupId],
    queryFn: async (): Promise<GroupInsights> => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      
      // Fetch member stats
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, contribution_points, is_active, joined_at')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('contribution_points', { ascending: false });
      
      const totalMembers = members?.length || 0;
      const newThisWeek = members?.filter(m => m.joined_at >= weekAgo).length || 0;
      
      // Fetch top contributor profiles
      const topMemberIds = members?.slice(0, 5).map(m => m.user_id) || [];
      let topContributors: GroupInsights['memberStats']['topContributors'] = [];
      
      if (topMemberIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', topMemberIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        topContributors = members?.slice(0, 5).map(m => ({
          user_id: m.user_id,
          full_name: profileMap.get(m.user_id)?.full_name || null,
          avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
          contribution_points: m.contribution_points,
        })) || [];
      }
      
      // Fetch task stats
      const { data: tasks } = await supabase
        .from('group_tasks')
        .select('status')
        .eq('group_id', groupId);
      
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
      const doingTasks = tasks?.filter(t => t.status === 'doing').length || 0;
      
      // Fetch deal stats
      const { data: deals } = await supabase
        .from('group_deals')
        .select('status, total_pool')
        .eq('group_id', groupId);
      
      const totalDeals = deals?.length || 0;
      const activeDeals = deals?.filter(d => d.status === 'open' || d.status === 'in_progress').length || 0;
      const completedDeals = deals?.filter(d => d.status === 'completed').length || 0;
      const totalPool = deals?.reduce((sum, d) => sum + Number(d.total_pool || 0), 0) || 0;
      
      // Fetch wallet stats
      const { data: wallet } = await supabase
        .from('group_wallets')
        .select('*')
        .eq('group_id', groupId)
        .single();
      
      const { count: recentTxCount } = await supabase
        .from('group_wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('created_at', weekAgo);
      
      // Fetch activity stats
      const { count: postsThisWeek } = await supabase
        .from('group_posts')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('created_at', weekAgo);
      
      const { data: postIds } = await supabase
        .from('group_posts')
        .select('id')
        .eq('group_id', groupId);
      
      let commentsThisWeek = 0;
      if (postIds && postIds.length > 0) {
        const { count } = await supabase
          .from('group_post_comments')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds.map(p => p.id))
          .gte('created_at', weekAgo);
        commentsThisWeek = count || 0;
      }
      
      const { count: proofsSubmitted } = await supabase
        .from('group_proofs')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .gte('created_at', weekAgo);
      
      return {
        memberStats: {
          total: totalMembers,
          active: totalMembers,
          newThisWeek,
          topContributors,
        },
        taskStats: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          doing: doingTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        dealStats: {
          total: totalDeals,
          active: activeDeals,
          completed: completedDeals,
          totalPool,
        },
        walletStats: {
          balance: Number(wallet?.balance || 0),
          totalIncome: Number(wallet?.total_income || 0),
          totalExpense: Number(wallet?.total_expense || 0),
          recentTransactions: recentTxCount || 0,
        },
        activityStats: {
          postsThisWeek: postsThisWeek || 0,
          commentsThisWeek,
          proofsSubmitted: proofsSubmitted || 0,
        },
      };
    },
    enabled: !!groupId,
  });
}

// Activity chart data
export function useGroupActivityChart(groupId: string, days = 7) {
  return useQuery({
    queryKey: ['group-activity-chart', groupId, days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      const { data: posts } = await supabase
        .from('group_posts')
        .select('created_at')
        .eq('group_id', groupId)
        .gte('created_at', startDate.toISOString());
      
      const { data: taskUpdates } = await supabase
        .from('group_tasks')
        .select('updated_at')
        .eq('group_id', groupId)
        .gte('updated_at', startDate.toISOString());
      
      // Group by day
      const dailyData: Record<string, { posts: number; tasks: number }> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyData[date] = { posts: 0, tasks: 0 };
      }
      
      posts?.forEach(p => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].posts++;
        }
      });
      
      taskUpdates?.forEach(t => {
        const date = format(new Date(t.updated_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].tasks++;
        }
      });
      
      return Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .reverse();
    },
    enabled: !!groupId,
  });
}
