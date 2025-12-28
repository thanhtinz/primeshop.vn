import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Plus, Trash2, CheckSquare, ListTodo, Copy, Calendar,
  Clock, AlertTriangle, ChevronDown, ChevronUp, Edit2, 
  MessageSquare, Paperclip, Users, Flag, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPast, isToday, isTomorrow } from 'date-fns';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  sortOrder: number;
  completedAt: string | null;
  completedBy: string | null;
  attachments: any[];
}

interface Checklist {
  id: string;
  title: string;
  description: string;
  scope: 'personal' | 'group';
  groupId: string | null;
  tags: string[];
  isTemplate: boolean;
  progressPercent: number;
  createdAt: string;
  tasks: Task[];
}

const PRIORITY_CONFIG = {
  low: { label: 'Thấp', color: 'bg-green-500/10 text-green-600', icon: '🟢' },
  medium: { label: 'Trung bình', color: 'bg-yellow-500/10 text-yellow-600', icon: '🟡' },
  high: { label: 'Cao', color: 'bg-red-500/10 text-red-600', icon: '🔴' },
};

const STATUS_CONFIG = {
  todo: { label: 'Chưa làm', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Đang làm', color: 'bg-blue-500/10 text-blue-600' },
  done: { label: 'Hoàn thành', color: 'bg-green-500/10 text-green-600' },
};

export function ChecklistManager() {
  const { user } = useAuth();
  const { formatDate, formatDateTime } = useDateFormat();
  const [activeTab, setActiveTab] = useState('list');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  
  // New checklist form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  
  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Load checklists
  const loadChecklists = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: checklistsData, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load tasks for each checklist
      const checklistsWithTasks = await Promise.all(
        (checklistsData || []).map(async (cl) => {
          const { data: tasksData } = await supabase
            .from('checklist_tasks')
            .select('*')
            .eq('checklist_id', cl.id)
            .order('sort_order', { ascending: true });

          const tasks: Task[] = (tasksData || []).map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: t.status as Task['status'],
            priority: t.priority as Task['priority'],
            deadline: t.deadline,
            sortOrder: t.sort_order,
            completedAt: t.completed_at,
            completedBy: t.completed_by,
            attachments: Array.isArray(t.attachments) ? t.attachments : [],
          }));

          const doneCount = tasks.filter(t => t.status === 'done').length;
          const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

          return {
            id: cl.id,
            title: cl.title,
            description: cl.description || '',
            scope: cl.scope as 'personal' | 'group',
            groupId: cl.group_id,
            tags: cl.tags || [],
            isTemplate: cl.is_template,
            progressPercent: progress,
            createdAt: cl.created_at,
            tasks,
          };
        })
      );

      setChecklists(checklistsWithTasks);
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadChecklists();
    }
  }, [user]);

  // Create checklist
  const createChecklist = async () => {
    if (!user || !newTitle.trim()) {
      toast.error('Vui lòng nhập tên checklist');
      return;
    }

    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
      
      const { error } = await supabase
        .from('checklists')
        .insert({
          user_id: user.id,
          title: newTitle,
          description: newDescription,
          scope: 'personal',
          tags,
        });

      if (error) throw error;

      toast.success('Đã tạo checklist');
      setNewTitle('');
      setNewDescription('');
      setNewTags('');
      setShowNewForm(false);
      loadChecklists();
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error('Lỗi khi tạo');
    }
  };

  // Add task
  const addTask = async (checklistId: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('Vui lòng nhập tên task');
      return;
    }

    try {
      const { error } = await supabase
        .from('checklist_tasks')
        .insert({
          checklist_id: checklistId,
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority,
          deadline: newTaskDeadline || null,
          sort_order: selectedChecklist?.tasks.length || 0,
        });

      if (error) throw error;

      toast.success('Đã thêm task');
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
      setNewTaskDeadline('');
      loadChecklists();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Lỗi khi thêm task');
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = { status };
      
      if (status === 'done') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('checklist_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      loadChecklists();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Lỗi khi cập nhật');
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('checklist_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Đã xóa task');
      loadChecklists();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Lỗi khi xóa');
    }
  };

  // Clone checklist
  const cloneChecklist = async (checklist: Checklist) => {
    if (!user) return;

    try {
      const { data: newChecklist, error: clError } = await supabase
        .from('checklists')
        .insert({
          user_id: user.id,
          title: `${checklist.title} (copy)`,
          description: checklist.description,
          scope: 'personal',
          tags: checklist.tags,
        })
        .select()
        .single();

      if (clError) throw clError;

      // Clone tasks
      if (checklist.tasks.length > 0) {
        const tasksToInsert = checklist.tasks.map((t, i) => ({
          checklist_id: newChecklist.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          deadline: t.deadline,
          sort_order: i,
          status: 'todo',
        }));

        await supabase.from('checklist_tasks').insert(tasksToInsert);
      }

      toast.success('Đã clone checklist');
      loadChecklists();
    } catch (error) {
      console.error('Error cloning checklist:', error);
      toast.error('Lỗi khi clone');
    }
  };

  // Delete checklist
  const deleteChecklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Đã xóa checklist');
      setSelectedChecklist(null);
      loadChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast.error('Lỗi khi xóa');
    }
  };

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    if (isPast(date) && !isToday(date)) {
      return { text: 'Quá hạn', className: 'text-red-500' };
    }
    if (isToday(date)) {
      return { text: 'Hôm nay', className: 'text-orange-500' };
    }
    if (isTomorrow(date)) {
      return { text: 'Ngày mai', className: 'text-yellow-500' };
    }
    return { text: formatDate(date), className: 'text-muted-foreground' };
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Đăng nhập để sử dụng Checklist
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Copy className="h-4 w-4" />
            Mẫu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          {/* New Checklist Form */}
          {showNewForm ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tạo Checklist mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Tên checklist *</Label>
                  <Input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Checklist deal ABC..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Mô tả ngắn..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (cách nhau bởi dấu phẩy)</Label>
                  <Input 
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="VD: mmo, deal, urgent"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createChecklist}>Tạo</Button>
                  <Button variant="outline" onClick={() => setShowNewForm(false)}>Hủy</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setShowNewForm(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Tạo Checklist mới
            </Button>
          )}

          {/* Checklists */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đang tải...
              </CardContent>
            </Card>
          ) : checklists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có checklist nào
              </CardContent>
            </Card>
          ) : (
            checklists.map((checklist) => (
              <Card key={checklist.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        {checklist.title}
                      </CardTitle>
                      {checklist.description && (
                        <p className="text-xs text-muted-foreground mt-1">{checklist.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {checklist.tasks.filter(t => t.status === 'done').length}/{checklist.tasks.length}
                      </Badge>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setSelectedChecklist(checklist)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>{checklist.title}</SheetTitle>
                          </SheetHeader>
                          <div className="mt-4 space-y-2">
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-2"
                              onClick={() => cloneChecklist(checklist)}
                            >
                              <Copy className="h-4 w-4" />
                              Clone checklist
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                              onClick={() => deleteChecklist(checklist.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa checklist
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {checklist.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {checklist.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Tiến độ</span>
                      <span className="font-medium">{Math.round(checklist.progressPercent)}%</span>
                    </div>
                    <Progress value={checklist.progressPercent} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Tasks */}
                  <div className="space-y-2 mt-3">
                    {checklist.tasks.map((task) => {
                      const deadlineInfo = getDeadlineInfo(task.deadline);
                      return (
                        <div 
                          key={task.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border ${
                            task.status === 'done' ? 'bg-muted/50 opacity-60' : 'bg-background'
                          }`}
                        >
                          <Checkbox 
                            checked={task.status === 'done'}
                            onCheckedChange={(checked) => 
                              updateTaskStatus(task.id, checked ? 'done' : 'todo')
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${task.status === 'done' ? 'line-through' : ''}`}>
                                {task.title}
                              </span>
                              <span className="text-xs">{PRIORITY_CONFIG[task.priority].icon}</span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {deadlineInfo && (
                                <span className={`text-xs flex items-center gap-1 ${deadlineInfo.className}`}>
                                  <Calendar className="h-3 w-3" />
                                  {deadlineInfo.text}
                                </span>
                              )}
                              {task.completedAt && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDateTime(task.completedAt, 'HH:mm dd/MM')}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Task */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3 text-muted-foreground"
                        onClick={() => setSelectedChecklist(checklist)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Thêm Task mới</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Tên task *</Label>
                          <Input 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nhập tên task..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mô tả</Label>
                          <Textarea 
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            placeholder="Mô tả ngắn..."
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Mức độ ưu tiên</Label>
                            <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🟢 Thấp</SelectItem>
                                <SelectItem value="medium">🟡 Trung bình</SelectItem>
                                <SelectItem value="high">🔴 Cao</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Deadline</Label>
                            <Input 
                              type="datetime-local"
                              value={newTaskDeadline}
                              onChange={(e) => setNewTaskDeadline(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => selectedChecklist && addTask(selectedChecklist.id)}
                        >
                          Thêm Task
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Copy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Clone từ checklist có sẵn để tạo mẫu</p>
              <p className="text-xs mt-1">Dùng nút Clone ở mỗi checklist</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}