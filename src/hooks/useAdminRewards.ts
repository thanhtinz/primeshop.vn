import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface CheckinSettings {
  id: string;
  is_enabled: boolean;
  base_points: number;
  streak_bonus_multiplier: number;
  max_streak_bonus: number;
  streak_milestones: { day: number; bonus: number }[];
}

export interface PointsReward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  reward_type: string;
  reward_value: number | null;
  points_cost: number;
  quantity_limit: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  badge_color: string | null;
  requirement_type: string;
  requirement_value: number | null;
  points_reward: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface MilestoneReward {
  id: string;
  day_milestone: number;
  reward_name: string;
  reward_description: string | null;
  reward_type: string;
  reward_value: string | null;
  reward_image_url: string | null;
  bonus_points: number;
  is_active: boolean;
  sort_order: number;
}

// Hooks
export const useCheckinSettingsAdmin = () => {
  return useQuery({
    queryKey: ['admin-checkin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_checkin_settings')
        .select('*')
        .single();
      if (error) throw error;
      return {
        ...data,
        streak_milestones: data.streak_milestones as { day: number; bonus: number }[],
      } as CheckinSettings;
    },
  });
};

export const useUpdateCheckinSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CheckinSettings> }) => {
      const { error } = await supabase
        .from('daily_checkin_settings')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-checkin-settings'] });
      toast.success('Cập nhật cài đặt thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật cài đặt');
    },
  });
};

export const usePointsRewardsAdmin = () => {
  return useQuery({
    queryKey: ['admin-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_rewards')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PointsReward[];
    },
  });
};

export const useSaveReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reward: Partial<PointsReward>) => {
      if (reward.id) {
        const { error } = await supabase.from('points_rewards').update(reward).eq('id', reward.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = reward;
        const { error } = await supabase.from('points_rewards').insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast.success('Lưu phần thưởng thành công');
    },
    onError: () => {
      toast.error('Không thể lưu phần thưởng');
    },
  });
};

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('points_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      toast.success('Xóa phần thưởng thành công');
    },
    onError: () => {
      toast.error('Không thể xóa phần thưởng');
    },
  });
};

export const useAchievementsAdmin = () => {
  return useQuery({
    queryKey: ['admin-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useSaveAchievement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (achievement: Partial<Achievement>) => {
      if (achievement.id) {
        const { error } = await supabase.from('achievements').update(achievement).eq('id', achievement.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = achievement;
        const { error } = await supabase.from('achievements').insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Lưu thành tựu thành công');
    },
    onError: () => {
      toast.error('Không thể lưu thành tựu');
    },
  });
};

export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Xóa thành tựu thành công');
    },
    onError: () => {
      toast.error('Không thể xóa thành tựu');
    },
  });
};

export const useMilestoneRewardsAdmin = () => {
  return useQuery({
    queryKey: ['admin-milestone-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_milestone_rewards')
        .select('*')
        .order('day_milestone', { ascending: true });
      if (error) throw error;
      return data as MilestoneReward[];
    },
  });
};

export const useSaveMilestone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (milestone: Partial<MilestoneReward>) => {
      if (milestone.id) {
        const { error } = await supabase.from('checkin_milestone_rewards').update(milestone).eq('id', milestone.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = milestone;
        const { error } = await supabase.from('checkin_milestone_rewards').insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestone-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-rewards'] });
      toast.success('Lưu quà mốc streak thành công');
    },
    onError: () => {
      toast.error('Không thể lưu quà mốc streak');
    },
  });
};

export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checkin_milestone_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestone-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['milestone-rewards'] });
      toast.success('Xóa quà mốc streak thành công');
    },
    onError: () => {
      toast.error('Không thể xóa quà mốc streak');
    },
  });
};
