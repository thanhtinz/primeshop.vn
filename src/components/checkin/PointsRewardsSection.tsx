import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins, Tag, Wallet, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPoints, usePointsRewards, useRedeemReward } from '@/hooks/useDailyCheckin';
import { cn } from '@/lib/utils';

export const PointsRewardsSection = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: userPoints, isLoading: pointsLoading } = useUserPoints();
  const { data: rewards, isLoading: rewardsLoading } = usePointsRewards();
  const redeemReward = useRedeemReward();

  if (!user) return null;

  if (pointsLoading || rewardsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRedeem = async () => {
    if (!selectedReward) return;
    await redeemReward.mutateAsync(selectedReward.id);
    setShowConfirmDialog(false);
    setSelectedReward(null);
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'voucher':
        return <Tag className="h-6 w-6" />;
      case 'balance':
        return <Wallet className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const canAfford = (cost: number) => (userPoints?.total_points || 0) >= cost;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span>Đổi điểm lấy quà</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Coins className="h-3 w-3 mr-1" />
              {userPoints?.total_points || 0} điểm
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!rewards || rewards.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có phần thưởng nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward, index) => {
                const affordable = canAfford(reward.points_cost);
                const soldOut = reward.quantity_limit && reward.quantity_redeemed >= reward.quantity_limit;
                
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "relative overflow-hidden transition-all hover:shadow-md",
                      !affordable && "opacity-60",
                      soldOut && "opacity-50"
                    )}>
                      {reward.image_url && (
                        <div className="aspect-video bg-muted">
                          <img
                            src={reward.image_url}
                            alt={reward.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-primary">
                            {getRewardIcon(reward.reward_type)}
                            <span className="font-medium">
                              {language === 'en' ? reward.name_en || reward.name : reward.name}
                            </span>
                          </div>
                          {soldOut && (
                            <Badge variant="destructive" className="text-xs">
                              Hết
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {language === 'en' 
                            ? reward.description_en || reward.description 
                            : reward.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Coins className="h-4 w-4" />
                            <span>{reward.points_cost.toLocaleString()}</span>
                          </div>
                          
                          {reward.quantity_limit && (
                            <span className="text-xs text-muted-foreground">
                              Còn {reward.quantity_limit - (reward.quantity_redeemed || 0)}
                            </span>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedReward(reward);
                            setShowConfirmDialog(true);
                          }}
                          disabled={!affordable || soldOut || redeemReward.isPending}
                          className="w-full"
                          variant={affordable && !soldOut ? "default" : "secondary"}
                        >
                          {soldOut ? (
                            "Đã hết"
                          ) : !affordable ? (
                            `Cần thêm ${(reward.points_cost - (userPoints?.total_points || 0)).toLocaleString()} điểm`
                          ) : (
                            "Đổi ngay"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đổi thưởng</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn đổi <strong>{selectedReward?.name}</strong> với{' '}
              <strong>{selectedReward?.points_cost.toLocaleString()} điểm</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Điểm hiện tại:</span>
              <span className="font-medium">{userPoints?.total_points?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Điểm cần dùng:</span>
              <span className="font-medium text-red-500">-{selectedReward?.points_cost?.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>Điểm còn lại:</span>
              <span className="text-primary">
                {((userPoints?.total_points || 0) - (selectedReward?.points_cost || 0)).toLocaleString()}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleRedeem} disabled={redeemReward.isPending}>
              {redeemReward.isPending ? 'Đang xử lý...' : 'Xác nhận đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
