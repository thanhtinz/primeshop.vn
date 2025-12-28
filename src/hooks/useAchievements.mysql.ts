// Hooks for Achievements - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  icon: string | null;
  badgeColor: string;
  pointsReward: number;
  requirementType: string;
  requirementValue: number;
  isActive: boolean;
  sortOrder: number;
  // Legacy mappings
  name_en?: string | null;
  description_en?: string | null;
  badge_color?: string;
  points_reward?: number;
  requirement_type?: string;
  requirement_value?: number;
  is_active?: boolean;
  sort_order?: number;
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  isDisplayed: boolean;
  achievement?: Achievement;
  // Legacy mappings
  user_id?: string;
  achievement_id?: string;
  earned_at?: string;
  is_displayed?: boolean;
}

const mapAchievementToLegacy = (a: any): Achievement => ({
  ...a,
  name_en: a.nameEn,
  description_en: a.descriptionEn,
  badge_color: a.badgeColor,
  points_reward: a.pointsReward,
  requirement_type: a.requirementType,
  requirement_value: a.requirementValue,
  is_active: a.isActive,
  sort_order: a.sortOrder,
});

const mapUserAchievementToLegacy = (ua: any): UserAchievement => ({
  ...ua,
  user_id: ua.userId,
  achievement_id: ua.achievementId,
  earned_at: ua.earnedAt,
  is_displayed: ua.isDisplayed,
  achievement: ua.achievement ? mapAchievementToLegacy(ua.achievement) : undefined,
});

export const useAchievements = () => {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('achievements')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapAchievementToLegacy);
    },
  });
};

export const useAllAchievements = () => {
  return useQuery({
    queryKey: ['all-achievements'],
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

export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      // Get user achievements
      const { data: userAchievements, error } = await db
        .from<any>('user_achievements')
        .select('*')
        .eq('userId', targetUserId)
        .order('earnedAt', { ascending: false });
      
      if (error) throw error;
      
      if (!userAchievements || userAchievements.length === 0) return [];
      
      // Get achievement details
      const achievementIds = userAchievements.map((ua: any) => ua.achievementId);
      const { data: achievements } = await db
        .from<any>('achievements')
        .select('*')
        .in('id', achievementIds);
      
      const achievementMap = new Map(achievements?.map((a: any) => [a.id, mapAchievementToLegacy(a)]));
      
      return userAchievements.map((ua: any) => ({
        ...mapUserAchievementToLegacy(ua),
        achievement: achievementMap.get(ua.achievementId),
      }));
    },
    enabled: !!targetUserId,
  });
};

export const useDisplayedAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['displayed-achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data: userAchievements, error } = await db
        .from<any>('user_achievements')
        .select('*')
        .eq('userId', targetUserId)
        .eq('isDisplayed', true)
        .order('earnedAt', { ascending: false });
      
      if (error) throw error;
      
      if (!userAchievements || userAchievements.length === 0) return [];
      
      // Get achievement details
      const achievementIds = userAchievements.map((ua: any) => ua.achievementId);
      const { data: achievements } = await db
        .from<any>('achievements')
        .select('*')
        .in('id', achievementIds);
      
      const achievementMap = new Map(achievements?.map((a: any) => [a.id, mapAchievementToLegacy(a)]));
      
      return userAchievements.map((ua: any) => ({
        ...mapUserAchievementToLegacy(ua),
        achievement: achievementMap.get(ua.achievementId),
      }));
    },
    enabled: !!targetUserId,
  });
};

export const useToggleAchievementDisplay = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ achievementId, isDisplayed }: { achievementId: string; isDisplayed: boolean }) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await db
        .from<any>('user_achievements')
        .update({ isDisplayed })
        .eq('userId', user.id)
        .eq('achievementId', achievementId)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapUserAchievementToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['displayed-achievements'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useAwardAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, achievementId }: { userId: string; achievementId: string }) => {
      const { data, error } = await db
        .from<any>('user_achievements')
        .insert({
          userId,
          achievementId,
          earnedAt: new Date().toISOString(),
          isDisplayed: false,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapUserAchievementToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements', variables.userId] });
      toast.success('Đã trao thành tựu');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Admin hooks
export const useCreateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievement: Partial<Achievement>) => {
      const { data, error } = await db
        .from<any>('achievements')
        .insert({
          code: achievement.code,
          name: achievement.name,
          nameEn: achievement.nameEn || achievement.name_en,
          description: achievement.description,
          descriptionEn: achievement.descriptionEn || achievement.description_en,
          icon: achievement.icon,
          badgeColor: achievement.badgeColor || achievement.badge_color || '#FFD700',
          pointsReward: achievement.pointsReward ?? achievement.points_reward ?? 0,
          requirementType: achievement.requirementType || achievement.requirement_type || 'manual',
          requirementValue: achievement.requirementValue ?? achievement.requirement_value ?? 0,
          isActive: achievement.isActive ?? achievement.is_active ?? true,
          sortOrder: achievement.sortOrder ?? achievement.sort_order ?? 0,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapAchievementToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['all-achievements'] });
      toast.success('Đã tạo thành tựu');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Achievement> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.nameEn !== undefined || updates.name_en !== undefined) {
        updateData.nameEn = updates.nameEn ?? updates.name_en;
      }
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.descriptionEn !== undefined || updates.description_en !== undefined) {
        updateData.descriptionEn = updates.descriptionEn ?? updates.description_en;
      }
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.badgeColor !== undefined || updates.badge_color !== undefined) {
        updateData.badgeColor = updates.badgeColor ?? updates.badge_color;
      }
      if (updates.pointsReward !== undefined || updates.points_reward !== undefined) {
        updateData.pointsReward = updates.pointsReward ?? updates.points_reward;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.sortOrder !== undefined || updates.sort_order !== undefined) {
        updateData.sortOrder = updates.sortOrder ?? updates.sort_order;
      }
      
      const { data, error } = await db
        .from<any>('achievements')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapAchievementToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['all-achievements'] });
      toast.success('Đã cập nhật thành tựu');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related user achievements first
      await db.from('user_achievements').delete().eq('achievementId', id);
      
      const { error } = await db.from('achievements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['all-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      toast.success('Đã xóa thành tựu');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Check progress toward achievements
export const useAchievementProgress = () => {
  const { user } = useAuth();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();

  return useQuery({
    queryKey: ['achievement-progress', user?.id],
    queryFn: async () => {
      if (!user?.id || !achievements) return [];
      
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievementId || ua.achievement_id));
      
      // Filter out earned achievements
      const unearnedAchievements = achievements.filter(a => !earnedIds.has(a.id));
      
      // For each unearned achievement, calculate progress
      // This would depend on your requirement types
      return unearnedAchievements.map(a => ({
        achievement: a,
        progress: 0, // Would need actual calculation based on requirement_type
        target: a.requirementValue || a.requirement_value || 0,
        percentage: 0,
      }));
    },
    enabled: !!user?.id && !!achievements,
  });
};
