import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useGroupTasks, useCreateGroupTask, useUpdateTaskStatus, TaskStatus } from '@/hooks/useGroupTasks';
import { useGroupMembers } from '@/hooks/useGroups';
import { Plus, Loader2, Clock, CheckCircle2, Circle, Play } from 'lucide-react';
import { format } from 'date-fns';

interface GroupTasksTabProps {
  groupId: string;
  membership: { role: string } | null;
  canManage: boolean;
}

const statusConfig = {
  pending: { label: 'Chờ', icon: Circle, color: 'text-muted-foreground' },
  doing: { label: 'Đang làm', icon: Play, color: 'text-blue-500' },
  done: { label: 'Hoàn thành', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Hủy', icon: Circle, color: 'text-red-500' },
};

export function GroupTasksTab({ groupId, membership, canManage }: GroupTasksTabProps) {
  const { data: tasks, isLoading } = useGroupTasks(groupId);
  const { data: members } = useGroupMembers(groupId);
  const createTask = useCreateGroupTask();
  const updateStatus = useUpdateTaskStatus();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: '',
    deadline: '',
    reward_points: 0,
    penalty_points: 0,
  });
  
  const handleCreate = async () => {
    await createTask.mutateAsync({
      group_id: groupId,
      title: formData.title,
      description: formData.description || undefined,
      assigned_to: formData.assignee_id ? [formData.assignee_id] : undefined,
      deadline: formData.deadline || undefined,
      reward_points: formData.reward_points || undefined,
      penalty_points: formData.penalty_points || undefined,
    });
    
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      assignee_id: '',
      deadline: '',
      reward_points: 0,
      penalty_points: 0,
    });
  };
  
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatus.mutate({ taskId, groupId, status });
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
      {/* Create Task Button */}
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo Task mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tiêu đề *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề task"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Chi tiết task"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giao cho</Label>
                  <Select 
                    value={formData.assignee_id} 
                    onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thành viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map((m) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.profile?.full_name || 'Người dùng'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Điểm thưởng</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.reward_points}
                      onChange={(e) => setFormData({ ...formData, reward_points: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Điểm phạt</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.penalty_points}
                      onChange={(e) => setFormData({ ...formData, penalty_points: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreate}
                  disabled={createTask.isPending || !formData.title}
                >
                  {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tạo Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Tasks List */}
      {tasks?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có task nào
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks?.map((task) => {
            const statusInfo = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            const firstAssignee = task.assignees?.[0];
            
            return (
              <Card key={task.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${statusInfo.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {canManage && (
                          <Select 
                            value={task.status} 
                            onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ</SelectItem>
                              <SelectItem value="doing">Đang làm</SelectItem>
                              <SelectItem value="done">Hoàn thành</SelectItem>
                              <SelectItem value="cancelled">Hủy</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {firstAssignee && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={firstAssignee.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {firstAssignee.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{firstAssignee.full_name}</span>
                          </div>
                        )}
                        
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(task.deadline), 'dd/MM HH:mm')}
                          </div>
                        )}
                        
                        {task.reward_points > 0 && (
                          <Badge variant="secondary" className="text-green-600">
                            +{task.reward_points} điểm
                          </Badge>
                        )}
                        
                        {task.penalty_points > 0 && (
                          <Badge variant="secondary" className="text-red-600">
                            -{task.penalty_points} điểm
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
