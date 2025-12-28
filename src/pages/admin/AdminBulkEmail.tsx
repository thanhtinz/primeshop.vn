import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Users, Crown, Send, Loader2, Search, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  vip_level_id: string | null;
  vip_levels?: { name: string } | null;
}

const AdminBulkEmail = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'vip' | 'selected'>('all');
  const [selectedVipLevel, setSelectedVipLevel] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: profilesData }, { data: vipData }] = await Promise.all([
        supabase.from('profiles').select('*, vip_levels(name)').order('email'),
        supabase.from('vip_levels').select('*').order('sort_order'),
      ]);
      setUsers(profilesData || []);
      setVipLevels(vipData || []);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetUsers = () => {
    switch (targetType) {
      case 'all':
        return users;
      case 'vip':
        return users.filter(u => u.vip_level_id === selectedVipLevel);
      case 'selected':
        return users.filter(u => selectedUserIds.includes(u.user_id));
      default:
        return [];
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    const filtered = users.filter(u =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSelectedUserIds(filtered.map(u => u.user_id));
  };

  const handleSendEmails = async () => {
    if (!subject || !message) {
      toast.error('Vui lòng nhập tiêu đề và nội dung email');
      return;
    }

    const targetUsers = getTargetUsers();
    if (targetUsers.length === 0) {
      toast.error('Không có người nhận nào được chọn');
      return;
    }

    if (!confirm(`Bạn có chắc muốn gửi email cho ${targetUsers.length} người dùng?`)) {
      return;
    }

    setIsSending(true);
    setSentCount(0);

    try {
      let successCount = 0;
      for (const user of targetUsers) {
        try {
          const { error } = await supabase.functions.invoke('send-email', {
            body: {
              recipient: user.email,
              subject: subject,
              html: message.replace(/\n/g, '<br>'),
              template_name: 'bulk_email'
            },
          });
          
          if (!error) {
            successCount++;
            setSentCount(successCount);
          }
        } catch (err) {
          console.error(`Failed to send to ${user.email}:`, err);
        }
      }

      toast.success(`Đã gửi thành công ${successCount}/${targetUsers.length} email`);
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error('Lỗi khi gửi email');
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const targetCount = getTargetUsers().length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Gửi email hàng loạt</h1>
            <p className="text-sm text-muted-foreground">Gửi thông báo đến nhiều người dùng</p>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Users className="h-4 w-4 mr-1" />
          {users.length} người dùng
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Target Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chọn đối tượng</CardTitle>
            <CardDescription>Chọn nhóm người nhận email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Loại đối tượng</Label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tất cả người dùng ({users.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="vip">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Theo cấp VIP
                    </div>
                  </SelectItem>
                  <SelectItem value="selected">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Chọn thủ công
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === 'vip' && (
              <div className="space-y-2">
                <Label>Chọn cấp VIP</Label>
                <Select value={selectedVipLevel} onValueChange={setSelectedVipLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn cấp VIP..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {vipLevels.map(vip => (
                      <SelectItem key={vip.id} value={vip.id}>
                        {vip.name} ({users.filter(u => u.vip_level_id === vip.id).length} người)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === 'selected' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Đã chọn: {selectedUserIds.length}</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={selectAllFiltered}>
                      Chọn tất cả
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedUserIds([])}>
                      Bỏ chọn
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map(user => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleUserSelection(user.user_id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.full_name || '-'}</span>
                          {user.vip_levels && (
                            <Badge variant="outline" className="text-xs">
                              {user.vip_levels.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Số người nhận:</strong> {targetCount} người
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nội dung email</CardTitle>
            <CardDescription>Soạn nội dung email gửi đi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nhập tiêu đề email..."
              />
            </div>
            <div className="space-y-2">
              <Label>Nội dung *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập nội dung email..."
                rows={10}
              />
            </div>

            {isSending && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi... ({sentCount}/{targetCount})
                </div>
              </div>
            )}

            <Button
              onClick={handleSendEmails}
              disabled={isSending || !subject || !message || targetCount === 0}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi cho {targetCount} người
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBulkEmail;
