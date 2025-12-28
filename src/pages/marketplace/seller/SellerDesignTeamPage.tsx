import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Users, Shield, Eye, MessageSquare, Wallet, Trash2, Edit } from 'lucide-react';
import { useDesignTeamMembers, useAddDesignTeamMember, useUpdateDesignTeamMember } from '@/hooks/useDesignAdvanced';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  owner: 'Chủ shop',
  designer: 'Designer',
  support: 'Hỗ trợ',
  viewer: 'Xem',
};

const roleColors: Record<string, string> = {
  owner: 'bg-yellow-500',
  designer: 'bg-blue-500',
  support: 'bg-green-500',
  viewer: 'bg-gray-500',
};

export default function SellerDesignTeamPage() {
  const { seller } = useOutletContext<any>();
  const { data: teamMembers, isLoading } = useDesignTeamMembers(seller?.id);
  const addMember = useAddDesignTeamMember();
  const updateMember = useUpdateDesignTeamMember();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [newMemberRole, setNewMemberRole] = useState('designer');
  const [permissions, setPermissions] = useState({
    can_view_orders: true,
    can_manage_orders: false,
    can_chat_buyers: false,
    can_manage_finances: false,
  });
  
  const handleSearchUser = async () => {
    if (!searchEmail) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, email')
      .eq('email', searchEmail)
      .single();
    
    if (error || !data) {
      toast.error('Không tìm thấy người dùng với email này');
      setFoundUser(null);
      return;
    }
    
    // Check if already a member
    if (teamMembers?.some(m => m.member_user_id === data.id)) {
      toast.error('Người dùng này đã là thành viên');
      setFoundUser(null);
      return;
    }
    
    setFoundUser(data);
  };
  
  const handleAddMember = async () => {
    if (!foundUser || !seller) return;
    
    await addMember.mutateAsync({
      seller_id: seller.id,
      member_user_id: foundUser.id,
      role: newMemberRole,
      ...permissions,
    });
    
    setIsAddDialogOpen(false);
    setFoundUser(null);
    setSearchEmail('');
    setNewMemberRole('designer');
    setPermissions({
      can_view_orders: true,
      can_manage_orders: false,
      can_chat_buyers: false,
      can_manage_finances: false,
    });
  };
  
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setNewMemberRole(member.role);
    setPermissions({
      can_view_orders: member.can_view_orders,
      can_manage_orders: member.can_manage_orders,
      can_chat_buyers: member.can_chat_buyers,
      can_manage_finances: member.can_manage_finances,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateMember = async () => {
    if (!selectedMember || !seller) return;
    
    await updateMember.mutateAsync({
      id: selectedMember.id,
      sellerId: seller.id,
      role: newMemberRole,
      ...permissions,
    });
    
    setIsEditDialogOpen(false);
    setSelectedMember(null);
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;
    
    await updateMember.mutateAsync({
      id: memberId,
      sellerId: seller.id,
      is_active: false,
    });
  };
  
  if (!seller) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Quản lý Team
          </h1>
          <p className="text-muted-foreground">Thêm cộng tác viên để hỗ trợ xử lý đơn hàng thiết kế</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm thành viên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm thành viên mới</DialogTitle>
              <DialogDescription>Tìm kiếm người dùng bằng email để thêm vào team</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button onClick={handleSearchUser}>Tìm</Button>
              </div>
              
              {foundUser && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={foundUser.avatar_url} />
                      <AvatarFallback>{foundUser.full_name?.[0] || foundUser.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{foundUser.full_name || foundUser.username}</p>
                      <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {foundUser && (
                <>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="support">Hỗ trợ</SelectItem>
                        <SelectItem value="viewer">Chỉ xem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Quyền hạn</Label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Xem đơn hàng</span>
                      </div>
                      <Switch
                        checked={permissions.can_view_orders}
                        onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_view_orders: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">Quản lý đơn hàng</span>
                      </div>
                      <Switch
                        checked={permissions.can_manage_orders}
                        onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_manage_orders: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">Chat với buyer</span>
                      </div>
                      <Switch
                        checked={permissions.can_chat_buyers}
                        onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_chat_buyers: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm">Quản lý tài chính</span>
                      </div>
                      <Switch
                        checked={permissions.can_manage_finances}
                        onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_manage_finances: checked }))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleAddMember} disabled={!foundUser || addMember.isPending}>
                Thêm thành viên
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Thành viên ({teamMembers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : !teamMembers?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có thành viên nào. Thêm cộng tác viên để hỗ trợ công việc!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.member?.avatar_url || ''} />
                          <AvatarFallback>{member.member?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.member?.full_name || member.member?.username}</p>
                          <p className="text-xs text-muted-foreground">{member.member?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role]}>
                        {roleLabels[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {member.can_view_orders && <Eye className="h-4 w-4 text-muted-foreground" />}
                        {member.can_manage_orders && <Shield className="h-4 w-4 text-muted-foreground" />}
                        {member.can_chat_buyers && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                        {member.can_manage_finances && <Wallet className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'owner' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditMember(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRemoveMember(member.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="support">Hỗ trợ</SelectItem>
                  <SelectItem value="viewer">Chỉ xem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>Quyền hạn</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Xem đơn hàng</span>
                </div>
                <Switch
                  checked={permissions.can_view_orders}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_view_orders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Quản lý đơn hàng</span>
                </div>
                <Switch
                  checked={permissions.can_manage_orders}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_manage_orders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Chat với buyer</span>
                </div>
                <Switch
                  checked={permissions.can_chat_buyers}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_chat_buyers: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">Quản lý tài chính</span>
                </div>
                <Switch
                  checked={permissions.can_manage_finances}
                  onCheckedChange={(checked) => setPermissions(p => ({ ...p, can_manage_finances: checked }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateMember} disabled={updateMember.isPending}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
