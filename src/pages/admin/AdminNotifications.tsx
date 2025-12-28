import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Bell, 
  Send, 
  Users, 
  Loader2,
  ShoppingBag,
  Gift,
  Tag,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';

const notificationTypes = [
  { value: 'system', label: 'Hệ thống', icon: Info, color: 'bg-blue-500' },
  { value: 'promotion', label: 'Khuyến mãi', icon: Gift, color: 'bg-green-500' },
  { value: 'order', label: 'Đơn hàng', icon: ShoppingBag, color: 'bg-orange-500' },
  { value: 'voucher', label: 'Voucher', icon: Tag, color: 'bg-purple-500' },
  { value: 'warning', label: 'Cảnh báo', icon: AlertTriangle, color: 'bg-yellow-500' },
];

const AdminNotifications = () => {
  const queryClient = useQueryClient();
  const { formatDateTime } = useDateFormat();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system');
  const [link, setLink] = useState('');

  // Fetch all users for sending notifications
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent sent notifications (admin view)
  const { data: recentNotifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['admin-recent-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Send notification to all users
  const sendNotification = useMutation({
    mutationFn: async () => {
      if (!users || users.length === 0) {
        throw new Error('Không có người dùng nào');
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        user_id: user.user_id,
        type,
        title,
        message,
        link: link || null,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return notifications.length;
    },
    onSuccess: (count) => {
      toast.success(`Đã gửi thông báo đến ${count} người dùng`);
      setTitle('');
      setMessage('');
      setLink('');
      queryClient.invalidateQueries({ queryKey: ['admin-recent-notifications'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSend = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }
    sendNotification.mutate();
  };

  const getTypeInfo = (typeValue: string) => {
    return notificationTypes.find(t => t.value === typeValue) || notificationTypes[0];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Gửi thông báo</h1>
        <p className="text-sm text-muted-foreground">Gửi thông báo hệ thống đến tất cả người dùng</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Send Notification Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Send className="h-5 w-5" />
              Tạo thông báo mới
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Thông báo sẽ được gửi đến {users?.length || 0} người dùng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Loại thông báo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nội dung *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung thông báo..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (tuỳ chọn)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/vouchers hoặc /product/san-pham"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Xem trước</Label>
              <div className="p-3 border rounded-lg bg-card">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeInfo(type).color}`}>
                    {(() => {
                      const TypeIcon = getTypeInfo(type).icon;
                      return <TypeIcon className="h-4 w-4 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{title || 'Tiêu đề thông báo'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {message || 'Nội dung thông báo sẽ hiển thị ở đây...'}
                    </p>
                    {link && (
                      <p className="text-xs text-primary mt-1">{link}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <Button 
              className="w-full" 
              onClick={handleSend}
              disabled={sendNotification.isPending || loadingUsers}
            >
              {sendNotification.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi đến tất cả ({users?.length || 0})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-5 w-5" />
              Thông báo gần đây
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              20 thông báo được gửi gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentNotifications && recentNotifications.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {recentNotifications.map((notification) => {
                  const typeInfo = getTypeInfo(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className="flex items-start gap-2 p-2 rounded-lg border bg-card/50"
                    >
                      <div className={`p-1.5 rounded-lg ${typeInfo.color} flex-shrink-0`}>
                        <typeInfo.icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-xs truncate">{notification.title}</p>
                          {notification.is_read && (
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(notification.created_at, 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{users?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Tổng người dùng</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Bell className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{recentNotifications?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Thông báo gần đây</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Gift className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {recentNotifications?.filter(n => n.type === 'promotion').length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Khuyến mãi đã gửi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
