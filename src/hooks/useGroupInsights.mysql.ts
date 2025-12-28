// Hooks for Group Insights - MySQL version
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { subDays, format } from 'date-fns';

export interface GroupInsights {
  memberStats: {
    total: number;
    active: number;
    newThisWeek: number;
    topContributors: Array<{
      userId: string;
      fullName: string | null;
      avatarUrl: string | null;
      contributionPoints: number;
      // Legacy mappings
      user_id?: string;
      full_name?: string | null;
      avatar_url?: string | null;
      contribution_points?: number;
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
      const { data: members } = await db
        .from<any>('group_members')
        .select('userId, contributionPoints, isActive, joinedAt')
        .eq('groupId', groupId)
        .eq('isActive', true)
        .order('contributionPoints', { ascending: false });

      const totalMembers = members?.length || 0;
      const newThisWeek = members?.filter((m: any) => m.joinedAt >= weekAgo).length || 0;

      // Fetch top contributor profiles
      const topMemberIds = members?.slice(0, 5).map((m: any) => m.userId) || [];
      let topContributors: GroupInsights['memberStats']['topContributors'] = [];

      if (topMemberIds.length > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', topMemberIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

        topContributors = members?.slice(0, 5).map((m: any) => ({
          userId: m.userId,
          fullName: profileMap.get(m.userId)?.fullName || null,
          avatarUrl: profileMap.get(m.userId)?.avatarUrl || null,
          contributionPoints: m.contributionPoints,
          // Legacy mappings
          user_id: m.userId,
          full_name: profileMap.get(m.userId)?.fullName || null,
          avatar_url: profileMap.get(m.userId)?.avatarUrl || null,
          contribution_points: m.contributionPoints,
        })) || [];
      }

      // Fetch task stats
      const { data: tasks } = await db
        .from<any>('group_tasks')
        .select('status')
        .eq('groupId', groupId);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'done').length || 0;
      const pendingTasks = tasks?.filter((t: any) => t.status === 'pending').length || 0;
      const doingTasks = tasks?.filter((t: any) => t.status === 'doing').length || 0;

      // Fetch deal stats
      const { data: deals } = await db
        .from<any>('group_deals')
        .select('status, totalPool')
        .eq('groupId', groupId);

      const totalDeals = deals?.length || 0;
      const activeDeals = deals?.filter((d: any) => d.status === 'open' || d.status === 'in_progress').length || 0;
      const completedDeals = deals?.filter((d: any) => d.status === 'completed').length || 0;
      const totalPool = deals?.reduce((sum: number, d: any) => sum + Number(d.totalPool || 0), 0) || 0;

      // Fetch wallet stats
      const { data: wallet } = await db
        .from<any>('group_wallets')
        .select('*')
        .eq('groupId', groupId)
        .single();

      const { data: recentTx } = await db
        .from<any>('group_wallet_transactions')
        .select('id')
        .eq('groupId', groupId)
        .gte('createdAt', weekAgo);

      const recentTxCount = recentTx?.length || 0;

      // Fetch activity stats
      const { data: recentPosts } = await db
        .from<any>('group_posts')
        .select('id')
        .eq('groupId', groupId)
        .gte('createdAt', weekAgo);

      const postsThisWeek = recentPosts?.length || 0;

      const { data: postIds } = await db
        .from<any>('group_posts')
        .select('id')
        .eq('groupId', groupId);

      let commentsThisWeek = 0;
      if (postIds && postIds.length > 0) {
        const { data: comments } = await db
          .from<any>('group_post_comments')
          .select('id')
          .in('postId', postIds.map((p: any) => p.id))
          .gte('createdAt', weekAgo);

        commentsThisWeek = comments?.length || 0;
      }

      const { data: proofs } = await db
        .from<any>('group_proofs')
        .select('id')
        .eq('groupId', groupId)
        .gte('createdAt', weekAgo);

      const proofsSubmitted = proofs?.length || 0;

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
          totalIncome: Number(wallet?.totalIncome || 0),
          totalExpense: Number(wallet?.totalExpense || 0),
          recentTransactions: recentTxCount,
        },
        activityStats: {
          postsThisWeek,
          commentsThisWeek,
          proofsSubmitted,
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

      const { data: posts } = await db
        .from<any>('group_posts')
        .select('createdAt')
        .eq('groupId', groupId)
        .gte('createdAt', startDate.toISOString());

      const { data: taskUpdates } = await db
        .from<any>('group_tasks')
        .select('updatedAt')
        .eq('groupId', groupId)
        .gte('updatedAt', startDate.toISOString());

      // Group by day
      const dailyData: Record<string, { posts: number; tasks: number }> = {};

      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyData[date] = { posts: 0, tasks: 0 };
      }

      posts?.forEach((p: any) => {
        const date = format(new Date(p.createdAt), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].posts++;
        }
      });

      taskUpdates?.forEach((t: any) => {
        const date = format(new Date(t.updatedAt), 'yyyy-MM-dd');
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
