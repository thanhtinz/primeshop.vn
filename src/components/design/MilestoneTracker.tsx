import { useState } from 'react';
import { Check, Circle, Clock, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDesignMilestones, useUpdateDesignMilestone } from '@/hooks/useDesignAdvanced';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MilestoneTrackerProps {
  orderId: string;
  isBuyer: boolean;
  isSeller: boolean;
  currentMilestoneId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ bắt đầu', color: 'bg-gray-500', icon: Circle },
  in_progress: { label: 'Đang thực hiện', color: 'bg-blue-500', icon: Clock },
  submitted: { label: 'Đã giao', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'Đã duyệt', color: 'bg-green-500', icon: Check },
  rejected: { label: 'Yêu cầu sửa', color: 'bg-red-500', icon: AlertCircle },
};

export function MilestoneTracker({ orderId, isBuyer, isSeller, currentMilestoneId }: MilestoneTrackerProps) {
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();
  const { data: milestones, isLoading } = useDesignMilestones(orderId);
  const updateMilestone = useUpdateDesignMilestone();
  
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'submit' | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const approvedCount = milestones.filter(m => m.status === 'approved').length;
  const progress = (approvedCount / milestones.length) * 100;

  const handleAction = async () => {
    if (!selectedMilestone || !actionType) return;

    try {
      if (actionType === 'approve') {
        await updateMilestone.mutateAsync({
          id: selectedMilestone,
          orderId,
          status: 'approved',
          approved_at: new Date().toISOString(),
          buyer_feedback: feedback || undefined,
        });
        toast.success('Đã duyệt milestone!');
      } else if (actionType === 'reject') {
        await updateMilestone.mutateAsync({
          id: selectedMilestone,
          orderId,
          status: 'rejected',
          buyer_feedback: feedback,
        });
        toast.success('Đã yêu cầu chỉnh sửa');
      } else if (actionType === 'submit') {
        await updateMilestone.mutateAsync({
          id: selectedMilestone,
          orderId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          seller_notes: feedback || undefined,
        });
        toast.success('Đã giao milestone!');
      }
      
      setSelectedMilestone(null);
      setFeedback('');
      setActionType(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Tiến độ Milestone
            </CardTitle>
            <Badge variant="secondary">
              {approvedCount}/{milestones.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.map((milestone, index) => {
            const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const isActive = milestone.id === currentMilestoneId;
            
            return (
              <div 
                key={milestone.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  isActive && 'border-primary bg-primary/5',
                  milestone.status === 'approved' && 'bg-green-50 dark:bg-green-950/20 border-green-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    config.color,
                    'text-white'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm">{milestone.title}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatPrice(milestone.escrow_amount)}
                      </Badge>
                    </div>
                    
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                    
                    {milestone.deadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Deadline: {formatDate(milestone.deadline)}
                      </p>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {isSeller && milestone.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedMilestone(milestone.id);
                            setActionType('submit');
                          }}
                        >
                          Giao bài
                        </Button>
                      )}
                      
                      {isBuyer && milestone.status === 'submitted' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedMilestone(milestone.id);
                              setActionType('approve');
                            }}
                          >
                            Duyệt
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMilestone(milestone.id);
                              setActionType('reject');
                            }}
                          >
                            Yêu cầu sửa
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setFeedback(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Duyệt Milestone'}
              {actionType === 'reject' && 'Yêu cầu chỉnh sửa'}
              {actionType === 'submit' && 'Giao Milestone'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Xác nhận milestone này đã hoàn thành đúng yêu cầu'}
              {actionType === 'reject' && 'Mô tả những gì cần chỉnh sửa'}
              {actionType === 'submit' && 'Thêm ghi chú khi giao bài (không bắt buộc)'}
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder={
              actionType === 'reject' 
                ? 'Mô tả những điểm cần chỉnh sửa...' 
                : 'Ghi chú (không bắt buộc)...'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionType(null); setFeedback(''); }}>
              Hủy
            </Button>
            <Button 
              onClick={handleAction}
              disabled={updateMilestone.isPending || (actionType === 'reject' && !feedback)}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {updateMilestone.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' && 'Duyệt'}
              {actionType === 'reject' && 'Gửi yêu cầu'}
              {actionType === 'submit' && 'Giao bài'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
