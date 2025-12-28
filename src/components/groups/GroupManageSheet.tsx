import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, Shield, Users, Settings, BarChart3, Wallet, 
  Ban, AlertTriangle, History, ChevronRight, ChevronLeft,
  Share2, Pause, Play, Trash2, UserX, Eye, EyeOff,
  Lock, Globe, MessageSquare, Bell, Award,
  ListTodo, Loader2, UserPlus,
  Star, Tag, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  useGroupReportedContent, 
  useGroupPendingPosts, 
  usePauseGroup, 
  useDeleteGroup,
  useGroupJoinRequests 
} from '@/hooks/useGroups';
import {
  useGroupBans,
  useGroupViolations,
  useGroupActivityLogs,
  useGroupStats,
  useGroupCustomRoles,
  useGroupAutoRules,
} from '@/hooks/useGroupManagement';
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
import { useDateFormat } from '@/hooks/useDateFormat';
import { OwnerSettingsTab } from '@/components/groups/manage/OwnerSettingsTab';
import { MemberManagementTab } from '@/components/groups/manage/MemberManagementTab';
import { RolePermissionsTab } from '@/components/groups/manage/RolePermissionsTab';
import { RuleEngineTab } from '@/components/groups/manage/RuleEngineTab';
import { GroupStatsTab } from '@/components/groups/manage/GroupStatsTab';
import { GroupWalletTab } from '@/components/groups/tabs/GroupWalletTab';
import { GroupTasksTab } from '@/components/groups/tabs/GroupTasksTab';

export interface GroupManageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    visibility: 'public' | 'private' | 'hidden';
    member_count: number;
    settings?: { is_paused?: boolean } | null;
    join_type?: string;
    min_reputation_to_join?: number;
    entry_fee?: number;
    owner_id: string;
  };
  isOwner: boolean;
  canManage: boolean;
}

type SubView = 
  | 'main' 
  | 'join-requests' 
  | 'pending-posts' 
  | 'reported-content'
  | 'member-management'
  | 'ban-list'
  | 'violations'
  | 'owner-settings'
  | 'role-permissions'
  | 'rule-engine'
  | 'stats'
  | 'group-settings'
  | 'badge-requests'
  | 'wallet'
  | 'tasks';

const visibilityLabels = {
  public: { label: 'Công khai', icon: Globe },
  private: { label: 'Riêng tư', icon: Lock },
  hidden: { label: 'Ẩn', icon: EyeOff },
};

export function GroupManageSheet({ open, onOpenChange, group, isOwner, canManage }: GroupManageSheetProps) {
  const navigate = useNavigate();
  const { formatDateTime } = useDateFormat();
  const basePath = `/groups/${group.id}`;
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subView, setSubView] = useState<SubView>('main');
  
  // Backend hooks
  const { data: reportedContent = [] } = useGroupReportedContent(group.id);
  const { data: pendingPosts = [] } = useGroupPendingPosts(group.id);
  const { data: joinRequests = [] } = useGroupJoinRequests(group.id);
  const { data: bans = [] } = useGroupBans(group.id);
  const { data: violations = [] } = useGroupViolations(group.id);
  const { data: activityLogs = [] } = useGroupActivityLogs(group.id, 20);
  const { data: stats } = useGroupStats(group.id);
  const { data: customRoles = [] } = useGroupCustomRoles(group.id);
  const { data: autoRules = [] } = useGroupAutoRules(group.id);
  
  const pauseGroup = usePauseGroup();
  const deleteGroup = useDeleteGroup();
  
  const isPaused = (group.settings as any)?.is_paused || false;
  const VisibilityIcon = visibilityLabels[group.visibility].icon;

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate(basePath + path);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + basePath);
    toast.success('Đã copy link nhóm!');
  };

  const handlePause = () => {
    pauseGroup.mutate({ groupId: group.id, isPaused: !isPaused });
  };

  const handleDelete = () => {
    deleteGroup.mutate(group.id, {
      onSuccess: () => {
        onOpenChange(false);
        navigate('/groups');
      }
    });
  };

  // Review counts
  const totalReviewItems = reportedContent.length + pendingPosts.length + joinRequests.length;

  // Render sub-view content
  const renderSubViewContent = () => {
    switch (subView) {
      case 'member-management':
        return (
          <div className="p-4">
            <MemberManagementTab groupId={group.id} isOwner={isOwner} />
          </div>
        );
      case 'owner-settings':
        return (
          <div className="p-4">
            <OwnerSettingsTab 
              groupId={group.id} 
              group={{
                name: group.name,
                description: group.description || undefined,
                avatar_url: group.avatar_url || undefined,
                cover_url: group.cover_url || undefined,
                is_private: group.visibility === 'private',
                join_type: group.join_type,
                min_reputation: group.min_reputation_to_join,
                join_fee: group.entry_fee,
              }}
            />
          </div>
        );
      case 'role-permissions':
        return (
          <div className="p-4">
            <RolePermissionsTab groupId={group.id} isOwner={isOwner} />
          </div>
        );
      case 'rule-engine':
        return (
          <div className="p-4">
            <RuleEngineTab groupId={group.id} isOwner={isOwner} />
          </div>
        );
      case 'stats':
        return (
          <div className="p-4">
            <GroupStatsTab groupId={group.id} isOwner={isOwner} />
          </div>
        );
      case 'join-requests':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Yêu cầu tham gia</h3>
            {joinRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Không có yêu cầu nào</p>
            ) : (
              <div className="space-y-2">
                {joinRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.profile?.avatar_url} />
                        <AvatarFallback>{req.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{req.profile?.full_name || 'Người dùng'}</p>
                        <p className="text-xs text-muted-foreground">@{req.profile?.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Từ chối</Button>
                      <Button size="sm">Duyệt</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'pending-posts':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Bài viết chờ duyệt</h3>
            {pendingPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Không có bài viết nào chờ duyệt</p>
            ) : (
              <div className="space-y-2">
                {pendingPosts.map((post: any) => (
                  <div key={post.id} className="p-3 bg-card border rounded-lg">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Từ chối</Button>
                      <Button size="sm">Duyệt</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'reported-content':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Nội dung bị báo cáo</h3>
            {reportedContent.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Không có nội dung bị báo cáo</p>
            ) : (
              <div className="space-y-2">
                {reportedContent.map((report: any) => (
                  <div key={report.id} className="p-3 bg-card border rounded-lg">
                    <p className="text-sm">Lý do: {report.reason}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Bỏ qua</Button>
                      <Button size="sm" variant="destructive">Xoá nội dung</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'ban-list':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Danh sách cấm ({bans.length})</h3>
            {bans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có thành viên nào bị cấm</p>
            ) : (
              <div className="space-y-2">
                {bans.map((ban: any) => (
                  <div key={ban.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                    <div>
                      <p className="font-medium">{ban.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {ban.is_permanent ? 'Vĩnh viễn' : `Đến ${ban.expires_at}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Gỡ ban</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'violations':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Lịch sử vi phạm ({violations.length})</h3>
            {violations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có lịch sử vi phạm</p>
            ) : (
              <div className="space-y-2">
                {violations.map((v: any) => (
                  <div key={v.id} className="p-3 bg-card border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{v.violation_type}</p>
                      <Badge variant={v.is_resolved ? 'secondary' : 'destructive'}>
                        {v.is_resolved ? 'Đã xử lý' : 'Chưa xử lý'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{v.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'group-settings':
        return (
          <div className="p-4">
            <OwnerSettingsTab 
              groupId={group.id} 
              group={{
                name: group.name,
                description: group.description || undefined,
                avatar_url: group.avatar_url || undefined,
                cover_url: group.cover_url || undefined,
                is_private: group.visibility === 'private',
                join_type: group.join_type,
                min_reputation: group.min_reputation_to_join,
                join_fee: group.entry_fee,
              }}
            />
          </div>
        );
      case 'badge-requests':
        return (
          <div className="p-4 space-y-4">
            <h3 className="font-semibold">Yêu cầu huy hiệu</h3>
            <p className="text-center text-muted-foreground py-8">Không có yêu cầu nào</p>
          </div>
        );
      case 'wallet':
        return (
          <div className="p-4">
            <GroupWalletTab groupId={group.id} canManage={canManage} />
          </div>
        );
      case 'tasks':
        return (
          <div className="p-4">
            <GroupTasksTab groupId={group.id} membership={null} canManage={canManage} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl p-0">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <div className="flex items-center gap-3">
              {subView !== 'main' && (
                <Button variant="ghost" size="icon" onClick={() => setSubView('main')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={group.cover_url || group.avatar_url || ''} />
                <AvatarFallback className="rounded-lg">{group.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-left">{group.name}</SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <VisibilityIcon className="h-3 w-3" />
                  <span>{visibilityLabels[group.visibility].label}</span>
                  <span>·</span>
                  <span>{group.member_count} thành viên</span>
                </div>
              </div>
              {isOwner && (
                <Badge variant="default" className="bg-yellow-500 text-yellow-950">
                  <Crown className="h-3 w-3 mr-1" />
                  Owner
                </Badge>
              )}
              {!isOwner && canManage && (
                <Badge variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  Manager
                </Badge>
              )}
            </div>
          </SheetHeader>
          
          {subView !== 'main' ? (
            <ScrollArea className="h-[calc(90vh-80px)]">
              {renderSubViewContent()}
            </ScrollArea>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(90vh-80px)]">
              <TabsList className="w-full justify-start px-4 py-2 h-auto bg-transparent border-b rounded-none gap-1 overflow-x-auto">
                <TabsTrigger value="overview" className="gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value="review" className="gap-1.5 relative">
                  <AlertTriangle className="h-4 w-4" />
                  Xét duyệt
                  {totalReviewItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      {totalReviewItems}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Thành viên
                </TabsTrigger>
                {isOwner && (
                  <TabsTrigger value="owner" className="gap-1.5">
                    <Crown className="h-4 w-4" />
                    Owner
                  </TabsTrigger>
                )}
                <TabsTrigger value="settings" className="gap-1.5">
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[calc(90vh-140px)]">
                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="m-0 p-4 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Thành viên</span>
                      </div>
                      <p className="text-2xl font-bold">{stats?.totalMembers || group.member_count}</p>
                      {stats?.newMembers ? (
                        <p className="text-xs text-green-500">+{stats.newMembers} tuần này</p>
                      ) : null}
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">Bài viết</span>
                      </div>
                      <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
                      {stats?.recentPosts ? (
                        <p className="text-xs text-green-500">+{stats.recentPosts} tuần này</p>
                      ) : null}
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm">Số dư ví</span>
                      </div>
                      <p className="text-2xl font-bold">{(stats?.wallet?.balance || 0).toLocaleString()}đ</p>
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Cần duyệt</span>
                      </div>
                      <p className="text-2xl font-bold">{totalReviewItems}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold mb-3">Công cụ nhanh</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        onClick={() => setSubView('stats')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:bg-muted transition-colors"
                      >
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        <span className="text-xs">Thống kê</span>
                      </button>
                      <button
                        onClick={() => setSubView('wallet')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:bg-muted transition-colors"
                      >
                        <Wallet className="h-5 w-5 text-green-500" />
                        <span className="text-xs">Ví nhóm</span>
                      </button>
                      <button
                        onClick={() => setSubView('member-management')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:bg-muted transition-colors"
                      >
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className="text-xs">Thành viên</span>
                      </button>
                      <button
                        onClick={() => setSubView('tasks')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border hover:bg-muted transition-colors"
                      >
                        <ListTodo className="h-5 w-5 text-orange-500" />
                        <span className="text-xs">Nhiệm vụ</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="font-semibold mb-3">Hoạt động gần đây</h3>
                    <div className="space-y-2">
                      {activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.user?.avatar_url || ''} />
                            <AvatarFallback>{log.user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              <span className="font-medium">{log.user?.full_name || 'Hệ thống'}</span>
                              {' '}{getActionLabel(log.action)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(log.created_at, 'HH:mm dd/MM')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activityLogs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Chưa có hoạt động</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* REVIEW TAB */}
                <TabsContent value="review" className="m-0 p-4 space-y-4">
                  <ReviewSection 
                    icon={UserPlus}
                    title="Yêu cầu tham gia"
                    count={joinRequests.length}
                    onClick={() => setSubView('join-requests')}
                  />
                  <ReviewSection 
                    icon={MessageSquare}
                    title="Bài viết chờ duyệt"
                    count={pendingPosts.length}
                    onClick={() => setSubView('pending-posts')}
                  />
                  <ReviewSection 
                    icon={AlertTriangle}
                    title="Nội dung bị báo cáo"
                    count={reportedContent.length}
                    onClick={() => setSubView('reported-content')}
                  />
                  <ReviewSection 
                    icon={Award}
                    title="Yêu cầu huy hiệu"
                    count={0}
                    onClick={() => setSubView('badge-requests')}
                  />
                </TabsContent>

                {/* MEMBERS TAB */}
                <TabsContent value="members" className="m-0 p-4 space-y-4">
                  {/* Member Role Stats */}
                  <div className="bg-card border rounded-xl p-4">
                    <h4 className="font-semibold mb-3">Phân bố vai trò</h4>
                    <div className="space-y-2">
                      {Object.entries(stats?.membersByRole || {}).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{getRoleLabel(role)}</span>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Member Actions */}
                  <ManageItem
                    icon={Users}
                    title="Quản lý thành viên"
                    subtitle="Xem, mute, kick, gán role"
                    onClick={() => setSubView('member-management')}
                  />
                  <ManageItem
                    icon={Ban}
                    title="Danh sách cấm"
                    subtitle={`${bans.length} thành viên bị cấm`}
                    onClick={() => setSubView('ban-list')}
                  />
                  <ManageItem
                    icon={History}
                    title="Lịch sử vi phạm"
                    subtitle={`${violations.length} vi phạm được ghi nhận`}
                    onClick={() => setSubView('violations')}
                  />
                  <ManageItem
                    icon={Tag}
                    title="Nhãn thành viên"
                    subtitle="Gắn nhãn trusted, warning, new"
                    onClick={() => setSubView('member-management')}
                  />
                </TabsContent>

                {/* OWNER TAB */}
                {isOwner && (
                  <TabsContent value="owner" className="m-0 p-4 space-y-4">
                    {/* Owner-only features */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-semibold">Quyền Owner</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Bạn có toàn quyền kiểm soát nhóm này
                      </p>
                    </div>

                    <ManageItem
                      icon={Crown}
                      title="Chuyển quyền Owner"
                      subtitle="Chuyển quyền sở hữu cho thành viên khác"
                      onClick={() => setSubView('owner-settings')}
                    />
                    <ManageItem
                      icon={Shield}
                      title="Quản lý vai trò & quyền"
                      subtitle={`5 vai trò mặc định, ${customRoles.length} vai trò tùy chỉnh`}
                      onClick={() => setSubView('role-permissions')}
                    />
                    <ManageItem
                      icon={Wallet}
                      title="Cấu hình tài chính"
                      subtitle="Phí vào, phí tháng, % hoa hồng"
                      onClick={() => setSubView('owner-settings')}
                    />
                    <ManageItem
                      icon={Zap}
                      title="Rule Engine"
                      subtitle={`${autoRules.length} quy tắc tự động`}
                      onClick={() => setSubView('rule-engine')}
                    />
                    <ManageItem
                      icon={Star}
                      title="Bán vai trò"
                      subtitle="VIP, Seller, vai trò tùy chỉnh"
                      onClick={() => setSubView('role-permissions')}
                    />

                    {/* Danger Zone */}
                    <div className="border-t pt-4 mt-6">
                      <h4 className="font-semibold text-destructive mb-3">Vùng nguy hiểm</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handlePause}
                        >
                          {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                          {isPaused ? 'Mở khóa nhóm' : 'Tạm khóa nhóm'}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa nhóm vĩnh viễn
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="m-0 p-4 space-y-4">
                  <ManageItem
                    icon={Settings}
                    title="Thông tin nhóm"
                    subtitle="Tên, mô tả, avatar, banner"
                    onClick={() => setSubView('group-settings')}
                  />
                  <ManageItem
                    icon={Lock}
                    title="Quyền riêng tư"
                    subtitle={visibilityLabels[group.visibility].label}
                    onClick={() => setSubView('group-settings')}
                  />
                  <ManageItem
                    icon={UserPlus}
                    title="Điều kiện tham gia"
                    subtitle="Phí vào, level, điểm uy tín"
                    onClick={() => setSubView('group-settings')}
                  />
                  <ManageItem
                    icon={Bell}
                    title="Thông báo"
                    subtitle="Cấu hình thông báo nhóm"
                    onClick={() => setSubView('group-settings')}
                  />

                  {/* Bottom Actions */}
                  <div className="border-t pt-6 mt-4">
                    <div className="flex justify-center gap-6">
                      <button 
                        onClick={handleShare}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="h-12 w-12 rounded-full border-2 flex items-center justify-center hover:bg-muted transition-colors">
                          <Share2 className="h-5 w-5" />
                        </div>
                        <span className="text-xs">Chia sẻ</span>
                      </button>
                      {isOwner && (
                        <button 
                          onClick={handlePause}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="h-12 w-12 rounded-full border-2 flex items-center justify-center hover:bg-muted transition-colors">
                            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                          </div>
                          <span className="text-xs">{isPaused ? 'Mở khóa' : 'Tạm khóa'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhóm vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả bài viết, thành viên, và dữ liệu của nhóm sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGroup.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Xóa nhóm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper Components
function ReviewSection({ 
  icon: Icon, 
  title, 
  count, 
  onClick 
}: { 
  icon: any; 
  title: string; 
  count: number; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{count} mục cần xem xét</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

function ManageItem({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick 
}: { 
  icon: any; 
  title: string; 
  subtitle: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

// Helper functions
function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'member_join': 'đã tham gia nhóm',
    'member_leave': 'đã rời nhóm',
    'post_create': 'đã đăng bài viết',
    'post_delete': 'đã xóa bài viết',
    'role_change': 'đã thay đổi vai trò',
    'settings_update': 'đã cập nhật cài đặt',
    'member_kick': 'đã kick thành viên',
    'member_ban': 'đã ban thành viên',
    'ownership_transfer': 'đã chuyển quyền owner',
  };
  return labels[action] || action;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'owner': 'Chủ nhóm',
    'manager': 'Quản trị viên',
    'seller': 'Seller',
    'member': 'Thành viên',
    'viewer': 'Người xem',
  };
  return labels[role] || role;
}
