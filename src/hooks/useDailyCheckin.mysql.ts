// Hooks for Daily Check-in - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CheckinSettings {
  id: string;
  isEnabled: boolean;
  basePoints: number;
  streakBonusMultiplier: number;
  maxStreakBonus: number;
  streakMilestones: { day: number; bonus: number }[];
  // Legacy mappings
  is_enabled?: boolean;
  base_points?: number;
  streak_bonus_multiplier?: number;
  max_streak_bonus?: number;
  streak_milestones?: { day: number; bonus: number }[];
}

interface DailyCheckin {
  id: string;
  userId: string;
  checkinDate: string;
  pointsEarned: number;
  streakCount: number;
  isMilestoneBonus: boolean;
  milestoneBonusPoints: number;
  createdAt: string;
  // Legacy mappings
  user_id?: string;
  checkin_date?: string;
  points_earned?: number;
  streak_count?: number;
  is_milestone_bonus?: boolean;
  milestone_bonus_points?: number;
  created_at?: string;
}

interface UserPoints {
  id: string;
  userId: string;
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  // Legacy mappings
  user_id?: string;
  total_points?: number;
  lifetime_earned?: number;
  lifetime_spent?: number;
}

const mapSettingsToLegacy = (s: any): CheckinSettings => ({
  ...s,
  is_enabled: s.isEnabled,
  base_points: s.basePoints,
  streak_bonus_multiplier: s.streakBonusMultiplier,
  max_streak_bonus: s.maxStreakBonus,
  streak_milestones: s.streakMilestones,
});

const mapCheckinToLegacy = (c: any): DailyCheckin => ({
  ...c,
  user_id: c.userId,
  checkin_date: c.checkinDate,
  points_earned: c.pointsEarned,
  streak_count: c.streakCount,
  is_milestone_bonus: c.isMilestoneBonus,
  milestone_bonus_points: c.milestoneBonusPoints,
  created_at: c.createdAt,
});

const mapPointsToLegacy = (p: any): UserPoints => ({
  ...p,
  user_id: p.userId,
  total_points: p.totalPoints,
  lifetime_earned: p.lifetimeEarned,
  lifetime_spent: p.lifetimeSpent,
});

export const useCheckinSettings = () => {
  return useQuery({
    queryKey: ['checkin-settings'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('daily_checkin_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return mapSettingsToLegacy(data);
    },
  });
};

export const useUserCheckins = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-checkins', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await db
        .from<any>('daily_checkins')
        .select('*')
        .eq('userId', user.id)
        .order('checkinDate', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return (data || []).map(mapCheckinToLegacy);
    },
    enabled: !!user?.id,
  });
};

export const useTodayCheckin = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['today-checkin', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await db
        .from<any>('daily_checkins')
        .select('*')
        .eq('userId', user.id)
        .eq('checkinDate', today)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapCheckinToLegacy(data) : null;
    },
    enabled: !!user?.id,
  });
};

export const useUserPoints = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await db
        .from<any>('user_points')
        .select('*')
        .eq('userId', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapPointsToLegacy(data) : null;
    },
    enabled: !!user?.id,
  });
};

export const useCurrentStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get most recent checkin to see streak
      const { data, error } = await db
        .from<any>('daily_checkins')
        .select('streakCount, checkinDate')
        .eq('userId', user.id)
        .order('checkinDate', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) return 0;
      
      // Check if streak is still active (last checkin was today or yesterday)
      const lastCheckin = new Date(data[0].checkinDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheckin >= yesterday) {
        return data[0].streakCount;
      }
      return 0; // Streak broken
    },
    enabled: !!user?.id,
  });
};

export const usePerformCheckin = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await rpc.invoke<{
        success: boolean;
        error?: string;
        points_earned?: number;
        streak_count?: number;
        is_milestone?: boolean;
        milestone_bonus?: number;
        total_points?: number;
      }>('perform_daily_checkin', {
        user_id: user.id,
      });
      
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Điểm danh thất bại');
      }
      
      return {
        pointsEarned: data.points_earned || 0,
        streakCount: data.streak_count || 0,
        isMilestone: data.is_milestone || false,
        milestoneBonus: data.milestone_bonus || 0,
        totalPoints: data.total_points || 0,
        // Legacy
        points_earned: data.points_earned || 0,
        streak_count: data.streak_count || 0,
        is_milestone: data.is_milestone || false,
        milestone_bonus: data.milestone_bonus || 0,
        total_points: data.total_points || 0,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['today-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['current-streak'] });
      
      let message = `Điểm danh thành công! +${result.points_earned} điểm`;
      if (result.is_milestone) {
        message += ` (Bonus cột mốc: +${result.milestone_bonus} điểm)`;
      }
      message += ` | Chuỗi điểm danh: ${result.streak_count} ngày`;
      
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Admin hooks
export const useUpdateCheckinSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<CheckinSettings>) => {
      const { data: existing } = await db
        .from<any>('daily_checkin_settings')
        .select('id')
        .single();

      const updateData: any = {};
      if (settings.isEnabled !== undefined || settings.is_enabled !== undefined) {
        updateData.isEnabled = settings.isEnabled ?? settings.is_enabled;
      }
      if (settings.basePoints !== undefined || settings.base_points !== undefined) {
        updateData.basePoints = settings.basePoints ?? settings.base_points;
      }
      if (settings.streakBonusMultiplier !== undefined || settings.streak_bonus_multiplier !== undefined) {
        updateData.streakBonusMultiplier = settings.streakBonusMultiplier ?? settings.streak_bonus_multiplier;
      }
      if (settings.maxStreakBonus !== undefined || settings.max_streak_bonus !== undefined) {
        updateData.maxStreakBonus = settings.maxStreakBonus ?? settings.max_streak_bonus;
      }
      if (settings.streakMilestones !== undefined || settings.streak_milestones !== undefined) {
        updateData.streakMilestones = settings.streakMilestones ?? settings.streak_milestones;
      }

      if (existing?.id) {
        const { data, error } = await db
          .from<any>('daily_checkin_settings')
          .update(updateData)
          .eq('id', existing.id)
          .select('*')
          .single();
        
        if (error) throw error;
        return mapSettingsToLegacy(data);
      } else {
        const { data, error } = await db
          .from<any>('daily_checkin_settings')
          .insert(updateData)
          .select('*')
          .single();
        
        if (error) throw error;
        return mapSettingsToLegacy(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-settings'] });
      toast.success('Đã cập nhật cài đặt điểm danh');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useAllUserCheckins = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['all-user-checkins', page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      
      const { data, error } = await db
        .from<any>('daily_checkins')
        .select('*')
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return (data || []).map(mapCheckinToLegacy);
    },
  });
};

// Get checkin calendar for a month
export const useCheckinCalendar = (year: number, month: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['checkin-calendar', user?.id, year, month],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const { data, error } = await db
        .from<any>('daily_checkins')
        .select('checkinDate, pointsEarned, streakCount, isMilestoneBonus')
        .eq('userId', user.id)
        .gte('checkinDate', startDate)
        .lte('checkinDate', endDate);
      
      if (error) throw error;
      
      return (data || []).map((c: any) => ({
        date: c.checkinDate,
        checkin_date: c.checkinDate,
        points_earned: c.pointsEarned,
        streak_count: c.streakCount,
        is_milestone_bonus: c.isMilestoneBonus,
      }));
    },
    enabled: !!user?.id,
  });
};
