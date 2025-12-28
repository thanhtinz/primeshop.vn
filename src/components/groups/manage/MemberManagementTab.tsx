import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreVertical, UserX, Ban, EyeOff, Shield, Crown, Tag, AlertTriangle, History, Loader2, VolumeX } from "lucide-react";
import { useGroupMembers, useUpdateMemberRole, useRemoveMember } from "@/hooks/useGroups";
import { useBanMember, useGroupBans, useUnbanMember, useGroupViolations, useAddViolation, useUpdateMemberLabel } from "@/hooks/useGroupManagement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDateFormat } from "@/hooks/useDateFormat";

interface MemberManagementTabProps {
  groupId: string;
  isOwner: boolean;
}

const roleLabels: Record<string, string> = {
  owner: "Owner",
  manager: "Quản trị viên",
  seller: "Seller",
  member: "Thành viên",
  viewer: "Người xem",
};

const roleColors: Record<string, string> = {
  owner: "bg-yellow-500",
  manager: "bg-blue-500",
  seller: "bg-green-500",
  member: "bg-gray-500",
  viewer: "bg-gray-400",
};

export function MemberManagementTab({ groupId, isOwner }: MemberManagementTabProps) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [violationReason, setViolationReason] = useState("");
  const [actionMember, setActionMember] = useState<any>(null);
  const [actionType, setActionType] = useState<'kick' | 'ban' | 'mute' | null>(null);
  const { formatRelative } = useDateFormat();

  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const { data: bans = [] } = useGroupBans(groupId);
  const { data: violations = [] } = useGroupViolations(groupId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const banMember = useBanMember();
  const unbanMember = useUnbanMember();
  const addViolation = useAddViolation();
  const updateLabel = useUpdateMemberLabel();

  const filteredMembers = members.filter((m: any) =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (memberId: string, userId: string, newRole: string) => {
    updateRole.mutate(
      { groupId, memberId, role: newRole as any },
      {
        onSuccess: () => toast.success("Đã cập nhật vai trò"),
        onError: () => toast.error("Lỗi khi cập nhật vai trò"),
      }
    );
  };

  const handleKick = async (memberId: string, memberName: string) => {
    removeMember.mutate(
      { memberId, groupId },
      {
        onSuccess: () => {
          toast.success(`Đã kick ${memberName}`);
          setActionMember(null);
          setActionType(null);
        },
        onError: () => toast.error("Lỗi khi kick thành viên"),
      }
    );
  };

  const handleBan = (userId: string, reason: string, isPermanent: boolean) => {
    banMember.mutate(
      { groupId, userId, banType: isPermanent ? "permanent" : "temporary" },
      {
        onSuccess: () => {
          toast.success("Đã ban thành viên");
          setActionMember(null);
          setActionType(null);
        },
        onError: () => toast.error("Lỗi khi ban thành viên"),
      }
    );
  };

  const handleMute = async (memberId: string, memberName: string, duration: number) => {
    const mutedUntil = new Date();
    mutedUntil.setHours(mutedUntil.getHours() + duration);
    
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ muted_until: mutedUntil.toISOString() })
        .eq('id', memberId);
      
      if (error) throw error;
      toast.success(`Đã mute ${memberName} trong ${duration} giờ`);
      setActionMember(null);
      setActionType(null);
    } catch (error) {
      toast.error("Lỗi khi mute thành viên");
    }
  };

  const handleShadowBan = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ is_shadow_banned: true } as any)
        .eq('id', memberId);
      
      if (error) throw error;
      toast.success(`Đã shadow-ban ${memberName}`);
    } catch (error) {
      toast.error("Lỗi khi shadow-ban thành viên");
    }
  };

  const handleAddViolation = (userId: string) => {
    if (!violationReason) {
      toast.error("Vui lòng nhập lý do vi phạm");
      return;
    }
    addViolation.mutate(
      { groupId, userId, violationType: "warning", description: violationReason },
      {
        onSuccess: () => {
          toast.success("Đã ghi nhận vi phạm");
          setViolationReason("");
          setSelectedMember(null);
        },
        onError: () => toast.error("Lỗi khi ghi nhận vi phạm"),
      }
    );
  };

  const handleUpdateLabel = (memberId: string, label: string) => {
    updateLabel.mutate(
      { groupId, memberId, label },
      {
        onSuccess: () => toast.success("Đã cập nhật nhãn"),
        onError: () => toast.error("Lỗi khi cập nhật nhãn"),
      }
    );
  };

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="members" className="text-xs">
          Thành viên ({members.length})
        </TabsTrigger>
        <TabsTrigger value="bans" className="text-xs">
          Đã ban ({bans.length})
        </TabsTrigger>
        <TabsTrigger value="violations" className="text-xs">
          Vi phạm ({violations.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? "Không tìm thấy thành viên" : "Chưa có thành viên nào"}
          </div>
        ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredMembers.map((member: any) => (
            <Card key={member.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url} />
                    <AvatarFallback>
                      {member.profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {member.profile?.full_name || "Người dùng"}
                      </span>
                      <Badge variant="secondary" className={`text-xs text-white ${roleColors[member.role]}`}>
                        {roleLabels[member.role]}
                      </Badge>
                      {member.label && (
                        <Badge variant="outline" className="text-xs">
                          {member.label}
                        </Badge>
                      )}
                      {member.is_shadow_banned && (
                        <Badge variant="destructive" className="text-xs">
                          Shadow-ban
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{member.profile?.username} • Điểm: {member.contribution_points || 0}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {member.role === "owner" ? (
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                        Chủ nhóm
                      </DropdownMenuItem>
                    ) : (
                      <>
                        {isOwner && (
                          <>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.user_id, "manager")}>
                              <Shield className="h-4 w-4 mr-2" />
                              Phong Quản trị
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.user_id, "seller")}>
                              <Tag className="h-4 w-4 mr-2" />
                              Phong Seller
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.user_id, "member")}>
                              <Crown className="h-4 w-4 mr-2" />
                              Hạ về thành viên
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleUpdateLabel(member.id, "trusted")}>
                          <Tag className="h-4 w-4 mr-2 text-green-500" />
                          Gắn nhãn Trusted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateLabel(member.id, "warning")}>
                          <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                          Gắn nhãn Warning
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                          <History className="h-4 w-4 mr-2" />
                          Ghi nhận vi phạm
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setActionMember(member);
                            setActionType('mute');
                          }}
                          className="text-orange-500"
                        >
                          <VolumeX className="h-4 w-4 mr-2" />
                          Mute
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleKick(member.id, member.profile?.full_name || 'Thành viên')}
                          className="text-orange-500"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Kick tạm thời
                        </DropdownMenuItem>
                        {isOwner && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleShadowBan(member.id, member.profile?.full_name || 'Thành viên')}
                              className="text-orange-500"
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Shadow-ban
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBan(member.user_id, "Vi phạm nội quy", true)}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban vĩnh viễn
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
        )}
      </TabsContent>

      <TabsContent value="bans" className="space-y-4">
        {bans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có thành viên nào bị ban
          </div>
        ) : (
          <div className="space-y-2">
            {bans.map((ban: any) => (
              <Card key={ban.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ban.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Lý do: {ban.reason || "Không có"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ban.is_permanent ? "Vĩnh viễn" : `Đến ${ban.expires_at}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unbanMember.mutate({ groupId, banId: ban.id })}
                  >
                    Gỡ ban
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="violations" className="space-y-4">
        {violations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có lịch sử vi phạm
          </div>
        ) : (
          <div className="space-y-2">
            {violations.map((v: any) => (
              <Card key={v.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{v.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.violation_type}: {v.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(v.created_at)}
                    </p>
                  </div>
                  <Badge variant={v.is_resolved ? "secondary" : "destructive"}>
                    {v.is_resolved ? "Đã xử lý" : "Chưa xử lý"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Violation Dialog */}
      <AlertDialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ghi nhận vi phạm</AlertDialogTitle>
            <AlertDialogDescription>
              Ghi nhận vi phạm cho {selectedMember?.profile?.full_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={violationReason}
              onChange={(e) => setViolationReason(e.target.value)}
              placeholder="Nhập lý do vi phạm..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAddViolation(selectedMember?.user_id)}>
              Ghi nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
