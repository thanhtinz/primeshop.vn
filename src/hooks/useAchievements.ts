import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  icon: string | null;
  badge_color: string;
  points_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
  sort_order: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  is_displayed: boolean;
  achievement?: Achievement;
}

export const useAchievements = () => {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useAllAchievements = () => {
  return useQuery({
    queryKey: ['all-achievements'],
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

export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
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
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', targetUserId)
        .eq('is_displayed', true)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
    enabled: !!targetUserId,
  });
};

export const useCheckAndAwardAchievements = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get all active achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      if (!achievements) return [];

      // Get user's existing achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      const earnedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);
      const newAchievements: Achievement[] = [];

      for (const achievement of achievements) {
        if (earnedIds.has(achievement.id)) continue;

        let qualified = false;

        switch (achievement.requirement_type) {
          case 'purchase_count': {
            const { count } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('customer_email', user.email)
              .eq('status', 'completed');
            qualified = (count || 0) >= achievement.requirement_value;
            break;
          }
          case 'review_count': {
            const { count } = await supabase
              .from('reviews')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            qualified = (count || 0) >= achievement.requirement_value;
            break;
          }
          case 'total_spent': {
            const { data: profile } = await supabase
              .from('profiles')
              .select('total_spent')
              .eq('user_id', user.id)
              .single();
            qualified = (profile?.total_spent || 0) >= achievement.requirement_value;
            break;
          }
          case 'referral_count': {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .not('user_id', 'eq', user.id);
            // Simplified referral check - can be enhanced later
            qualified = false;
            break;
          }
          case 'vip_level': {
            const { data: profile } = await supabase
              .from('profiles')
              .select('vip_level_id')
              .eq('user_id', user.id)
              .single();
            qualified = !!profile?.vip_level_id;
            break;
          }
          case 'checkin_streak': {
            const { data: checkins } = await supabase
              .from('daily_checkins')
              .select('streak_count')
              .eq('user_id', user.id)
              .order('checkin_date', { ascending: false })
              .limit(1);
            qualified = (checkins?.[0]?.streak_count || 0) >= achievement.requirement_value;
            break;
          }
        }

        if (qualified) {
          // Award achievement
          await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          // Award points if any
          if (achievement.points_reward > 0) {
            const { data: existingPoints } = await supabase
              .from('user_points')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (existingPoints) {
              await supabase
                .from('user_points')
                .update({
                  total_points: existingPoints.total_points + achievement.points_reward,
                  lifetime_earned: existingPoints.lifetime_earned + achievement.points_reward,
                })
                .eq('user_id', user.id);
            } else {
              await supabase
                .from('user_points')
                .insert({
                  user_id: user.id,
                  total_points: achievement.points_reward,
                  lifetime_earned: achievement.points_reward,
                });
            }

            // Log transaction
            await supabase
              .from('point_transactions')
              .insert({
                user_id: user.id,
                amount: achievement.points_reward,
                transaction_type: 'earn',
                source: 'achievement',
                reference_id: achievement.id,
                description: `Đạt thành tựu: ${achievement.name}`,
              });
          }

          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    },
    onSuccess: (newAchievements) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['displayed-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });

      newAchievements.forEach(achievement => {
        toast.success(`🏆 Đạt thành tựu mới: ${achievement.name}!`, {
          description: achievement.points_reward > 0 
            ? `+${achievement.points_reward} điểm thưởng` 
            : undefined,
          duration: 5000,
        });
      });
    },
  });
};

export const useToggleAchievementDisplay = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ achievementId, isDisplayed }: { achievementId: string; isDisplayed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_achievements')
        .update({ is_displayed: isDisplayed })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['displayed-achievements'] });
    },
  });
};
