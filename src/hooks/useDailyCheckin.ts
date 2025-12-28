import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyCheckinReward } from '@/services/notificationService';

interface CheckinSettings {
  id: string;
  is_enabled: boolean;
  base_points: number;
  streak_bonus_multiplier: number;
  max_streak_bonus: number;
  streak_milestones: { day: number; bonus: number }[];
}

interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  points_earned: number;
  streak_count: number;
  is_milestone_bonus: boolean;
  milestone_bonus_points: number;
  created_at: string;
}

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export const useCheckinSettings = () => {
  return useQuery({
    queryKey: ['checkin-settings'],
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

export const useUserCheckins = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-checkins', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as DailyCheckin[];
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
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data as DailyCheckin | null;
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
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserPoints | null;
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
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('checkin_date, streak_count')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) return 0;
      
      const lastCheckin = data[0];
      const lastDate = new Date(lastCheckin.checkin_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If last checkin was today or yesterday, streak continues
      if (diffDays <= 1) {
        return lastCheckin.streak_count;
      }
      
      return 0;
    },
    enabled: !!user?.id,
  });
};

export const usePerformCheckin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Use atomic RPC function
      const { data, error } = await supabase.rpc('perform_daily_checkin', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        total_points?: number;
        new_streak?: number;
        milestone_bonus?: number;
      };

      if (!result.success) {
        throw new Error(result.error || 'Điểm danh thất bại');
      }

      return {
        totalPoints: result.total_points || 0,
        newStreak: result.new_streak || 1,
        milestoneBonus: result.milestone_bonus || 0
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['today-checkin'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['current-streak'] });
      
      // Create notification
      if (user?.id) {
        notifyCheckinReward(user.id, data.totalPoints, data.newStreak);
      }
      
      if (data.milestoneBonus > 0) {
        toast.success(`🎉 Điểm danh thành công! +${data.totalPoints} điểm (Bao gồm ${data.milestoneBonus} điểm thưởng cột mốc!)`);
      } else {
        toast.success(`✅ Điểm danh thành công! +${data.totalPoints} điểm (Streak: ${data.newStreak} ngày)`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const usePointsRewards = () => {
  return useQuery({
    queryKey: ['points-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_rewards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Use atomic RPC function
      const { data, error } = await supabase.rpc('redeem_points_reward', {
        p_user_id: user.id,
        p_reward_id: rewardId
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        reward_name?: string;
        voucher_code?: string;
        points_spent?: number;
        new_points?: number;
      };

      if (!result.success) {
        throw new Error(result.error || 'Đổi thưởng thất bại');
      }

      return {
        rewardName: result.reward_name,
        voucherCode: result.voucher_code,
        pointsSpent: result.points_spent
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['points-rewards'] });
      
      if (data.voucherCode) {
        toast.success(`🎁 Đổi thưởng thành công! Mã voucher: ${data.voucherCode}`);
      } else {
        toast.success(`🎁 Đổi thưởng thành công!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const usePointTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['point-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

// Milestone rewards hooks
export interface MilestoneReward {
  id: string;
  day_milestone: number;
  reward_name: string;
  reward_name_en: string | null;
  reward_description: string | null;
  reward_description_en: string | null;
  reward_type: string;
  reward_value: string | null;
  reward_image_url: string | null;
  bonus_points: number;
  is_active: boolean;
  sort_order: number;
}

export const useMilestoneRewards = () => {
  return useQuery({
    queryKey: ['milestone-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkin_milestone_rewards')
        .select('*')
        .eq('is_active', true)
        .order('day_milestone', { ascending: true });
      
      if (error) throw error;
      return data as MilestoneReward[];
    },
  });
};

export const useUserMilestoneClaims = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-milestone-claims', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_milestone_claims')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useClaimMilestoneReward = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_milestone_claims')
        .insert({
          user_id: user.id,
          milestone_reward_id: rewardId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bạn đã nhận phần thưởng này rồi');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-milestone-claims'] });
      toast.success('🎁 Nhận phần thưởng mốc streak thành công!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
