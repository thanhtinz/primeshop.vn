import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TaskStatus = 'pending' | 'doing' | 'done' | 'cancelled';

export interface GroupTask {
  id: string;
  group_id: string;
  post_id: string | null;
  title: string;
  description: string | null;
  created_by: string;
  assigned_to: string[] | null;
  deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: TaskStatus;
  priority: number;
  reward_points: number;
  reward_amount: number;
  penalty_points: number;
  penalty_amount: number;
  proof_required: boolean;
  attachments: any[];
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  assignees?: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
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

// Fetch group tasks
export function useGroupTasks(groupId: string, status?: TaskStatus) {
  return useQuery({
    queryKey: ['group-tasks', groupId, status],
    queryFn: async () => {
      let query = supabase
        .from('group_tasks')
        .select('*')
        .eq('group_id', groupId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [] as GroupTask[];
      
      // Fetch creator profiles
      const creatorIds = [...new Set(data.map(t => t.created_by))];
      const { data: creatorProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', creatorIds);
      
      const creatorMap = new Map(creatorProfiles?.map(p => [p.id, p]) || []);
      
      // Fetch all assignee profiles
      const allAssignees = new Set<string>();
      data.forEach(task => {
        task.assigned_to?.forEach((id: string) => allAssignees.add(id));
      });
      
      let assigneeMap = new Map<string, any>();
      if (allAssignees.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(allAssignees));
        
        assigneeMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }
      
      return data.map(task => ({
        ...task,
        creator: creatorMap.get(task.created_by) || null,
        assignees: task.assigned_to?.map((id: string) => assigneeMap.get(id)).filter(Boolean) || [],
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
      
      const { data, error } = await supabase
        .from('group_tasks')
        .select('*')
        .eq('group_id', groupId)
        .contains('assigned_to', [user.id])
        .order('deadline', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      
      // Fetch creator profiles
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(t => t.created_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return data.map(task => ({
          ...task,
          creator: profileMap.get(task.created_by) || null,
        })) as GroupTask[];
      }
      
      return data as GroupTask[];
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
      
      const { data: task, error } = await supabase
        .from('group_tasks')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return task as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.group_id] });
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
    mutationFn: async ({ 
      taskId, 
      data 
    }: { 
      taskId: string; 
      data: Partial<GroupTask>;
    }) => {
      const { data: task, error } = await supabase
        .from('group_tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return task as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.group_id] });
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
      status 
    }: { 
      taskId: string;
      groupId: string;
      status: TaskStatus;
    }) => {
      const updates: any = { status };
      
      if (status === 'doing') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'done') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { data: task, error } = await supabase
        .from('group_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      
      // If completed, handle rewards
      if (status === 'done' && task.assigned_to?.length > 0 && task.reward_points > 0) {
        const rewardPoints = Math.floor(task.reward_points / task.assigned_to.length);
        
        for (const userId of task.assigned_to) {
          await supabase.from('group_contribution_history').insert({
            group_id: groupId,
            user_id: userId,
            points_change: rewardPoints,
            reason: `Hoàn thành task: ${task.title}`,
            reference_type: 'task',
            reference_id: taskId,
          });
        }
      }
      
      return task as GroupTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['group-tasks', task.group_id] });
      queryClient.invalidateQueries({ queryKey: ['group-members', task.group_id] });
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
      const { error } = await supabase
        .from('group_tasks')
        .delete()
        .eq('id', taskId);
      
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
