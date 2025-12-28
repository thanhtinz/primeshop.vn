import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Wallet, Crown, Search, RefreshCw, Edit, Plus, Trash2, Loader2, Ban, CheckCircle,
  Bell, ShoppingBag, MoreVertical, Eye, Download, FileSpreadsheet, Key, UserX, Globe,
  Shield, UserCog, Clock, Mail, Phone, Calendar, BadgeCheck
} from 'lucide-react';
import { exportToCSV, exportToExcel, formatUsersForExport } from '@/lib/exportUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [deposits, setDeposits] = useState<any[]>([]);
  const [vipLevels, setVipLevels] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialogs state
  const [editingVip, setEditingVip] = useState<any>(null);
  const [vipForm, setVipForm] = useState({ name: '', min_spending: 0, discount_percent: 0 });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [editingUserInfo, setEditingUserInfo] = useState<any>(null);
  const [userInfoForm, setUserInfoForm] = useState({ full_name: '', phone: '', email: '' });
  const [banningUser, setBanningUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [notifyingUser, setNotifyingUser] = useState<any>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [viewingOrdersUser, setViewingOrdersUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteInactive, setShowDeleteInactive] = useState(false);
  const [inactiveDays, setInactiveDays] = useState('90');
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);
  const [deletingInactive, setDeletingInactive] = useState(false);
  const [banningIp, setBanningIp] = useState<any>(null);
  const [ipToBan, setIpToBan] = useState('');
  const [ipBanReason, setIpBanReason] = useState('');
  const [viewingLoginHistory, setViewingLoginHistory] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [changingRole, setChangingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesRes, rolesRes, depositsRes, vipRes, bannedIpsRes] = await Promise.all([
        supabase.from('profiles').select(`*, vip_levels (name, discount_percent)`).order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('deposit_transactions').select(`*, profiles:user_id (email, full_name)`).order('created_at', { ascending: false }),
        supabase.from('vip_levels').select('*').order('sort_order', { ascending: true }),
        supabase.from('banned_ips').select('*').eq('is_active', true).order('banned_at', { ascending: false })
      ]);

      const rolesMap: Record<string, string> = {};
      rolesRes.data?.forEach(r => {
        if (!rolesMap[r.user_id] || r.role === 'admin' || (r.role === 'staff' && rolesMap[r.user_id] === 'user')) {
          rolesMap[r.user_id] = r.role;
        }
      });
      
      setUserRoles(rolesMap);
      setUsers(profilesRes.data || []);
      setDeposits(depositsRes.data || []);
      setVipLevels(vipRes.data || []);
      setBannedIps(bannedIpsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-600 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-600 border-red-500/20'
    };
    const labels: Record<string, string> = { completed: 'Thành công', pending: 'Đang xử lý', failed: 'Thất bại' };
    return <Badge variant="outline" className={styles[status] || ''}>{labels[status] || status}</Badge>;
  };

  const getRoleBadge = (userId: string) => {
    const role = userRoles[userId] || 'user';
    const config: Record<string, { bg: string; text: string; label: string }> = {
      admin: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'Admin' },
      staff: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Nhân viên' },
      user: { bg: 'bg-gray-500/10', text: 'text-gray-600', label: 'User' }
    };
    const { bg, text, label } = config[role] || config.user;
    return <Badge variant="outline" className={`${bg} ${text} border-current/20`}>{label}</Badge>;
  };

  // Handlers
  const handleSaveVip = async () => {
    try {
      if (editingVip?.id) {
        await supabase.from('vip_levels').update({ name: vipForm.name, min_spending: vipForm.min_spending, discount_percent: vipForm.discount_percent }).eq('id', editingVip.id);
      } else {
        const maxOrder = Math.max(...vipLevels.map(v => v.sort_order), 0);
        await supabase.from('vip_levels').insert({ ...vipForm, sort_order: maxOrder + 1 });
      }
      toast.success(editingVip?.id ? 'Đã cập nhật VIP' : 'Đã thêm VIP mới');
      setEditingVip(null);
      fetchData();
    } catch { toast.error('Lỗi khi lưu VIP'); }
  };

  const handleDeleteVip = async (id: string) => {
    if (!confirm('Xóa cấp VIP này?')) return;
    try { await supabase.from('vip_levels').delete().eq('id', id); toast.success('Đã xóa VIP'); fetchData(); } 
    catch { toast.error('Lỗi khi xóa VIP'); }
  };

  const handleAdjustBalance = async () => {
    if (!editingUser || !balanceAdjustment || !currentUser) return;
    const adjustment = parseFloat(balanceAdjustment);
    if (isNaN(adjustment)) { toast.error('Số tiền không hợp lệ'); return; }
    try {
      const { data, error } = await supabase.rpc('admin_adjust_user_balance', {
        p_admin_user_id: currentUser.id,
        p_target_profile_id: editingUser.id,
        p_adjustment: adjustment,
        p_reason: `Điều chỉnh số dư: ${adjustment > 0 ? '+' : ''}${adjustment}`
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
      toast.success(`Đã ${adjustment > 0 ? 'cộng' : 'trừ'} ${formatPrice(Math.abs(adjustment))}`);
      setEditingUser(null); setBalanceAdjustment(''); fetchData();
    } catch (err: any) { toast.error(err.message || 'Lỗi khi điều chỉnh số dư'); }
  };

  const handleBanUser = async () => {
    if (!banningUser) return;
    try {
      await supabase.from('profiles').update({ is_banned: true, banned_at: new Date().toISOString(), ban_reason: banReason || null }).eq('id', banningUser.id);
      toast.success('Đã khóa tài khoản');
      setBanningUser(null); setBanReason(''); fetchData();
    } catch { toast.error('Lỗi khi khóa tài khoản'); }
  };

  const handleUnbanUser = async (user: any) => {
    if (!confirm('Mở khóa tài khoản này?')) return;
    try {
      await supabase.from('profiles').update({ is_banned: false, banned_at: null, ban_reason: null }).eq('id', user.id);
      toast.success('Đã mở khóa'); fetchData();
    } catch { toast.error('Lỗi khi mở khóa'); }
  };

  const handleSendNotification = async () => {
    if (!notifyingUser || !notificationTitle || !notificationMessage) { toast.error('Nhập đầy đủ thông tin'); return; }
    try {
      await supabase.from('notifications').insert({ user_id: notifyingUser.user_id, type: 'system', title: notificationTitle, message: notificationMessage });
      toast.success('Đã gửi thông báo');
      setNotifyingUser(null); setNotificationTitle(''); setNotificationMessage('');
    } catch { toast.error('Lỗi khi gửi thông báo'); }
  };

  const handleViewOrders = async (user: any) => {
    setViewingOrdersUser(user); setOrdersLoading(true);
    try {
      const { data } = await supabase.from('orders').select('*').eq('customer_email', user.email).order('created_at', { ascending: false }).limit(20);
      setUserOrders(data || []);
    } catch { toast.error('Lỗi khi tải đơn hàng'); }
    finally { setOrdersLoading(false); }
  };

  const handleEditUserInfo = async () => {
    if (!editingUserInfo) return;
    try {
      await supabase.from('profiles').update({ full_name: userInfoForm.full_name, phone: userInfoForm.phone, email: userInfoForm.email }).eq('id', editingUserInfo.id);
      toast.success('Đã cập nhật thông tin'); setEditingUserInfo(null); fetchData();
    } catch { toast.error('Lỗi khi cập nhật'); }
  };

  const handleResetPassword = async (user: any) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      toast.success('Đã gửi email đặt lại mật khẩu');
    } catch (e: any) { toast.error(e.message || 'Lỗi gửi email'); }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Không có phiên đăng nhập');

      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: deletingUser.user_id }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('Đã xóa tài khoản');
      setDeletingUser(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi xóa tài khoản');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewLoginHistory = async (user: any) => {
    setViewingLoginHistory(user); setLoginHistoryLoading(true);
    try {
      const { data } = await supabase.from('login_history').select('*').eq('user_id', user.user_id).order('login_at', { ascending: false }).limit(20);
      setLoginHistory(data || []);
    } catch { toast.error('Lỗi tải lịch sử'); }
    finally { setLoginHistoryLoading(false); }
  };

  const handleBanIp = async () => {
    if (!ipToBan) { toast.error('Nhập địa chỉ IP'); return; }
    try {
      const { error } = await supabase.from('banned_ips').insert({ ip_address: ipToBan, reason: ipBanReason || null, is_active: true });
      if (error?.code === '23505') { toast.error('IP đã bị ban'); return; }
      if (error) throw error;
      toast.success('Đã ban IP'); setBanningIp(null); setIpToBan(''); setIpBanReason(''); fetchData();
    } catch (e: any) { toast.error(e.message || 'Lỗi ban IP'); }
  };

  const handleUnbanIp = async (ip: any) => {
    if (!confirm('Bỏ ban IP này?')) return;
    try { await supabase.from('banned_ips').update({ is_active: false }).eq('id', ip.id); toast.success('Đã bỏ ban IP'); fetchData(); }
    catch { toast.error('Lỗi bỏ ban IP'); }
  };

  const handleChangeRole = async () => {
    if (!changingRole || !selectedRole) return;
    try {
      await supabase.from('user_roles').delete().eq('user_id', changingRole.user_id);
      const { error } = await supabase.from('user_roles').insert([{ user_id: changingRole.user_id, role: selectedRole as 'user' | 'staff' | 'admin' }]);
      if (error) throw error;
      toast.success('Đã thay đổi quyền'); setChangingRole(null); fetchData();
    } catch { toast.error('Lỗi thay đổi quyền'); }
  };

  const handleToggleVerification = async (user: any, verified: boolean) => {
    try {
      await supabase.from('profiles').update({ is_verified: verified }).eq('id', user.id);
      toast.success(verified ? 'Đã cấp tích xanh' : 'Đã thu hồi tích xanh');
      fetchData();
    } catch { toast.error('Lỗi khi cập nhật'); }
  };

  const handleFindInactiveUsers = async () => {
    const days = parseInt(inactiveDays);
    if (isNaN(days) || days < 1) { toast.error('Số ngày không hợp lệ'); return; }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const inactiveList = users.filter(user => {
      const lastActive = new Date(user.updated_at || user.created_at);
      return lastActive < cutoffDate && user.total_spent === 0;
    });
    setInactiveUsers(inactiveList);
  };

  const handleDeleteInactiveUsers = async () => {
    if (inactiveUsers.length === 0) return;
    setDeletingInactive(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Không có phiên đăng nhập');

      let deleted = 0;
      for (const user of inactiveUsers) {
        const response = await supabase.functions.invoke('admin-delete-user', { body: { user_id: user.user_id } });
        if (!response.error && !response.data?.error) deleted++;
      }
      toast.success(`Đã xóa ${deleted}/${inactiveUsers.length} tài khoản`);
      setShowDeleteInactive(false); setInactiveUsers([]); fetchData();
    } catch { toast.error('Lỗi khi xóa tài khoản'); }
    finally { setDeletingInactive(false); }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || userRoles[user.user_id] === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'banned' && user.is_banned) || (statusFilter === 'active' && !user.is_banned);
    return matchSearch && matchRole && matchStatus;
  });

  const filteredDeposits = deposits.filter(d => d.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || d.payment_id?.includes(searchTerm));

  const stats = {
    total: users.length,
    admin: Object.values(userRoles).filter(r => r === 'admin').length,
    staff: Object.values(userRoles).filter(r => r === 'staff').length,
    banned: users.filter(u => u.is_banned).length,
    totalDeposit: deposits.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0),
    vipCount: vipLevels.length
  };

  const handleExportCSV = () => {
    if (!users.length) { toast.error('Không có dữ liệu'); return; }
    exportToCSV(formatUsersForExport(searchTerm ? filteredUsers : users), `nguoi-dung-${new Date().toISOString().split('T')[0]}`);
    toast.success('Đã xuất CSV');
  };

  const handleExportExcel = () => {
    if (!users.length) { toast.error('Không có dữ liệu'); return; }
    exportToExcel(formatUsersForExport(searchTerm ? filteredUsers : users), `nguoi-dung-${new Date().toISOString().split('T')[0]}`, 'Người dùng');
    toast.success('Đã xuất Excel');
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const UserCard = ({ user }: { user: any }) => (
    <div className="bg-card rounded-lg border p-2.5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{user.full_name?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium text-xs truncate max-w-[100px]">{user.full_name || 'N/A'}</span>
            {user.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100" />}
            {getRoleBadge(user.user_id)}
            {user.is_banned && <Badge variant="destructive" className="h-4 text-[9px] px-1">Khóa</Badge>}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[9px] font-medium text-green-600 bg-green-500/10 px-1 rounded">{formatPrice(user.balance)}</span>
            <span className="text-[9px] font-medium text-yellow-600 bg-yellow-500/10 px-1 rounded">{user.vip_levels?.name || 'Member'}</span>
            {user.last_login_ip && (
              <span className="text-[9px] font-medium text-purple-600 bg-purple-500/10 px-1 rounded flex items-center gap-0.5">
                <Globe className="h-2.5 w-2.5" />
                {user.last_login_ip}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs">
            <DropdownMenuItem className="text-xs" onClick={() => { setChangingRole(user); setSelectedRole(userRoles[user.user_id] || 'user'); }}><UserCog className="h-3.5 w-3.5 mr-2" />Đổi quyền</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => { setEditingUserInfo(user); setUserInfoForm({ full_name: user.full_name || '', phone: user.phone || '', email: user.email || '' }); }}><Edit className="h-3.5 w-3.5 mr-2" />Sửa thông tin</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => { setEditingUser(user); setBalanceAdjustment(''); }}><Wallet className="h-3.5 w-3.5 mr-2" />Điều chỉnh số dư</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => handleViewOrders(user)}><ShoppingBag className="h-3.5 w-3.5 mr-2" />Xem đơn hàng</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => handleViewLoginHistory(user)}><Eye className="h-3.5 w-3.5 mr-2" />Lịch sử đăng nhập</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => { setNotifyingUser(user); setNotificationTitle(''); setNotificationMessage(''); }}><Bell className="h-3.5 w-3.5 mr-2" />Gửi thông báo</DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.is_verified ? (
              <DropdownMenuItem className="text-xs text-orange-600" onClick={() => handleToggleVerification(user, false)}><BadgeCheck className="h-3.5 w-3.5 mr-2" />Thu hồi tích xanh</DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-xs text-blue-600" onClick={() => handleToggleVerification(user, true)}><BadgeCheck className="h-3.5 w-3.5 mr-2" />Cấp tích xanh</DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-xs" onClick={() => handleResetPassword(user)}><Key className="h-3.5 w-3.5 mr-2" />Đặt lại mật khẩu</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => { setBanningIp({ user }); setIpToBan(user.last_login_ip || ''); setIpBanReason(''); }}><Globe className="h-3.5 w-3.5 mr-2" />Ban IP</DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.is_banned ? (
              <DropdownMenuItem className="text-xs text-green-600" onClick={() => handleUnbanUser(user)}><CheckCircle className="h-3.5 w-3.5 mr-2" />Mở khóa</DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-xs text-destructive" onClick={() => { setBanningUser(user); setBanReason(''); }}><Ban className="h-3.5 w-3.5 mr-2" />Khóa tài khoản</DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-xs text-destructive" onClick={() => setDeletingUser(user)}><UserX className="h-3.5 w-3.5 mr-2" />Xóa tài khoản</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-base sm:text-xl font-bold truncate">Quản lý người dùng</h1>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDeleteInactive(true)}><Clock className="h-3.5 w-3.5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}><Download className="h-3.5 w-3.5 mr-2" />CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Stats - Compact horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2">
        {[
          { label: 'Tổng', value: stats.total, bg: 'bg-blue-500/10', color: 'text-blue-600' },
          { label: 'Admin', value: stats.admin, bg: 'bg-red-500/10', color: 'text-red-600' },
          { label: 'NV', value: stats.staff, bg: 'bg-indigo-500/10', color: 'text-indigo-600' },
          { label: 'Khóa', value: stats.banned, bg: 'bg-orange-500/10', color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-md px-2 py-1 flex-shrink-0`}>
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
            <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
        <div className="overflow-x-auto -mx-2 px-2">
          <TabsList className="h-8 p-0.5 bg-muted/50">
            <TabsTrigger value="users" className="h-7 text-[10px] px-2">Người dùng</TabsTrigger>
            <TabsTrigger value="deposits" className="h-7 text-[10px] px-2">Nạp tiền</TabsTrigger>
            <TabsTrigger value="vip" className="h-7 text-[10px] px-2">VIP</TabsTrigger>
            <TabsTrigger value="banned-ips" className="h-7 text-[10px] px-2">IP ({bannedIps.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-2 mt-2">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Tìm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-20 h-8 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                <SelectItem value="staff" className="text-xs">NV</SelectItem>
                <SelectItem value="user" className="text-xs">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-20 h-8 text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả</SelectItem>
                <SelectItem value="active" className="text-xs">HĐ</SelectItem>
                <SelectItem value="banned" className="text-xs">Khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Không tìm thấy</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredUsers.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          )}
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-2 mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Tìm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-8 text-xs" />
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {filteredDeposits.map(deposit => (
              <div key={deposit.id} className="bg-card rounded-lg border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{deposit.profiles?.full_name || deposit.profiles?.email}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(deposit.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-green-600">{formatPrice(deposit.amount)}</p>
                    {getStatusBadge(deposit.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* VIP Tab */}
        <TabsContent value="vip" className="space-y-2 mt-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => { setEditingVip({}); setVipForm({ name: '', min_spending: 0, discount_percent: 0 }); }}><Plus className="h-3 w-3 mr-1" />Thêm VIP</Button>
          <div className="space-y-1.5">
            {vipLevels.map(vip => (
              <div key={vip.id} className="bg-card rounded-lg border p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-semibold">{vip.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Min: {formatPrice(vip.min_spending)}</span>
                    <span className="text-[10px] font-medium text-green-600 ml-1">-{vip.discount_percent}%</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingVip(vip); setVipForm({ name: vip.name, min_spending: vip.min_spending, discount_percent: vip.discount_percent }); }}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteVip(vip.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Banned IPs Tab */}
        <TabsContent value="banned-ips" className="space-y-2 mt-2">
          <Button size="sm" className="h-7 text-xs" onClick={() => setBanningIp({ manual: true })}><Plus className="h-3 w-3 mr-1" />Ban IP</Button>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {bannedIps.map(ip => (
              <div key={ip.id} className="bg-card rounded-lg border p-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono font-medium">{ip.ip_address}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{ip.reason || 'Không có lý do'}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleUnbanIp(ip)}>
                    <CheckCircle className="h-3 w-3 mr-1" />Bỏ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {/* Delete User Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa tài khoản <strong>{deletingUser?.email}</strong>? Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Inactive Users Dialog */}
      <Dialog open={showDeleteInactive} onOpenChange={setShowDeleteInactive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài khoản không hoạt động</DialogTitle>
            <DialogDescription>Tìm và xóa các tài khoản không hoạt động trong một khoảng thời gian</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input type="number" value={inactiveDays} onChange={(e) => setInactiveDays(e.target.value)} placeholder="Số ngày" />
              <Button onClick={handleFindInactiveUsers}>Tìm kiếm</Button>
            </div>
            {inactiveUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tìm thấy {inactiveUsers.length} tài khoản không hoạt động</p>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {inactiveUsers.map(u => <div key={u.id} className="text-sm py-1">{u.email}</div>)}
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteInactive(false)}>Đóng</Button>
            {inactiveUsers.length > 0 && <Button variant="destructive" onClick={handleDeleteInactiveUsers} disabled={deletingInactive}>{deletingInactive && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Xóa tất cả</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit VIP Dialog */}
      <Dialog open={!!editingVip} onOpenChange={(open) => !open && setEditingVip(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVip?.id ? 'Sửa cấp VIP' : 'Thêm cấp VIP'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên</Label><Input value={vipForm.name} onChange={(e) => setVipForm({ ...vipForm, name: e.target.value })} /></div>
            <div><Label>Chi tiêu tối thiểu</Label><Input type="number" value={vipForm.min_spending} onChange={(e) => setVipForm({ ...vipForm, min_spending: Number(e.target.value) })} /></div>
            <div><Label>Giảm giá (%)</Label><Input type="number" value={vipForm.discount_percent} onChange={(e) => setVipForm({ ...vipForm, discount_percent: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingVip(null)}>Hủy</Button><Button onClick={handleSaveVip}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Điều chỉnh số dư</DialogTitle><DialogDescription>Số dư hiện tại: {formatPrice(editingUser?.balance || 0)}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Số tiền (+ hoặc -)</Label><Input type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} placeholder="+100000 hoặc -50000" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingUser(null)}>Hủy</Button><Button onClick={handleAdjustBalance}>Cập nhật</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Info Dialog */}
      <Dialog open={!!editingUserInfo} onOpenChange={(open) => !open && setEditingUserInfo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sửa thông tin người dùng</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Họ tên</Label><Input value={userInfoForm.full_name} onChange={(e) => setUserInfoForm({ ...userInfoForm, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={userInfoForm.email} onChange={(e) => setUserInfoForm({ ...userInfoForm, email: e.target.value })} /></div>
            <div><Label>Số điện thoại</Label><Input value={userInfoForm.phone} onChange={(e) => setUserInfoForm({ ...userInfoForm, phone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingUserInfo(null)}>Hủy</Button><Button onClick={handleEditUserInfo}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={!!banningUser} onOpenChange={(open) => !open && setBanningUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Khóa tài khoản</DialogTitle><DialogDescription>Khóa tài khoản: {banningUser?.email}</DialogDescription></DialogHeader>
          <div><Label>Lý do</Label><Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Nhập lý do khóa tài khoản..." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setBanningUser(null)}>Hủy</Button><Button variant="destructive" onClick={handleBanUser}>Khóa</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={!!notifyingUser} onOpenChange={(open) => !open && setNotifyingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gửi thông báo</DialogTitle><DialogDescription>Gửi đến: {notifyingUser?.email}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tiêu đề</Label><Input value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} /></div>
            <div><Label>Nội dung</Label><Textarea value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNotifyingUser(null)}>Hủy</Button><Button onClick={handleSendNotification}>Gửi</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Orders Dialog */}
      <Dialog open={!!viewingOrdersUser} onOpenChange={(open) => !open && setViewingOrdersUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Đơn hàng của {viewingOrdersUser?.email}</DialogTitle></DialogHeader>
          {ordersLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <ScrollArea className="h-80">
              <Table>
                <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Tổng tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày</TableHead></TableRow></TableHeader>
                <TableBody>
                  {userOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* View Login History Dialog */}
      <Dialog open={!!viewingLoginHistory} onOpenChange={(open) => !open && setViewingLoginHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Lịch sử đăng nhập</DialogTitle></DialogHeader>
          {loginHistoryLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <ScrollArea className="h-80">
              <Table>
                <TableHeader><TableRow><TableHead>IP</TableHead><TableHead>Thiết bị</TableHead><TableHead>Trình duyệt</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loginHistory.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono">{log.ip_address || '-'}</TableCell>
                      <TableCell>{log.device_type || '-'}</TableCell>
                      <TableCell>{log.browser || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(log.login_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban IP Dialog */}
      <Dialog open={!!banningIp} onOpenChange={(open) => !open && setBanningIp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ban địa chỉ IP</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Địa chỉ IP</Label><Input value={ipToBan} onChange={(e) => setIpToBan(e.target.value)} placeholder="192.168.1.1" /></div>
            <div><Label>Lý do</Label><Textarea value={ipBanReason} onChange={(e) => setIpBanReason(e.target.value)} placeholder="Lý do ban IP..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBanningIp(null)}>Hủy</Button><Button variant="destructive" onClick={handleBanIp}>Ban IP</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!changingRole} onOpenChange={(open) => !open && setChangingRole(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thay đổi quyền</DialogTitle><DialogDescription>Thay đổi quyền cho: {changingRole?.email}</DialogDescription></DialogHeader>
          <div>
            <Label>Quyền mới</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="staff">Nhân viên</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setChangingRole(null)}>Hủy</Button><Button onClick={handleChangeRole}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
