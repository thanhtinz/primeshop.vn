import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGroupMembers, useUpdateMemberRole, useRemoveMember, GroupMemberRole } from '@/hooks/useGroups';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { useGroupBadges, useGroupMemberBadges, useAssignBadge, useRemoveBadge, GroupBadge } from '@/hooks/useGroupBadges';
import { Crown, Shield, Users, Eye, MoreHorizontal, UserMinus, Loader2, BadgeCheck, Star, Award, Plus, X } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { MemberBadgeDisplay } from '@/components/groups/MemberBadgeDisplay';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GroupMembersTabProps {
  groupId: string;
  canManage: boolean;
  isOwner: boolean;
}

const roleConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  owner: { icon: Crown, label: 'Owner', color: 'text-yellow-500 bg-yellow-500/10' },
  manager: { icon: Shield, label: 'Manager', color: 'text-blue-500 bg-blue-500/10' },
  seller: { icon: Users, label: 'Seller', color: 'text-purple-500 bg-purple-500/10' },
  member: { icon: Users, label: 'Member', color: 'text-muted-foreground bg-muted' },
  viewer: { icon: Eye, label: 'Viewer', color: 'text-muted-foreground bg-muted' },
};

export function GroupMembersTab({ groupId, canManage, isOwner }: GroupMembersTabProps) {
  const { data: members, isLoading } = useGroupMembers(groupId);
  const { data: frames } = useAvatarFrames();
  const { data: badges } = useGroupBadges(groupId);
  const { data: memberBadges } = useGroupMemberBadges(groupId);
  const { formatRelative } = useDateFormat();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const assignBadge = useAssignBadge();
  const removeBadgeMutation = useRemoveBadge();
  
  const [filter, setFilter] = useState<string>('all');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Get badges for a specific member
  const getMemberBadges = (memberId: string) => {
    return memberBadges?.filter(mb => mb.member_id === memberId) || [];
  };
  
  const handleRoleChange = (memberId: string, role: GroupMemberRole) => {
    if (role === 'owner') {
      toast.error('Không thể chuyển quyền owner');
      return;
    }
    updateRole.mutate({ memberId, groupId, role });
  };
  
  const handleRemove = (memberId: string) => {
    if (confirm('Xác nhận xóa thành viên này?')) {
      removeMember.mutate({ memberId, groupId });
    }
  };

  const handleAssignBadge = (badgeId: string) => {
    if (!selectedMember) return;
    assignBadge.mutate({
      badgeId,
      memberId: selectedMember.id,
      groupId,
    });
  };

  const handleRemoveBadge = (badgeId: string, memberId: string) => {
    removeBadgeMutation.mutate({ badgeId, memberId, groupId });
  };

  const openBadgeDialog = (member: any) => {
    setSelectedMember(member);
    setBadgeDialogOpen(true);
  };
  
  const filteredMembers = members?.filter(m => 
    filter === 'all' || m.role === filter
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Lọc theo role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredMembers?.length || 0} thành viên
        </span>
      </div>
      
      {/* Members List */}
      <div className="grid gap-3">
        {filteredMembers?.map((member) => {
          const roleInfo = roleConfig[member.role] || roleConfig.member;
          const RoleIcon = roleInfo.icon;
          const isCurrentOwner = member.role === 'owner';
          const memberFrame = frames?.find(f => f.id === (member.profile as any)?.avatar_frame_id);
          
          return (
            <Card key={member.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${(member.profile as any)?.username || member.user_id}`}>
                    <div className={cn("relative flex-shrink-0", memberFrame ? "h-16 w-16" : "h-12 w-12")}>
                      {memberFrame && (
                        <img 
                          src={memberFrame.image_url}
                          alt="Avatar frame"
                          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                          style={{ objectFit: 'contain' }}
                        />
                      )}
                      <div className={memberFrame ? "absolute inset-0 flex items-center justify-center" : ""}>
                        <Avatar 
                          className={cn(memberFrame ? "h-[72%] w-[72%]" : "h-full w-full", "border-2 border-background")}
                          style={{ borderRadius: memberFrame?.avatar_border_radius || '50%' }}
                        >
                          <AvatarImage 
                            src={(member.profile as any)?.avatar_url || undefined}
                            style={{ borderRadius: memberFrame?.avatar_border_radius || '50%' }}
                          />
                          <AvatarFallback style={{ borderRadius: memberFrame?.avatar_border_radius || '50%' }}>
                            {(member.profile as any)?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link 
                        to={`/user/${(member.profile as any)?.username || member.user_id}`}
                        className="font-medium hover:underline truncate"
                      >
                        {(member.profile as any)?.full_name || 'Người dùng'}
                      </Link>
                      {(member.profile as any)?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-100 flex-shrink-0" />
                      )}
                      {(member.profile as any)?.has_prime_boost && (
                        <PrimeBadge size="sm" />
                      )}
                      {(member.profile as any)?.vip_level_name && (member.profile as any)?.vip_level_name !== 'Member' && (
                        <VipBadge levelName={(member.profile as any).vip_level_name} size="sm" />
                      )}
                      {((member.profile as any)?.total_spent || 0) >= 1000000 && (
                        <Badge variant="outline" className="gap-0.5 text-[10px] h-4 px-1 bg-purple-500/10 border-purple-500/30 text-purple-600">
                          <Star className="h-2.5 w-2.5" />
                          Top
                        </Badge>
                      )}
                      <Badge variant="secondary" className={`gap-1 ${roleInfo.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleInfo.label}
                      </Badge>
                      {/* Member badges */}
                      <MemberBadgeDisplay badges={getMemberBadges(member.id)} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Điểm: {member.contribution_points}</span>
                      <span>
                        Tham gia: {formatRelative(member.joined_at)}
                      </span>
                    </div>
                  </div>
                  
                  {canManage && !isCurrentOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'manager')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Đặt làm Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'seller')}>
                              <Users className="h-4 w-4 mr-2" />
                              Đặt làm Seller
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                              <Users className="h-4 w-4 mr-2" />
                              Đặt làm Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Đặt làm Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleRemove(member.id)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Xóa khỏi group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
