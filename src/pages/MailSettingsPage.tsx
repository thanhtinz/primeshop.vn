import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Bell,
  Mail,
  Shield,
  Palette,
  Filter,
  Users,
  Signature,
  Clock,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMailbox, useUpdateMailbox, useMailSettings, useUpdateMailSettings, useMailLabels, useCreateLabel } from '@/hooks/useMail';
import type { Mailbox, MailSettings } from '@/types/mail';

const MailSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: mailbox, isLoading: mailboxLoading } = useMailbox();
  const { data: settings, isLoading: settingsLoading } = useMailSettings(mailbox?.id);
  const { data: labels } = useMailLabels(mailbox?.id);
  const updateMailbox = useUpdateMailbox();
  const updateSettings = useUpdateMailSettings();
  const createLabel = useCreateLabel();

  const [displayName, setDisplayName] = useState('');
  const [signature, setSignature] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6b7280');

  // Local settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [conversationView, setConversationView] = useState(true);
  const [previewPane, setPreviewPane] = useState<'right' | 'bottom' | 'none'>('right');
  const [messagesPerPage, setMessagesPerPage] = useState(25);

  React.useEffect(() => {
    if (mailbox) {
      setDisplayName(mailbox.display_name || '');
      setSignature(mailbox.signature || '');
      setAutoReplyEnabled(mailbox.auto_reply_enabled);
      setAutoReplyMessage(mailbox.auto_reply_message || '');
    }
  }, [mailbox]);

  React.useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.notifications_enabled);
      setDesktopNotifications(settings.desktop_notifications);
      setEmailNotifications(settings.email_notifications);
      setConversationView(settings.conversation_view);
      setPreviewPane(settings.preview_pane);
      setMessagesPerPage(settings.messages_per_page);
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    if (!mailbox) return;
    await updateMailbox.mutateAsync({
      id: mailbox.id,
      display_name: displayName,
      signature,
      auto_reply_enabled: autoReplyEnabled,
      auto_reply_message: autoReplyMessage,
    });
  };

  const handleSaveSettings = async () => {
    if (!mailbox) return;
    await updateSettings.mutateAsync({
      mailbox_id: mailbox.id,
      notifications_enabled: notificationsEnabled,
      desktop_notifications: desktopNotifications,
      email_notifications: emailNotifications,
      conversation_view: conversationView,
      preview_pane: previewPane,
      messages_per_page: messagesPerPage,
    });
  };

  const handleCreateLabel = async () => {
    if (!mailbox || !newLabelName.trim()) return;
    await createLabel.mutateAsync({
      mailbox_id: mailbox.id,
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    setNewLabelName('');
  };

  const LABEL_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#6b7280', '#78716c', '#71717a',
  ];

  if (mailboxLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mailbox) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Chưa có hộp thư</h3>
          <p className="text-muted-foreground mb-4">Bạn cần tạo hộp thư trước</p>
          <Button onClick={() => navigate('/mail')}>Tạo hộp thư</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="container max-w-4xl py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/mail')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Cài đặt Email</h1>
              <p className="text-sm text-muted-foreground">{mailbox.email_address}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="labels" className="gap-2">
              <Palette className="h-4 w-4" />
              Nhãn
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Mail className="h-4 w-4" />
              Hiển thị
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Thông tin tài khoản
                  </CardTitle>
                  <CardDescription>
                    Quản lý thông tin hộp thư của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-2xl">
                        {displayName?.slice(0, 2).toUpperCase() || mailbox.email_address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{displayName || mailbox.email_address}</h3>
                      <p className="text-sm text-muted-foreground">{mailbox.email_address}</p>
                      <Badge variant="secondary" className="mt-1">
                        Hoạt động
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên hiển thị..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Tên này sẽ hiển thị khi bạn gửi email
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Signature */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Signature className="h-5 w-5" />
                    Chữ ký
                  </CardTitle>
                  <CardDescription>
                    Tạo chữ ký tự động cho email của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Nhập chữ ký của bạn..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Auto Reply */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Trả lời tự động
                  </CardTitle>
                  <CardDescription>
                    Tự động trả lời khi bạn không thể phản hồi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bật trả lời tự động</Label>
                      <p className="text-sm text-muted-foreground">
                        Gửi phản hồi tự động cho email đến
                      </p>
                    </div>
                    <Switch
                      checked={autoReplyEnabled}
                      onCheckedChange={setAutoReplyEnabled}
                    />
                  </div>

                  {autoReplyEnabled && (
                    <div className="space-y-2">
                      <Label>Nội dung trả lời</Label>
                      <Textarea
                        value={autoReplyMessage}
                        onChange={(e) => setAutoReplyMessage(e.target.value)}
                        placeholder="Xin chào, tôi hiện không thể phản hồi email. Tôi sẽ liên hệ lại sớm nhất có thể."
                        rows={4}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Cài đặt thông báo
                  </CardTitle>
                  <CardDescription>
                    Quản lý cách bạn nhận thông báo về email mới
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Thông báo</Label>
                      <p className="text-sm text-muted-foreground">
                        Bật/tắt tất cả thông báo
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Thông báo trên desktop</Label>
                      <p className="text-sm text-muted-foreground">
                        Hiển thị popup thông báo trên màn hình
                      </p>
                    </div>
                    <Switch
                      checked={desktopNotifications}
                      onCheckedChange={setDesktopNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Thông báo qua email</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo quan trọng qua email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} className="gap-2">
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Labels Tab */}
          <TabsContent value="labels">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Quản lý nhãn
                  </CardTitle>
                  <CardDescription>
                    Tạo và quản lý nhãn để tổ chức email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create Label */}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Tên nhãn mới..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      {LABEL_COLORS.slice(0, 10).map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            newLabelColor === color ? 'scale-125 border-foreground' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewLabelColor(color)}
                        />
                      ))}
                    </div>
                    <Button onClick={handleCreateLabel} disabled={!newLabelName.trim()}>
                      Tạo
                    </Button>
                  </div>

                  <Separator />

                  {/* Label List */}
                  <div className="space-y-2">
                    {labels?.map(label => (
                      <div
                        key={label.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span>{label.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Xóa
                        </Button>
                      </div>
                    ))}

                    {(!labels || labels.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        Chưa có nhãn nào. Tạo nhãn đầu tiên của bạn!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Cài đặt hiển thị
                  </CardTitle>
                  <CardDescription>
                    Tùy chỉnh cách hiển thị email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Xem theo cuộc hội thoại</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhóm email theo chủ đề
                      </p>
                    </div>
                    <Switch
                      checked={conversationView}
                      onCheckedChange={setConversationView}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Vị trí xem trước</Label>
                    <Select value={previewPane} onValueChange={(v: any) => setPreviewPane(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Bên phải</SelectItem>
                        <SelectItem value="bottom">Phía dưới</SelectItem>
                        <SelectItem value="none">Không hiển thị</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Số email mỗi trang</Label>
                    <Select
                      value={messagesPerPage.toString()}
                      onValueChange={(v) => setMessagesPerPage(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} className="gap-2">
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MailSettingsPage;
