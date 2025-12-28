import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, AlertTriangle, Gift, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, Star, Zap } from 'lucide-react';
import { useDesignSellerRewards, useDesignSellerPenalties, useClaimDesignReward, useAppealDesignPenalty } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const rewardTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  on_time_bonus: { label: 'Thưởng đúng hạn', icon: Clock, color: 'text-green-500' },
  high_rating_bonus: { label: 'Thưởng rating cao', icon: Star, color: 'text-yellow-500' },
  volume_bonus: { label: 'Thưởng số lượng', icon: TrendingUp, color: 'text-blue-500' },
  featured_listing: { label: 'Hiển thị nổi bật', icon: Zap, color: 'text-purple-500' },
  badge_earned: { label: 'Huy hiệu', icon: Trophy, color: 'text-orange-500' },
};

const penaltyTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  late_delivery: { label: 'Trễ deadline', icon: Clock, color: 'text-orange-500' },
  dispute_lost: { label: 'Thua tranh chấp', icon: XCircle, color: 'text-red-500' },
  abuse_confirmed: { label: 'Vi phạm xác nhận', icon: AlertTriangle, color: 'text-red-600' },
  nda_violation: { label: 'Vi phạm NDA', icon: AlertTriangle, color: 'text-red-700' },
  quality_issue: { label: 'Vấn đề chất lượng', icon: TrendingDown, color: 'text-yellow-600' },
};

const severityLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  warning: { label: 'Cảnh báo', variant: 'outline' },
  minor: { label: 'Nhẹ', variant: 'secondary' },
  major: { label: 'Nghiêm trọng', variant: 'default' },
  critical: { label: 'Rất nghiêm trọng', variant: 'destructive' },
};

export default function SellerDesignRewardsPage() {
  const { seller } = useOutletContext<any>();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const { data: rewards, isLoading: loadingRewards } = useDesignSellerRewards(seller?.id);
  const { data: penalties, isLoading: loadingPenalties } = useDesignSellerPenalties(seller?.id);
  const claimReward = useClaimDesignReward();
  const appealPenalty = useAppealDesignPenalty();
  
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<any>(null);
  const [appealReason, setAppealReason] = useState('');
  
  const unclaimedRewards = rewards?.filter(r => !r.is_claimed) || [];
  const totalRewardAmount = rewards?.reduce((sum, r) => sum + r.amount, 0) || 0;
  const totalPenaltyAmount = penalties?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalTrustDeduction = penalties?.reduce((sum, p) => sum + p.trust_score_deduction, 0) || 0;
  
  const handleClaimReward = async (rewardId: string) => {
    if (!seller) return;
    await claimReward.mutateAsync({ id: rewardId, sellerId: seller.id });
  };
  
  const handleOpenAppeal = (penalty: any) => {
    setSelectedPenalty(penalty);
    setAppealReason('');
    setAppealDialogOpen(true);
  };
  
  const handleSubmitAppeal = async () => {
    if (!selectedPenalty || !appealReason || !seller) return;
    await appealPenalty.mutateAsync({
      id: selectedPenalty.id,
      sellerId: seller.id,
      appealReason,
    });
    setAppealDialogOpen(false);
  };
  
  if (!seller) return null;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Thưởng & Phạt
        </h1>
        <p className="text-muted-foreground">Xem lịch sử thưởng và phạt của bạn</p>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thưởng</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalRewardAmount)}</div>
            <p className="text-xs text-muted-foreground">{rewards?.length || 0} lần thưởng</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa nhận</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unclaimedRewards.length}</div>
            <p className="text-xs text-muted-foreground">phần thưởng đang chờ</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng phạt</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalPenaltyAmount)}</div>
            <p className="text-xs text-muted-foreground">{penalties?.length || 0} lần phạt</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uy tín bị trừ</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">-{totalTrustDeduction}</div>
            <p className="text-xs text-muted-foreground">điểm uy tín</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            Thưởng ({rewards?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="penalties" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Phạt ({penalties?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rewards" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loadingRewards ? (
                <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
              ) : !rewards?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có thưởng nào. Hoàn thành đơn đúng hạn và nhận rating cao để nhận thưởng!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại thưởng</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => {
                      const typeInfo = rewardTypeLabels[reward.reward_type] || { label: reward.reward_type, icon: Gift, color: 'text-gray-500' };
                      const Icon = typeInfo.icon;
                      return (
                        <TableRow key={reward.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                              <span>{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{reward.description || '-'}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            +{formatPrice(reward.amount)}
                          </TableCell>
                          <TableCell>
                            {formatDate(reward.awarded_at)}
                          </TableCell>
                          <TableCell>
                            {reward.is_claimed ? (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Đã nhận
                              </Badge>
                            ) : (
                              <Badge variant="default">Chờ nhận</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!reward.is_claimed && (
                              <Button 
                                size="sm" 
                                onClick={() => handleClaimReward(reward.id)}
                                disabled={claimReward.isPending}
                              >
                                Nhận thưởng
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="penalties" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loadingPenalties ? (
                <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
              ) : !penalties?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có phạt nào. Tiếp tục duy trì chất lượng tốt!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại phạt</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Uy tín</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {penalties.map((penalty) => {
                      const typeInfo = penaltyTypeLabels[penalty.penalty_type] || { label: penalty.penalty_type, icon: AlertTriangle, color: 'text-gray-500' };
                      const Icon = typeInfo.icon;
                      const severityInfo = severityLabels[penalty.severity];
                      return (
                        <TableRow key={penalty.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                              <span>{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={severityInfo.variant}>{severityInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{penalty.description || '-'}</TableCell>
                          <TableCell className="font-medium text-red-600">
                            {penalty.amount > 0 ? `-${formatPrice(penalty.amount)}` : '-'}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {penalty.trust_score_deduction > 0 ? `-${penalty.trust_score_deduction}` : '-'}
                          </TableCell>
                          <TableCell>
                            {formatDate(penalty.issued_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {penalty.is_appealed ? (
                              <Badge variant={
                                penalty.appeal_status === 'approved' ? 'default' :
                                penalty.appeal_status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {penalty.appeal_status === 'approved' ? 'Đã chấp nhận' :
                                 penalty.appeal_status === 'rejected' ? 'Từ chối' : 'Đang xem xét'}
                              </Badge>
                            ) : !penalty.resolved_at && (
                              <Button size="sm" variant="outline" onClick={() => handleOpenAppeal(penalty)}>
                                Khiếu nại
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Appeal Dialog */}
      <Dialog open={appealDialogOpen} onOpenChange={setAppealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khiếu nại phạt</DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do khiếu nại. Admin sẽ xem xét trong vòng 24-48h.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lý do khiếu nại</Label>
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Mô tả chi tiết lý do bạn cho rằng việc phạt này không hợp lý..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitAppeal} disabled={!appealReason || appealPenalty.isPending}>
              Gửi khiếu nại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
