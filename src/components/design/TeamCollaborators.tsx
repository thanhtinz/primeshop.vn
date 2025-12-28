import { useState, useEffect } from 'react';
import { Users, Plus, X, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesignTicketCollaborators, useAddTicketCollaborator, useRemoveTicketCollaborator, useDesignTeamMembers } from '@/hooks/useDesignAdvanced';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamCollaboratorsProps {
  ticketId: string;
  orderId: string;
  sellerId: string;
  isSeller: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Chủ shop', color: 'bg-purple-500' },
  designer: { label: 'Designer', color: 'bg-blue-500' },
  support: { label: 'Hỗ trợ', color: 'bg-green-500' },
  viewer: { label: 'Xem', color: 'bg-gray-500' },
};

export function TeamCollaborators({ ticketId, orderId, sellerId, isSeller }: TeamCollaboratorsProps) {
  const { data: collaborators, isLoading } = useDesignTicketCollaborators(ticketId);
  const { data: teamMembers, isLoading: loadingTeam } = useDesignTeamMembers(sellerId);
  const addCollaborator = useAddTicketCollaborator();
  const removeCollaborator = useRemoveTicketCollaborator();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState('designer');
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<Record<string, any>>({});
  const [teamProfiles, setTeamProfiles] = useState<Record<string, any>>({});

  if (!isSeller) return null;

  // Lọc team members chưa được thêm vào ticket
  const availableMembers = teamMembers?.filter(
    member => !collaborators?.some(c => c.collaborator_id === member.member_user_id)
  ) || [];

  const handleAddMember = async () => {
    if (!selectedMemberId) return;
    
    const selectedMember = teamMembers?.find(m => m.member_user_id === selectedMemberId);
    if (!selectedMember) return;

    try {
      await addCollaborator.mutateAsync({
        ticket_id: ticketId,
        order_id: orderId,
        seller_id: sellerId,
        collaborator_id: selectedMemberId,
        role: selectedRole,
        permissions: [
          selectedMember.can_view_orders ? 'view_orders' : null,
          selectedMember.can_manage_orders ? 'manage_orders' : null,
          selectedMember.can_chat_buyers ? 'chat_buyers' : null,
          selectedMember.can_manage_finances ? 'manage_finances' : null,
        ].filter(Boolean) as string[],
      });
      toast.success('Đã thêm cộng tác viên vào ticket!');
      setAddDialogOpen(false);
      setSelectedMemberId('');
      setSelectedRole('designer');
    } catch (error) {
      toast.error('Không thể thêm cộng tác viên');
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await removeCollaborator.mutateAsync({
        id,
        ticketId,
      });
      toast.success('Đã xóa cộng tác viên khỏi ticket');
    } catch (error) {
      toast.error('Không thể xóa cộng tác viên');
    }
  };

  // Fetch collaborator profiles
  const fetchCollaboratorProfiles = async () => {
    if (!collaborators || collaborators.length === 0) return;
    
    const ids = collaborators.map(c => c.collaborator_id);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url')
      .in('user_id', ids);
    
    if (data) {
      const profileMap: Record<string, any> = {};
      data.forEach(p => { profileMap[p.user_id] = p; });
      setCollaboratorProfiles(profileMap);
    }
  };

  // Fetch team member profiles
  const fetchTeamProfiles = async () => {
    if (!teamMembers || teamMembers.length === 0) return;
    
    const ids = teamMembers.map(m => m.member_user_id);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, email')
      .in('user_id', ids);
    
    if (data) {
      const profileMap: Record<string, any> = {};
      data.forEach(p => { profileMap[p.user_id] = p; });
      setTeamProfiles(profileMap);
    }
  };

  // Fetch profiles when data changes
  useEffect(() => {
    if (collaborators && collaborators.length > 0) {
      fetchCollaboratorProfiles();
    }
  }, [collaborators]);

  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      fetchTeamProfiles();
    }
  }, [teamMembers]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team ({collaborators?.length || 0})
            </CardTitle>
            {availableMembers.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : collaborators && collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collab) => {
                const roleConfig = ROLE_CONFIG[collab.role || 'viewer'] || ROLE_CONFIG.viewer;
                const profile = collaboratorProfiles[collab.collaborator_id];
                
                return (
                  <div 
                    key={collab.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.full_name || profile?.username || 'Unknown'}
                      </p>
                      <Badge variant="outline" className={cn('text-xs', roleConfig.color, 'text-white')}>
                        {roleConfig.label}
                      </Badge>
                    </div>
                    {collab.role !== 'owner' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={() => handleRemoveMember(collab.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Chưa có cộng tác viên</p>
              {availableMembers.length > 0 ? (
                <Button 
                  variant="link" 
                  className="mt-1"
                  onClick={() => setAddDialogOpen(true)}
                >
                  Chọn từ team
                </Button>
              ) : (
                <p className="text-xs mt-1">
                  Thêm thành viên vào team ở Dashboard trước
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog - Select from existing team */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Thêm cộng tác viên vào ticket
            </DialogTitle>
            <DialogDescription>
              Chọn thành viên từ team của bạn để tham gia xử lý ticket này
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Select Team Member */}
            <div className="space-y-2">
              <Label>Chọn thành viên</Label>
              {loadingTeam ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : availableMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Không còn thành viên nào để thêm. Thêm thành viên vào team ở Dashboard.
                </p>
              ) : (
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành viên..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => {
                      const profile = teamProfiles[member.member_user_id];
                      const memberRole = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                      return (
                        <SelectItem key={member.member_user_id} value={member.member_user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profile?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {profile?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profile?.full_name || profile?.username || 'Unknown'}</span>
                            <Badge variant="outline" className="text-xs">
                              {memberRole.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Member Preview */}
            {selectedMemberId && (
              <div className="p-3 border rounded-lg bg-muted/50">
                {(() => {
                  const profile = teamProfiles[selectedMemberId];
                  const member = teamMembers?.find(m => m.member_user_id === selectedMemberId);
                  return (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{profile?.full_name || profile?.username}</p>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                        <div className="flex gap-1 mt-1">
                          {member?.can_view_orders && <Badge variant="outline" className="text-xs">Xem đơn</Badge>}
                          {member?.can_manage_orders && <Badge variant="outline" className="text-xs">Quản lý đơn</Badge>}
                          {member?.can_chat_buyers && <Badge variant="outline" className="text-xs">Chat</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Role in Ticket */}
            <div className="space-y-2">
              <Label>Vai trò trong ticket</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="designer">Designer - Xử lý thiết kế</SelectItem>
                  <SelectItem value="support">Hỗ trợ - Hỗ trợ khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!selectedMemberId || addCollaborator.isPending}
            >
              {addCollaborator.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Thêm vào ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
