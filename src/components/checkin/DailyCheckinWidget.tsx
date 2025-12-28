import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gift, Flame, Star, Trophy, Coins, X, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCheckinSettings,
  useTodayCheckin,
  useUserPoints,
  useCurrentStreak,
  usePerformCheckin,
  useUserCheckins,
  useMilestoneRewards,
  useUserMilestoneClaims,
  useClaimMilestoneReward,
} from '@/hooks/useDailyCheckin';
import { useConfetti } from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';
import { animate, stagger } from 'animejs';

export const DailyCheckinWidget = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { fireSuccess, firePrizeWin } = useConfetti();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { data: settings, isLoading: settingsLoading } = useCheckinSettings();
  const { data: todayCheckin, isLoading: todayLoading } = useTodayCheckin();
  const { data: userPoints } = useUserPoints();
  const { data: currentStreak } = useCurrentStreak();
  const { data: checkins } = useUserCheckins();
  const { data: milestoneRewards } = useMilestoneRewards();
  const { data: userClaims } = useUserMilestoneClaims();
  const claimReward = useClaimMilestoneReward();
  const performCheckin = usePerformCheckin();

  // Animate floating button
  useEffect(() => {
    if (widgetRef.current && settings?.is_enabled) {
      animate(widgetRef.current, {
        scale: [0, 1],
        rotate: [180, 0],
        duration: 800,
        ease: 'outElastic(1, .5)',
        delay: 500,
      });

      // Pulse animation for attention
      const pulseAnimation = animate(widgetRef.current, {
        boxShadow: [
          '0 0 0 0 rgba(245, 158, 11, 0.7)',
          '0 0 0 15px rgba(245, 158, 11, 0)',
        ],
        duration: 1500,
        ease: 'outQuad',
        loop: true,
      });

      return () => {
        pulseAnimation.pause();
      };
    }
    return undefined;
  }, [settings?.is_enabled]);

  // Animate panel open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      animate(panelRef.current, {
        translateY: [50, 0],
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 500,
        ease: 'outExpo',
      });

      // Animate calendar days
      if (calendarRef.current) {
        animate(calendarRef.current.querySelectorAll('.calendar-day'), {
          translateY: [20, 0],
          opacity: [0, 1],
          scale: [0.8, 1],
          delay: stagger(50, { start: 200 }),
          duration: 400,
          ease: 'outBack',
        });
      }
    }
  }, [isOpen]);

  if (!user) return null;
  if (settingsLoading || todayLoading) return null;
  if (!settings?.is_enabled) return null;

  const hasCheckedIn = !!todayCheckin;
  const milestones = (settings?.streak_milestones as { day: number; bonus: number }[]) || [];
  const nextMilestone = milestones.find(m => m.day > (currentStreak || 0));
  const progressToMilestone = nextMilestone 
    ? ((currentStreak || 0) / nextMilestone.day) * 100 
    : 100;

  const handleCheckin = async () => {
    const result = await performCheckin.mutateAsync();
    
    // Success animation
    if (panelRef.current) {
      animate(panelRef.current, {
        scale: [1, 1.02, 1],
        duration: 300,
        ease: 'inOutQuad',
      });
    }
    
    if (result.milestoneBonus > 0) {
      firePrizeWin();
    } else {
      fireSuccess();
    }
  };

  const handleToggle = () => {
    if (isOpen && panelRef.current) {
      animate(panelRef.current, {
        translateY: [0, 30],
        opacity: [1, 0],
        scale: [1, 0.95],
        duration: 300,
        ease: 'inQuad',
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(true);
    }
  };

  // Get last 7 days for calendar view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const checkinDates = new Set(checkins?.map(c => c.checkin_date) || []);

  return (
    <>
      {/* Floating Widget Button */}
      <div
        ref={widgetRef}
        onClick={handleToggle}
        className={cn(
          "fixed bottom-24 md:bottom-20 right-4 z-50 cursor-pointer",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-amber-500 to-orange-500",
          "flex items-center justify-center",
          "shadow-lg hover:shadow-xl transition-shadow",
          hasCheckedIn && "from-green-500 to-emerald-500"
        )}
        style={{ opacity: 1, transform: 'scale(1)' }}
      >
        {hasCheckedIn ? (
          <Star className="w-6 h-6 text-white fill-white" />
        ) : (
          <Gift className="w-6 h-6 text-white" />
        )}
        {!hasCheckedIn && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleToggle}
          />
        )}
      </AnimatePresence>

      {/* Checkin Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full"
          style={{ opacity: 0 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30 overflow-hidden backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={handleToggle}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <span>Điểm danh hàng ngày</span>
                </div>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                  <Coins className="h-3 w-3 mr-1" />
                  {userPoints?.total_points || 0} điểm
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Streak Display */}
              <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Flame className={cn(
                      "h-6 w-6",
                      (currentStreak || 0) > 0 ? "text-orange-500" : "text-muted-foreground"
                    )} />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">Streak hiện tại</p>
                    <p className="text-xl font-bold text-orange-500">{currentStreak || 0} ngày</p>
                  </div>
                </div>
                {nextMilestone && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cột mốc tiếp theo</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Trophy className="h-4 w-4" />
                      <span className="font-semibold">{nextMilestone.day} ngày</span>
                      <span className="text-xs">+{nextMilestone.bonus} điểm</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress to next milestone */}
              {nextMilestone && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{currentStreak || 0} ngày</span>
                    <span>{nextMilestone.day} ngày</span>
                  </div>
                  <Progress value={progressToMilestone} className="h-2" />
                </div>
              )}

              {/* Calendar View */}
              <div ref={calendarRef} className="grid grid-cols-7 gap-1">
                {last7Days.map((date, index) => {
                  const isCheckedIn = checkinDates.has(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const dayName = new Date(date).toLocaleDateString('vi-VN', { weekday: 'short' });
                  
                  return (
                    <div
                      key={date}
                      className={cn(
                        "calendar-day flex flex-col items-center p-2 rounded-lg text-center",
                        isToday && "ring-2 ring-primary",
                        isCheckedIn 
                          ? "bg-green-500/20 text-green-600" 
                          : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] uppercase">{dayName}</span>
                      <span className="text-sm font-medium">{new Date(date).getDate()}</span>
                      {isCheckedIn && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Checkin Button */}
              <AnimatePresence mode="wait">
                {hasCheckedIn ? (
                  <motion.div
                    key="checked"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center gap-2 p-3 bg-green-500/20 rounded-lg text-green-600"
                  >
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-medium">Đã điểm danh hôm nay! +{todayCheckin.points_earned} điểm</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-checked"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      onClick={handleCheckin}
                      disabled={performCheckin.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      size="lg"
                    >
                      {performCheckin.isPending ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Star className="h-5 w-5" />
                          </motion.div>
                          Đang điểm danh...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Gift className="h-5 w-5" />
                          Điểm danh nhận +{settings?.base_points || 10} điểm
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Milestone Rewards Preview */}
              {milestoneRewards && milestoneRewards.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Gift className="h-4 w-4 text-amber-500" />
                      Quà mốc streak
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setShowRewards(true)} className="text-xs">
                      Xem tất cả
                    </Button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {milestoneRewards.slice(0, 4).map((reward) => {
                      const isUnlocked = (currentStreak || 0) >= reward.day_milestone;
                      const isClaimed = userClaims?.some(c => c.milestone_reward_id === reward.id);
                      
                      return (
                        <div
                          key={reward.id}
                          className={cn(
                            "flex-shrink-0 w-20 p-2 rounded-lg text-center border transition-all",
                            isUnlocked 
                              ? isClaimed 
                                ? "bg-green-500/10 border-green-500/30" 
                                : "bg-amber-500/10 border-amber-500/30 cursor-pointer hover:bg-amber-500/20"
                              : "bg-muted/30 border-border/50 opacity-60"
                          )}
                          onClick={() => {
                            if (isUnlocked && !isClaimed) {
                              claimReward.mutate(reward.id);
                            }
                          }}
                        >
                          <div className="relative">
                            {reward.reward_image_url ? (
                              <img 
                                src={reward.reward_image_url} 
                                alt={reward.reward_name}
                                className="w-10 h-10 mx-auto rounded object-cover"
                              />
                            ) : (
                              <div className={cn(
                                "w-10 h-10 mx-auto rounded flex items-center justify-center",
                                isUnlocked ? "bg-amber-500" : "bg-muted"
                              )}>
                                <Gift className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {isClaimed && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            {!isUnlocked && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted-foreground rounded-full flex items-center justify-center">
                                <Lock className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] mt-1 font-medium truncate">{reward.reward_name}</p>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">
                            {reward.day_milestone} ngày
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                      Lịch sử
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Lịch sử điểm danh</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {checkins?.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(checkin.checkin_date).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                              +{checkin.points_earned} điểm
                            </Badge>
                            {checkin.is_milestone_bonus && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">
                                <Trophy className="h-3 w-3 mr-1" />
                                Cột mốc
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!checkins || checkins.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Chưa có lịch sử điểm danh
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={showRewards} onOpenChange={setShowRewards}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                      Quà thưởng
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-amber-500" />
                        Quà thưởng mốc Streak
                      </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {milestoneRewards?.map((reward) => {
                        const isUnlocked = (currentStreak || 0) >= reward.day_milestone;
                        const isClaimed = userClaims?.some(c => c.milestone_reward_id === reward.id);
                        
                        return (
                          <div
                            key={reward.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              isUnlocked 
                                ? isClaimed 
                                  ? "bg-green-500/10 border-green-500/30" 
                                  : "bg-amber-500/10 border-amber-500/30"
                                : "bg-muted/30 border-border/50 opacity-70"
                            )}
                          >
                            <div className="relative flex-shrink-0">
                              {reward.reward_image_url ? (
                                <img 
                                  src={reward.reward_image_url} 
                                  alt={reward.reward_name}
                                  className="w-14 h-14 rounded-lg object-cover"
                                />
                              ) : (
                                <div className={cn(
                                  "w-14 h-14 rounded-lg flex items-center justify-center",
                                  isUnlocked ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-muted"
                                )}>
                                  <Gift className="h-6 w-6 text-white" />
                                </div>
                              )}
                              {!isUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                  <Lock className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  isUnlocked ? "bg-orange-500/10 text-orange-600 border-orange-500/30" : ""
                                )}>
                                  <Flame className="h-3 w-3 mr-1" />
                                  {reward.day_milestone} ngày
                                </Badge>
                                {isClaimed && (
                                  <Badge className="bg-green-500 text-white text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    Đã nhận
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium mt-1">{reward.reward_name}</p>
                              {reward.reward_description && (
                                <p className="text-xs text-muted-foreground truncate">{reward.reward_description}</p>
                              )}
                              {reward.bonus_points > 0 && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  +{reward.bonus_points} điểm thưởng
                                </p>
                              )}
                            </div>
                            {isUnlocked && !isClaimed && (
                              <Button
                                size="sm"
                                onClick={() => claimReward.mutate(reward.id)}
                                disabled={claimReward.isPending}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                              >
                                Nhận
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {(!milestoneRewards || milestoneRewards.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Chưa có quà thưởng mốc streak
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
