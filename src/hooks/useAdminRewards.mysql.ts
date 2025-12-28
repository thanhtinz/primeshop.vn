// Hooks for Admin Rewards - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { toast } from 'sonner';

// Types
export interface CheckinSettings {
  id: string;
  isEnabled: boolean;
  basePoints: number;
  streakBonusMultiplier: number;
  maxStreakBonus: number;
  streakMilestones: { day: number; bonus: number }[];
  // Legacy
  is_enabled?: boolean;
  base_points?: number;
  streak_bonus_multiplier?: number;
  max_streak_bonus?: number;
  streak_milestones?: { day: number; bonus: number }[];
}

export interface PointsReward {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  rewardType: string;
  rewardValue: number | null;
  pointsCost: number;
  quantityLimit: number | null;
  isActive: boolean;
  sortOrder: number;
  // Legacy
  image_url?: string | null;
  reward_type?: string;
  reward_value?: number | null;
  points_cost?: number;
  quantity_limit?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  badgeColor: string | null;
  requirementType: string;
  requirementValue: number | null;
  pointsReward: number | null;
  isActive: boolean;
  sortOrder: number;
  // Legacy
  badge_color?: string | null;
  requirement_type?: string;
  requirement_value?: number | null;
  points_reward?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface MilestoneReward {
  id: string;
  dayMilestone: number;
  rewardName: string;
  rewardDescription: string | null;
  rewardType: string;
  rewardValue: string | null;
  rewardImageUrl: string | null;
  bonusPoints: number;
  isActive: boolean;
  sortOrder: number;
  // Legacy
  day_milestone?: number;
  reward_name?: string;
  reward_description?: string | null;
  reward_type?: string;
  reward_value?: string | null;
  reward_image_url?: string | null;
  bonus_points?: number;
  is_active?: boolean;
  sort_order?: number;
}

const mapCheckinSettingsToLegacy = (s: any): CheckinSettings => ({
  ...s,
  is_enabled: s.isEnabled,
  base_points: s.basePoints,
  streak_bonus_multiplier: s.streakBonusMultiplier,
  max_streak_bonus: s.maxStreakBonus,
  streak_milestones: s.streakMilestones,
});

const mapRewardToLegacy = (r: any): PointsReward => ({
  ...r,
  image_url: r.imageUrl,
  reward_type: r.rewardType,
  reward_value: r.rewardValue,
  points_cost: r.pointsCost,
  quantity_limit: r.quantityLimit,
  is_active: r.isActive,
  sort_order: r.sortOrder,
});

const mapAchievementToLegacy = (a: any): Achievement => ({
  ...a,
  badge_color: a.badgeColor,
  requirement_type: a.requirementType,
  requirement_value: a.requirementValue,
  points_reward: a.pointsReward,
  is_active: a.isActive,
  sort_order: a.sortOrder,
});

const mapMilestoneToLegacy = (m: any): MilestoneReward => ({
  ...m,
  day_milestone: m.dayMilestone,
  reward_name: m.rewardName,
  reward_description: m.rewardDescription,
  reward_type: m.rewardType,
  reward_value: m.rewardValue,
  reward_image_url: m.rewardImageUrl,
  bonus_points: m.bonusPoints,
  is_active: m.isActive,
  sort_order: m.sortOrder,
});

// Hooks
export const useCheckinSettingsAdmin = () => {
  return useQuery({
    queryKey: ['admin-checkin-settings'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('daily_checkin_settings')
        .select('*')
        .single();
      if (error) throw error;
      return mapCheckinSettingsToLegacy(data);
    },
  });
};

export const useUpdateCheckinSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CheckinSettings> }) => {
      const updateData: any = {};
      
      if (updates.isEnabled !== undefined || updates.is_enabled !== undefined) {
        updateData.isEnabled = updates.isEnabled ?? updates.is_enabled;
      }
      if (updates.basePoints !== undefined || updates.base_points !== undefined) {
        updateData.basePoints = updates.basePoints ?? updates.base_points;
      }
      if (updates.streakBonusMultiplier !== undefined || updates.streak_bonus_multiplier !== undefined) {
        updateData.streakBonusMultiplier = updates.streakBonusMultiplier ?? updates.streak_bonus_multiplier;
      }
      if (updates.maxStreakBonus !== undefined || updates.max_streak_bonus !== undefined) {
        updateData.maxStreakBonus = updates.maxStreakBonus ?? updates.max_streak_bonus;
      }
      if (updates.streakMilestones !== undefined || updates.streak_milestones !== undefined) {
        updateData.streakMilestones = updates.streakMilestones ?? updates.streak_milestones;
      }
      
      const { error } = await db
        .from('daily_checkin_settings')
        .update(updateData)
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
      const { data, error } = await db
        .from<any>('points_rewards')
        .select('*')
        .order('sortOrder', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRewardToLegacy);
    },
  });
};

export const useSaveReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reward: Partial<PointsReward>) => {
      const saveData: any = {
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl || reward.image_url,
        rewardType: reward.rewardType || reward.reward_type,
        rewardValue: reward.rewardValue ?? reward.reward_value,
        pointsCost: reward.pointsCost ?? reward.points_cost,
        quantityLimit: reward.quantityLimit ?? reward.quantity_limit,
        isActive: reward.isActive ?? reward.is_active ?? true,
        sortOrder: reward.sortOrder ?? reward.sort_order ?? 0,
      };
      
      if (reward.id) {
        const { error } = await db.from('points_rewards').update(saveData).eq('id', reward.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('points_rewards').insert(saveData);
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
      const { error } = await db.from('points_rewards').delete().eq('id', id);
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
      const { data, error } = await db
        .from<any>('achievements')
        .select('*')
        .order('sortOrder', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapAchievementToLegacy);
    },
  });
};

export const useSaveAchievement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (achievement: Partial<Achievement>) => {
      const saveData: any = {
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        badgeColor: achievement.badgeColor || achievement.badge_color,
        requirementType: achievement.requirementType || achievement.requirement_type,
        requirementValue: achievement.requirementValue ?? achievement.requirement_value,
        pointsReward: achievement.pointsReward ?? achievement.points_reward,
        isActive: achievement.isActive ?? achievement.is_active ?? true,
        sortOrder: achievement.sortOrder ?? achievement.sort_order ?? 0,
      };
      
      if (achievement.id) {
        const { error } = await db.from('achievements').update(saveData).eq('id', achievement.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('achievements').insert(saveData);
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
      // Delete user achievements first
      await db.from('user_achievements').delete().eq('achievementId', id);
      
      const { error } = await db.from('achievements').delete().eq('id', id);
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
      const { data, error } = await db
        .from<any>('checkin_milestone_rewards')
        .select('*')
        .order('dayMilestone', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapMilestoneToLegacy);
    },
  });
};

export const useSaveMilestoneReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (milestone: Partial<MilestoneReward>) => {
      const saveData: any = {
        dayMilestone: milestone.dayMilestone ?? milestone.day_milestone,
        rewardName: milestone.rewardName || milestone.reward_name,
        rewardDescription: milestone.rewardDescription || milestone.reward_description,
        rewardType: milestone.rewardType || milestone.reward_type,
        rewardValue: milestone.rewardValue || milestone.reward_value,
        rewardImageUrl: milestone.rewardImageUrl || milestone.reward_image_url,
        bonusPoints: milestone.bonusPoints ?? milestone.bonus_points ?? 0,
        isActive: milestone.isActive ?? milestone.is_active ?? true,
        sortOrder: milestone.sortOrder ?? milestone.sort_order ?? 0,
      };
      
      if (milestone.id) {
        const { error } = await db.from('checkin_milestone_rewards').update(saveData).eq('id', milestone.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('checkin_milestone_rewards').insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestone-rewards'] });
      toast.success('Lưu phần thưởng cột mốc thành công');
    },
    onError: () => {
      toast.error('Không thể lưu phần thưởng cột mốc');
    },
  });
};

export const useDeleteMilestoneReward = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('checkin_milestone_rewards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-milestone-rewards'] });
      toast.success('Xóa phần thưởng cột mốc thành công');
    },
    onError: () => {
      toast.error('Không thể xóa phần thưởng cột mốc');
    },
  });
};
