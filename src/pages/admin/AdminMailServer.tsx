import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Plus,
  Search,
  Settings,
  Users,
  Mail,
  Shield,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  Copy,
  ExternalLink,
  ChevronRight,
  Server,
  Lock,
  Unlock,
  UserPlus,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useMailDomains,
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
  useAdminMailboxes,
  useAdminCreateMailbox,
  useAdminUpdateMailbox,
  useAdminDeleteMailbox,
  useDomainAdmins,
  useAddDomainAdmin,
  useRemoveDomainAdmin,
  useDomainStats,
  useMailAliases,
  useCreateAlias,
  useDeleteAlias,
} from '@/hooks/useMailAdmin';
import { useSystemMailbox, useSystemSentEmails } from '@/hooks/useMailAdmin';
import type { MailDomain, Mailbox, MailAlias } from '@/types/mail';

const AdminMailServer = () => {
  const [activeTab, setActiveTab] = useState('domains');
  const [selectedDomain, setSelectedDomain] = useState<MailDomain | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Domain dialogs
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<MailDomain | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<MailDomain | null>(null);

  // Mailbox dialogs
  const [mailboxDialogOpen, setMailboxDialogOpen] = useState(false);
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null);
  const [mailboxDeleteDialog, setMailboxDeleteDialog] = useState(false);
  const [mailboxToDelete, setMailboxToDelete] = useState<Mailbox | null>(null);

  // Admin dialog
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  // Alias dialog
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);

  // System emails pagination
  const [systemEmailsPage, setSystemEmailsPage] = useState(1);

  // Queries
  const { data: domains, isLoading: domainsLoading } = useMailDomains();
  const { data: systemMailbox } = useSystemMailbox();
  const { data: systemEmailsData, isLoading: systemEmailsLoading } = useSystemSentEmails(systemEmailsPage, 20);
  const { data: mailboxes, isLoading: mailboxesLoading } = useAdminMailboxes(selectedDomain?.id);
  const { data: domainAdmins } = useDomainAdmins(selectedDomain?.id);
  const { data: domainStats } = useDomainStats(selectedDomain?.id);
  const { data: aliases } = useMailAliases(selectedDomain?.id);

  // Mutations
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();
  const createMailbox = useAdminCreateMailbox();
  const updateMailbox = useAdminUpdateMailbox();
  const deleteMailbox = useAdminDeleteMailbox();
  const addAdmin = useAddDomainAdmin();
  const removeAdmin = useRemoveDomainAdmin();
  const createAlias = useCreateAlias();
  const deleteAlias = useDeleteAlias();

  const handleOpenDomainDialog = (domain?: MailDomain) => {
    setEditingDomain(domain || null);
    setDomainDialogOpen(true);
  };

  const handleOpenMailboxDialog = (mailbox?: Mailbox) => {
    setEditingMailbox(mailbox || null);
    setMailboxDialogOpen(true);
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;
    await deleteDomain.mutateAsync(domainToDelete.id);
    setDeleteDialogOpen(false);
    setDomainToDelete(null);
    if (selectedDomain?.id === domainToDelete.id) {
      setSelectedDomain(null);
    }
  };

  const handleDeleteMailbox = async () => {
    if (!mailboxToDelete) return;
    await deleteMailbox.mutateAsync(mailboxToDelete.id);
    setMailboxDeleteDialog(false);
    setMailboxToDelete(null);
  };

  const filteredDomains = domains?.filter(d =>
    d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMailboxes = mailboxes?.filter(m =>
    m.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Quản lý Mail Server
          </h1>
          <p className="text-muted-foreground">
            Quản lý tên miền, mailbox, alias và phân quyền
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{domains?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Tên miền</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {domains?.reduce((sum, d) => sum + (d.mailbox_count || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Mailbox</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{aliases?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Alias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((domainStats?.total_storage_mb || 0) / 1024).toFixed(1)} GB
                </p>
                <p className="text-sm text-muted-foreground">Dung lượng sử dụng</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Domain List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tên miền</CardTitle>
              <Button size="sm" onClick={() => handleOpenDomainDialog()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-2">
                {domainsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                ) : filteredDomains?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có tên miền</div>
                ) : (
                  filteredDomains?.map((domain) => (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors',
                        selectedDomain?.id === domain.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{domain.domain}</p>
                        <p className={cn(
                          'text-xs truncate',
                          selectedDomain?.id === domain.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}>
                          {domain.mailbox_count || 0} mailbox
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {domain.is_default && (
                          <Badge variant="secondary" className="text-[10px] h-5">Mặc định</Badge>
                        )}
                        {domain.is_active ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Domain Details */}
        <Card className="lg:col-span-3">
          {selectedDomain ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {selectedDomain.domain}
                      {selectedDomain.is_default && (
                        <Badge>Mặc định</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedDomain.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDomainDialog(selectedDomain)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAdminDialogOpen(true)}>
                          <Users className="h-4 w-4 mr-2" />
                          Quản trị viên
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Bảo mật
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Activity className="h-4 w-4 mr-2" />
                          Nhật ký
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={selectedDomain.is_default}
                          onClick={() => {
                            setDomainToDelete(selectedDomain);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa tên miền
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="mailboxes">
                      <Mail className="h-4 w-4 mr-2" />
                      Mailbox ({selectedDomain.mailbox_count || 0})
                    </TabsTrigger>
                    <TabsTrigger value="aliases">
                      <Copy className="h-4 w-4 mr-2" />
                      Alias
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt
                    </TabsTrigger>
                    <TabsTrigger value="stats">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Thống kê
                    </TabsTrigger>
                  </TabsList>

                  {/* Mailboxes Tab */}
                  <TabsContent value="mailboxes" className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm mailbox..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button onClick={() => handleOpenMailboxDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Mailbox
                      </Button>
                    </div>

                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Hiển thị</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Dung lượng</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mailboxesLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                Đang tải...
                              </TableCell>
                            </TableRow>
                          ) : filteredMailboxes?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                Chưa có mailbox nào
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredMailboxes?.map((mailbox) => (
                              <TableRow key={mailbox.id}>
                                <TableCell className="font-medium">
                                  {mailbox.email_address}
                                </TableCell>
                                <TableCell>{mailbox.display_name}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    mailbox.role === 'super_admin' ? 'destructive' :
                                    mailbox.role === 'admin' ? 'default' : 'secondary'
                                  }>
                                    {mailbox.role === 'super_admin' ? 'Super Admin' :
                                     mailbox.role === 'admin' ? 'Admin' : 'User'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>{mailbox.used_storage_mb || 0} MB</span>
                                      <span className="text-muted-foreground">/ {mailbox.quota_mb} MB</span>
                                    </div>
                                    <Progress
                                      value={((mailbox.used_storage_mb || 0) / mailbox.quota_mb) * 100}
                                      className="h-1.5"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {mailbox.is_active ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      Hoạt động
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-600">
                                      Vô hiệu
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleOpenMailboxDialog(mailbox)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Chỉnh sửa
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        updateMailbox.mutate({
                                          id: mailbox.id,
                                          is_active: !mailbox.is_active
                                        });
                                      }}>
                                        {mailbox.is_active ? (
                                          <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Vô hiệu hóa
                                          </>
                                        ) : (
                                          <>
                                            <Unlock className="h-4 w-4 mr-2" />
                                            Kích hoạt
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setMailboxToDelete(mailbox);
                                          setMailboxDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Xóa mailbox
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Aliases Tab */}
                  <TabsContent value="aliases" className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Alias cho phép chuyển tiếp email đến mailbox khác
                      </p>
                      <Button onClick={() => setAliasDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Alias
                      </Button>
                    </div>

                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Alias</TableHead>
                            <TableHead>Chuyển đến</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aliases?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Chưa có alias nào
                              </TableCell>
                            </TableRow>
                          ) : (
                            aliases?.map((alias: any) => (
                              <TableRow key={alias.id}>
                                <TableCell className="font-medium">
                                  {alias.local_part}@{alias.mail_domains?.domain}
                                </TableCell>
                                <TableCell>{alias.mailboxes?.email_address}</TableCell>
                                <TableCell>
                                  {alias.is_active ? (
                                    <Badge variant="outline" className="text-green-600">Hoạt động</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-600">Vô hiệu</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => deleteAlias.mutate(alias.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="mt-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Cài đặt chung</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Cho phép đăng ký công khai</Label>
                            <Switch
                              checked={selectedDomain.is_public}
                              onCheckedChange={(checked) => {
                                updateDomain.mutate({ id: selectedDomain.id, is_public: checked });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Trạng thái hoạt động</Label>
                            <Switch
                              checked={selectedDomain.is_active}
                              onCheckedChange={(checked) => {
                                updateDomain.mutate({ id: selectedDomain.id, is_active: checked });
                              }}
                            />
                          </div>
                        </div>

                        <Separator />

                        <h3 className="font-medium">Giới hạn</h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Số mailbox tối đa (0 = không giới hạn)</Label>
                            <Input
                              type="number"
                              value={selectedDomain.max_mailboxes}
                              onChange={(e) => {
                                updateDomain.mutate({
                                  id: selectedDomain.id,
                                  max_mailboxes: parseInt(e.target.value) || 0
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Dung lượng mặc định (MB)</Label>
                            <Input
                              type="number"
                              value={selectedDomain.max_storage_mb}
                              onChange={(e) => {
                                updateDomain.mutate({
                                  id: selectedDomain.id,
                                  max_storage_mb: parseInt(e.target.value) || 1024
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Kích thước file đính kèm tối đa (MB)</Label>
                            <Input
                              type="number"
                              value={selectedDomain.max_message_size_mb}
                              onChange={(e) => {
                                updateDomain.mutate({
                                  id: selectedDomain.id,
                                  max_message_size_mb: parseInt(e.target.value) || 25
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium">Bản ghi DNS</h3>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium mb-1">MX Record</p>
                            <code className="text-xs">
                              {selectedDomain.domain}. IN MX 10 mail.{selectedDomain.domain}.
                            </code>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium mb-1">SPF Record</p>
                            <code className="text-xs">
                              {selectedDomain.spf_record || `v=spf1 include:_spf.${selectedDomain.domain} ~all`}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <div className={cn(
                              'h-3 w-3 rounded-full',
                              selectedDomain.mx_verified ? 'bg-green-500' : 'bg-yellow-500'
                            )} />
                            <span className="text-sm">
                              {selectedDomain.mx_verified ? 'MX đã xác minh' : 'Chưa xác minh MX'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Stats Tab */}
                  <TabsContent value="stats" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold">{domainStats?.total_mailboxes || 0}</p>
                          <p className="text-sm text-muted-foreground">Tổng Mailbox</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold">{domainStats?.active_mailboxes || 0}</p>
                          <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold">{domainStats?.messages_today || 0}</p>
                          <p className="text-sm text-muted-foreground">Thư hôm nay</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-3xl font-bold">
                            {((domainStats?.total_storage_mb || 0) / 1024).toFixed(1)} GB
                          </p>
                          <p className="text-sm text-muted-foreground">Dung lượng</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-1">Chọn một tên miền</h3>
              <p className="text-muted-foreground text-sm text-center">
                Chọn tên miền từ danh sách bên trái để xem chi tiết và quản lý
              </p>
              <Button className="mt-4" onClick={() => handleOpenDomainDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo tên miền mới
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* System Emails Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Email Tự Động (System)
              </CardTitle>
              <CardDescription>
                Tất cả email tự động được gửi từ hệ thống (xác thực, đơn hàng, thông báo...)
                {systemMailbox && (
                  <span className="ml-2 font-medium text-primary">
                    Từ: {systemMailbox.email_address}
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {systemEmailsData?.total || 0} email
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người nhận</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemEmailsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : !systemEmailsData?.messages?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có email tự động nào được gửi
                    </TableCell>
                  </TableRow>
                ) : (
                  systemEmailsData.messages.map((email: any) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {email.recipients?.[0] || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {email.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {email.metadata?.template_name || 'custom'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(email.sent_at || email.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          email.metadata?.delivery_status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          email.metadata?.delivery_status === 'internal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        )}>
                          {email.metadata?.delivery_status === 'delivered' ? 'Đã gửi' :
                           email.metadata?.delivery_status === 'internal' ? 'Nội bộ' : 'Đang chờ'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {systemEmailsData?.total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Trang {systemEmailsPage} / {Math.ceil(systemEmailsData.total / 20)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={systemEmailsPage === 1}
                  onClick={() => setSystemEmailsPage(p => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={systemEmailsPage >= Math.ceil(systemEmailsData.total / 20)}
                  onClick={() => setSystemEmailsPage(p => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain Dialog */}
      <DomainDialog
        open={domainDialogOpen}
        onOpenChange={setDomainDialogOpen}
        domain={editingDomain}
        onSubmit={async (data) => {
          if (editingDomain) {
            await updateDomain.mutateAsync({ id: editingDomain.id, ...data });
          } else {
            await createDomain.mutateAsync(data);
          }
          setDomainDialogOpen(false);
        }}
      />

      {/* Mailbox Dialog */}
      <MailboxDialog
        open={mailboxDialogOpen}
        onOpenChange={setMailboxDialogOpen}
        mailbox={editingMailbox}
        domainId={selectedDomain?.id || ''}
        domainName={selectedDomain?.domain || ''}
        onSubmit={async (data) => {
          if (editingMailbox) {
            await updateMailbox.mutateAsync({ id: editingMailbox.id, ...data });
          } else {
            await createMailbox.mutateAsync(data);
          }
          setMailboxDialogOpen(false);
        }}
      />

      {/* Alias Dialog */}
      <AliasDialog
        open={aliasDialogOpen}
        onOpenChange={setAliasDialogOpen}
        domainId={selectedDomain?.id || ''}
        domainName={selectedDomain?.domain || ''}
        mailboxes={mailboxes || []}
        onSubmit={async (data) => {
          await createAlias.mutateAsync(data);
          setAliasDialogOpen(false);
        }}
      />

      {/* Admin Dialog */}
      <AdminDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        domainId={selectedDomain?.id || ''}
        admins={domainAdmins || []}
        onAddAdmin={async (userId, role) => {
          await addAdmin.mutateAsync({
            domain_id: selectedDomain?.id || '',
            user_id: userId,
            role,
          });
        }}
        onRemoveAdmin={async (adminId) => {
          await removeAdmin.mutateAsync(adminId);
        }}
      />

      {/* Delete Domain Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tên miền?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tên miền <strong>{domainToDelete?.domain}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDomain} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Mailbox Dialog */}
      <AlertDialog open={mailboxDeleteDialog} onOpenChange={setMailboxDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mailbox?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mailbox <strong>{mailboxToDelete?.email_address}</strong>?
              Tất cả email và dữ liệu sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMailbox} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Domain Dialog Component
const DomainDialog = ({
  open,
  onOpenChange,
  domain,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: MailDomain | null;
  onSubmit: (data: any) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    domain: '',
    display_name: '',
    description: '',
    is_public: false,
    max_mailboxes: 0,
    max_storage_mb: 1024,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      if (domain) {
        setFormData({
          domain: domain.domain,
          display_name: domain.display_name || '',
          description: domain.description || '',
          is_public: domain.is_public,
          max_mailboxes: domain.max_mailboxes,
          max_storage_mb: domain.max_storage_mb,
        });
      } else {
        setFormData({
          domain: '',
          display_name: '',
          description: '',
          is_public: false,
          max_mailboxes: 0,
          max_storage_mb: 1024,
        });
      }
    }
  }, [open, domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{domain ? 'Sửa tên miền' : 'Tạo tên miền mới'}</DialogTitle>
          <DialogDescription>
            {domain ? 'Cập nhật thông tin tên miền' : 'Thêm tên miền mới vào hệ thống mail'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tên miền *</Label>
            <Input
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              disabled={!!domain}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tên hiển thị</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Example Company"
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả về tên miền..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số mailbox tối đa</Label>
              <Input
                type="number"
                value={formData.max_mailboxes}
                onChange={(e) => setFormData({ ...formData, max_mailboxes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">0 = không giới hạn</p>
            </div>
            <div className="space-y-2">
              <Label>Dung lượng mặc định (MB)</Label>
              <Input
                type="number"
                value={formData.max_storage_mb}
                onChange={(e) => setFormData({ ...formData, max_storage_mb: parseInt(e.target.value) || 1024 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Cho phép đăng ký công khai</Label>
              <p className="text-xs text-muted-foreground">Người dùng có thể tự tạo mailbox</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : domain ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Mailbox Dialog Component
const MailboxDialog = ({
  open,
  onOpenChange,
  mailbox,
  domainId,
  domainName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailbox: Mailbox | null;
  domainId: string;
  domainName: string;
  onSubmit: (data: any) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    local_part: '',
    display_name: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
    quota_mb: 1024,
    is_active: true,
    can_send_external: false,
    can_receive_external: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      if (mailbox) {
        setFormData({
          local_part: mailbox.local_part || '',
          display_name: mailbox.display_name || '',
          role: mailbox.role,
          quota_mb: mailbox.quota_mb,
          is_active: mailbox.is_active,
          can_send_external: mailbox.can_send_external,
          can_receive_external: mailbox.can_receive_external,
        });
      } else {
        setFormData({
          local_part: '',
          display_name: '',
          role: 'user',
          quota_mb: 1024,
          is_active: true,
          can_send_external: false,
          can_receive_external: false,
        });
      }
    }
  }, [open, mailbox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        domain_id: domainId,
        ...formData,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mailbox ? 'Sửa Mailbox' : 'Tạo Mailbox mới'}</DialogTitle>
          <DialogDescription>
            {mailbox ? 'Cập nhật thông tin mailbox' : `Tạo mailbox mới cho @${domainName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Địa chỉ email *</Label>
            <div className="flex items-center gap-2">
              <Input
                value={formData.local_part}
                onChange={(e) => setFormData({ ...formData, local_part: e.target.value.toLowerCase() })}
                placeholder="username"
                disabled={!!mailbox}
                required
              />
              <span className="text-muted-foreground whitespace-nowrap">@{domainName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên hiển thị</Label>
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dung lượng (MB)</Label>
              <Input
                type="number"
                value={formData.quota_mb}
                onChange={(e) => setFormData({ ...formData, quota_mb: parseInt(e.target.value) || 1024 })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Trạng thái hoạt động</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Cho phép gửi ra ngoài</Label>
              <Switch
                checked={formData.can_send_external}
                onCheckedChange={(checked) => setFormData({ ...formData, can_send_external: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Cho phép nhận từ bên ngoài</Label>
              <Switch
                checked={formData.can_receive_external}
                onCheckedChange={(checked) => setFormData({ ...formData, can_receive_external: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : mailbox ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Alias Dialog Component
const AliasDialog = ({
  open,
  onOpenChange,
  domainId,
  domainName,
  mailboxes,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  domainName: string;
  mailboxes: Mailbox[];
  onSubmit: (data: any) => Promise<void>;
}) => {
  const [localPart, setLocalPart] = useState('');
  const [mailboxId, setMailboxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        domain_id: domainId,
        local_part: localPart,
        mailbox_id: mailboxId,
      });
      setLocalPart('');
      setMailboxId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo Email Alias</DialogTitle>
          <DialogDescription>
            Tạo alias để chuyển tiếp email đến mailbox khác
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alias email</Label>
            <div className="flex items-center gap-2">
              <Input
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value.toLowerCase())}
                placeholder="alias"
                required
              />
              <span className="text-muted-foreground whitespace-nowrap">@{domainName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chuyển tiếp đến</Label>
            <Select value={mailboxId} onValueChange={setMailboxId} required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mailbox..." />
              </SelectTrigger>
              <SelectContent>
                {mailboxes.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.email_address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !localPart || !mailboxId}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Alias'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Admin Dialog Component
const AdminDialog = ({
  open,
  onOpenChange,
  domainId,
  admins,
  onAddAdmin,
  onRemoveAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  admins: any[];
  onAddAdmin: (userId: string, role: 'owner' | 'admin' | 'manager') => Promise<void>;
  onRemoveAdmin: (adminId: string) => Promise<void>;
}) => {
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'manager'>('admin');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản trị viên Domain</DialogTitle>
          <DialogDescription>
            Quản lý người dùng có quyền quản trị domain này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Admin Form */}
          <div className="flex gap-2">
            <Input
              placeholder="Email người dùng..."
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Admin List */}
          <div className="space-y-2">
            {admins.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Chưa có quản trị viên nào
              </p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={admin.profiles?.avatar_url} />
                      <AvatarFallback>
                        {admin.profiles?.full_name?.charAt(0) || admin.profiles?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {admin.profiles?.full_name || admin.profiles?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{admin.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={admin.role === 'owner' ? 'default' : 'secondary'}>
                      {admin.role}
                    </Badge>
                    {admin.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onRemoveAdmin(admin.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMailServer;
