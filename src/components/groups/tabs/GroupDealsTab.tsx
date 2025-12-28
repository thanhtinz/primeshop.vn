import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useGroupDeals, useCreateGroupDeal, useJoinGroupDeal, useUpdateDealStatus } from '@/hooks/useGroupDeals';
import { Plus, Loader2, Users, Clock, DollarSign } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

interface GroupDealsTabProps {
  groupId: string;
  membership: { role: string } | null;
  canManage: boolean;
}

const statusConfig = {
  open: { label: 'Đang mở', color: 'bg-green-500' },
  in_progress: { label: 'Đang chạy', color: 'bg-blue-500' },
  completed: { label: 'Hoàn thành', color: 'bg-primary' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500' },
  disputed: { label: 'Tranh chấp', color: 'bg-orange-500' },
};

export function GroupDealsTab({ groupId, membership, canManage }: GroupDealsTabProps) {
  const { formatDateTime } = useDateFormat();
  const { data: deals, isLoading } = useGroupDeals(groupId);
  const createDeal = useCreateGroupDeal();
  const joinDeal = useJoinGroupDeal();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_participants: 0,
    end_time: '',
    total_pool: 0,
    winner_reward: 0,
  });
  
  const handleCreate = async () => {
    await createDeal.mutateAsync({
      group_id: groupId,
      title: formData.title,
      description: formData.description || undefined,
      max_participants: formData.max_participants || undefined,
      end_time: formData.end_time || undefined,
      total_pool: formData.total_pool || undefined,
      winner_reward: formData.winner_reward || undefined,
    });
    
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      max_participants: 0,
      end_time: '',
      total_pool: 0,
      winner_reward: 0,
    });
  };
  
  const handleJoin = (dealId: string) => {
    joinDeal.mutate({ dealId });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Create Deal Button */}
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo Deal/Kèo mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Tiêu đề *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề deal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Chi tiết deal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tối đa người (0 = không giới hạn)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kết thúc</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tổng pool (VNĐ)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.total_pool}
                      onChange={(e) => setFormData({ ...formData, total_pool: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thưởng người thắng</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.winner_reward}
                      onChange={(e) => setFormData({ ...formData, winner_reward: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreate}
                  disabled={createDeal.isPending || !formData.title}
                >
                  {createDeal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tạo Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Deals List */}
      {deals?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có deal nào
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals?.map((deal) => {
            const statusInfo = statusConfig[deal.status as keyof typeof statusConfig] || statusConfig.open;
            const participantCount = deal.participant_count || deal.participants?.length || 0;
            const maxParticipants = deal.max_participants || 0;
            const progress = maxParticipants > 0 
              ? (participantCount / maxParticipants) * 100 
              : 0;
            
            return (
              <Card key={deal.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">{deal.title}</h4>
                        <Badge className={`${statusInfo.color} text-white`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tạo bởi: {deal.creator?.full_name || 'Người dùng'}
                      </p>
                    </div>
                    
                    {deal.status === 'open' && membership && (
                      <Button 
                        size="sm"
                        onClick={() => handleJoin(deal.id)}
                        disabled={joinDeal.isPending}
                      >
                        Tham gia
                      </Button>
                    )}
                  </div>
                  
                  {deal.description && (
                    <p className="text-sm mb-3">{deal.description}</p>
                  )}
                  
                  {/* Progress */}
                  {maxParticipants > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tiến độ tham gia</span>
                        <span>{participantCount}/{maxParticipants}</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {participantCount} người tham gia
                    </span>
                    
                    {deal.end_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Hết: {formatDateTime(deal.end_time, 'dd/MM HH:mm')}
                      </span>
                    )}
                    
                    {deal.total_pool > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-4 w-4" />
                        {deal.total_pool.toLocaleString()}đ
                      </span>
                    )}
                  </div>
                  
                  {/* Participants */}
                  {deal.participants && deal.participants.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium mb-2">Người tham gia:</p>
                      <div className="flex -space-x-2">
                        {deal.participants.slice(0, 5).map((p) => (
                          <Avatar key={p.user_id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={p.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {p.profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {deal.participants.length > 5 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{deal.participants.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
