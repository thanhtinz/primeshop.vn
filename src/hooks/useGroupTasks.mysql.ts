// Hooks for Group Tasks - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TaskStatus = 'pending' | 'doing' | 'done' | 'cancelled';

export interface GroupTask {
  id: string;
  groupId: string;
  postId: string | null;
  title: string;
  description: string | null;
  createdBy: string;
  assignedTo: string[] | null;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: TaskStatus;
  priority: number;
  rewardPoints: number;
  rewardAmount: number;
  penaltyPoints: number;
  penaltyAmount: number;
  proofRequired: boolean;
  attachments: any[];
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  assignees?: Array<{
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  }>;
  // Legacy mappings
  group_id?: string;
  post_id?: string | null;
  created_by?: string;
  assigned_to?: string[] | null;
  started_at?: string | null;
  completed_at?: string | null;
  reward_points?: number;
  reward_amount?: number;
  penalty_points?: number;
  penalty_amount?: number;
  proof_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskData {
  group_id: string;
  title: string;
  description?: string;
  assigned_to?: string[];
  deadline?: string;
  priority?: number;
  reward_points?: number;
  reward_amount?: number;
  penalty_points?: number;
  penalty_amount?: number;
  proof_required?: boolean;
}

const mapTaskToLegacy = (t: any): GroupTask => ({
  ...t,
  group_id: t.groupId,
  post_id: t.postId,
  created_by: t.createdBy,
  assigned_to: t.assignedTo,
  started_at: t.startedAt,
  completed_at: t.completedAt,
  reward_points: t.rewardPoints,
  reward_amount: t.rewardAmount,
  penalty_points: t.penaltyPoints,
  penalty_amount: t.penaltyAmount,
  proof_required: t.proofRequired,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  creator: t.creator ? {
    full_name: t.creator.fullName,
    avatar_url: t.creator.avatarUrl,
  } : null,
  assignees: t.assignees?.map((a: any) => ({
    id: a.id,
    full_name: a.fullName,
    avatar_url: a.avatarUrl,
  })),
});

// Fetch group tasks
export function useGroupTasks(groupId: string, status?: TaskStatus) {
  return useQuery({
    queryKey: ['group-tasks', groupId, status],
    queryFn: async () => {
      let query = db
        .from<any>('group_tasks')
        .select('*')
        .eq('groupId', groupId)
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupTask[];

      // Fetch creator profiles
      const creatorIds = [...new Set(data.map((t: any) => t.createdBy))];
      const { data: creatorProfiles } = await db
        .from<any>('profiles')
        .select('id, fullName, avatarUrl')
        .in('id', creatorIds);

      const creatorMap = new Map(creatorProfiles?.map((p: any) => [p.id, p]) || []);

      // Fetch all assignee profiles
      const allAssignees = new Set<string>();
      data.forEach((task: any) => {
        task.assignedTo?.forEach((id: string) => allAssignees.add(id));
      });

      let assigneeMap = new Map<string, any>();
      if (allAssignees.size > 0) {
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', Array.from(allAssignees));

        assigneeMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      }

      return data.map((task: any) => ({
        ...mapTaskToLegacy(task),
        creator: creatorMap.get(task.createdBy) || null,
        assignees: task.assignedTo?.map((id: string) => assigneeMap.get(id)).filter(Boolean) || [],
      })) as GroupTask[];
    },
    enabled: !!groupId,
  });
}

// Fetch my tasks
export function useMyGroupTasks(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-group-tasks', groupId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Note: MySQL doesn't have array contains, so we need a different approach
      // This assumes assignedTo is stored as JSON array
      const { data, error } = await db
        .from<any>('group_tasks')
        .select('*')
        .eq('groupId', groupId)
        .order('deadline', { ascending: true });

      if (error) throw error;

      // Filter tasks assigned to current user
      const myTasks = data?.filter((t: any) => 
        t.assignedTo && Array.isArray(t.assignedTo) && t.assignedTo.includes(user.id)
      ) || [];

      // Fetch creator profiles
      if (myTasks.length > 0) {
        const creatorIds = [...new Set(myTasks.map((t: any) => t.createdBy))];
        const { data: profiles } = await db
          .from<any>('profiles')
          .select('id, fullName, avatarUrl')
          .in('id', creatorIds);

        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

        return myTasks.map((task: any) => ({
          ...mapTaskToLegacy(task),
          creator: profileMap.get(task.createdBy) || null,
        })) as GroupTask[];
      }

      return myTasks.map(mapTaskToLegacy) as GroupTask[];
    },
    enabled: !!groupId && !!user,
  });
}

// Create task
export function useCreateGroupTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!user) throw new Error('Must be logged in');

      const { data: task, error } = await db
        .from('group_tasks')
        .insert({
          groupId: data.group_id,
          title: data.title,
          description: data.description,
          assignedTo: data.assigned_to,
          deadline: data.deadline,
          priority: data.priority || 0,
          rewardPoints: data.reward_points || 0,
          rewardAmount: data.reward_amount || 0,
          penaltyPoints: data.penalty_points || 0,
          penaltyAmount: data.penalty_amount || 0,
          proofRequired: data.proof_required || false,
          createdBy: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return mapTaskToLegacy(task) as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.groupId] });
      toast.success('Đã tạo task!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo task');
    },
  });
}

// Update task
export function useUpdateGroupTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<GroupTask> }) => {
      const updates: any = {};
      if (data.title) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.assignedTo || data.assigned_to) updates.assignedTo = data.assignedTo || data.assigned_to;
      if (data.deadline !== undefined) updates.deadline = data.deadline;
      if (data.priority !== undefined) updates.priority = data.priority;
      if (data.rewardPoints || data.reward_points) updates.rewardPoints = data.rewardPoints || data.reward_points;
      if (data.rewardAmount || data.reward_amount) updates.rewardAmount = data.rewardAmount || data.reward_amount;
      if (data.penaltyPoints || data.penalty_points) updates.penaltyPoints = data.penaltyPoints || data.penalty_points;
      if (data.penaltyAmount || data.penalty_amount) updates.penaltyAmount = data.penaltyAmount || data.penalty_amount;
      if (data.proofRequired !== undefined || data.proof_required !== undefined) {
        updates.proofRequired = data.proofRequired ?? data.proof_required;
      }
      if (data.status) updates.status = data.status;

      const { data: task, error } = await db
        .from('group_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return mapTaskToLegacy(task) as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.groupId] });
      toast.success('Đã cập nhật task!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật task');
    },
  });
}

// Update task status
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      groupId,
      status,
    }: {
      taskId: string;
      groupId: string;
      status: TaskStatus;
    }) => {
      const updates: any = { status };

      if (status === 'doing') {
        updates.startedAt = new Date().toISOString();
      } else if (status === 'done') {
        updates.completedAt = new Date().toISOString();
      }

      const { data: task, error } = await db
        .from<any>('group_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // If completed, handle rewards
      if (status === 'done' && task.assignedTo?.length > 0 && task.rewardPoints > 0) {
        const rewardPoints = Math.floor(task.rewardPoints / task.assignedTo.length);

        for (const userId of task.assignedTo) {
          await db.from('group_contribution_history').insert({
            groupId,
            userId,
            pointsChange: rewardPoints,
            reason: `Hoàn thành task: ${task.title}`,
            referenceType: 'task',
            referenceId: taskId,
          });
        }
      }

      return mapTaskToLegacy(task) as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', task.groupId] });
      toast.success('Đã cập nhật trạng thái!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể cập nhật');
    },
  });
}

// Delete task
export function useDeleteGroupTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, groupId }: { taskId: string; groupId: string }) => {
      const { error } = await db.from('group_tasks').delete().eq('id', taskId);
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', groupId] });
      toast.success('Đã xóa task!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa task');
    },
  });
}
