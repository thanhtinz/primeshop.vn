import { motion } from 'framer-motion';
import { Trophy, Award, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAchievements,
  useUserAchievements,
  useToggleAchievementDisplay,
} from '@/hooks/useAchievements';
import { AchievementBadge } from './AchievementBadge';
import { cn } from '@/lib/utils';

interface AchievementsDisplayProps {
  userId?: string;
  showControls?: boolean;
  compact?: boolean;
}

export const AchievementsDisplay = ({
  userId,
  showControls = false,
  compact = false,
}: AchievementsDisplayProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const targetUserId = userId || user?.id;

  const { data: allAchievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements(targetUserId);
  const toggleDisplay = useToggleAchievementDisplay();

  const isOwnProfile = user?.id === targetUserId;
  const isLoading = achievementsLoading || userAchievementsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="w-12 h-12 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const earnedAchievements = userAchievements || [];
  const unearnedAchievements = allAchievements?.filter(a => !earnedIds.has(a.id)) || [];

  // For profile display (not own profile), only show displayed achievements
  const displayedAchievements = !isOwnProfile && !showControls
    ? earnedAchievements.filter(ua => ua.is_displayed)
    : earnedAchievements;

  if (compact) {
    // Compact view for profile header
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {displayedAchievements.slice(0, 5).map((ua) => (
          <AchievementBadge
            key={ua.id}
            achievement={ua.achievement}
            size="sm"
            earnedAt={ua.earned_at}
          />
        ))}
        {displayedAchievements.length > 5 && (
          <Badge variant="secondary" className="text-xs">
            +{displayedAchievements.length - 5}
          </Badge>
        )}
        {displayedAchievements.length === 0 && (
          <span className="text-sm text-muted-foreground">Chưa có thành tựu</span>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>Thành tựu ({earnedAchievements.length}/{allAchievements?.length || 0})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Đã đạt được
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {earnedAchievements.map((ua, index) => {
                const name = language === 'en' 
                  ? ua.achievement.name_en || ua.achievement.name 
                  : ua.achievement.name;
                const description = language === 'en'
                  ? ua.achievement.description_en || ua.achievement.description
                  : ua.achievement.description;

                return (
                  <motion.div
                    key={ua.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
                      "transition-all hover:bg-muted"
                    )}
                  >
                    <AchievementBadge
                      achievement={ua.achievement}
                      size="md"
                      showTooltip={false}
                      earnedAt={ua.earned_at}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ua.earned_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    {showControls && isOwnProfile && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Hiển thị</span>
                        <Switch
                          checked={ua.is_displayed}
                          onCheckedChange={(checked) => 
                            toggleDisplay.mutate({
                              achievementId: ua.achievement_id,
                              isDisplayed: checked,
                            })
                          }
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unearned Achievements */}
        {showControls && unearnedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Chưa đạt được
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unearnedAchievements.map((achievement, index) => {
                const name = language === 'en'
                  ? achievement.name_en || achievement.name
                  : achievement.name;
                const description = language === 'en'
                  ? achievement.description_en || achievement.description
                  : achievement.description;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: earnedAchievements.length * 0.05 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-60"
                  >
                    <AchievementBadge
                      achievement={achievement}
                      size="md"
                      showTooltip={false}
                      earned={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{description}</p>
                      {achievement.points_reward > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          +{achievement.points_reward} điểm
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {earnedAchievements.length === 0 && !showControls && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có thành tựu nào</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
