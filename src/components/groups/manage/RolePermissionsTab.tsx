import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Shield, Users, Trash2 } from "lucide-react";
import { useAllGroupPermissions, useUpdateRolePermissions, useGroupCustomRoles, useCreateCustomRole, useDeleteCustomRole } from "@/hooks/useGroupManagement";
import { toast } from "sonner";

interface RolePermissionsTabProps {
  groupId: string;
  isOwner: boolean;
}

const permissionLabels: Record<string, string> = {
  can_post: "Đăng bài",
  can_comment: "Bình luận",
  can_create_deal: "Tạo deal",
  can_create_task: "Tạo task",
  can_create_poll: "Tạo poll",
  can_view_insights: "Xem thống kê",
  can_invite: "Mời thành viên",
  can_manage_members: "Quản lý thành viên",
  can_manage_posts: "Quản lý bài viết",
  can_manage_wallet: "Quản lý tài chính",
  can_manage_rules: "Quản lý rules",
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  manager: "Quản trị viên",
  seller: "Seller",
  member: "Thành viên",
  viewer: "Người xem",
};

export function RolePermissionsTab({ groupId, isOwner }: RolePermissionsTabProps) {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#6366f1");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: permissions = [] } = useAllGroupPermissions(groupId);
  const { data: customRoles = [] } = useGroupCustomRoles(groupId);
  const updatePermissions = useUpdateRolePermissions();
  const createRole = useCreateCustomRole();
  const deleteRole = useDeleteCustomRole();

  const handlePermissionChange = (role: "owner" | "manager" | "seller" | "member" | "viewer", permission: string, value: boolean) => {
    updatePermissions.mutate(
      { groupId, role, permissions: { [permission]: value } },
      {
        onSuccess: () => toast.success("Đã cập nhật quyền"),
        onError: () => toast.error("Lỗi khi cập nhật quyền"),
      }
    );
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast.error("Vui lòng nhập tên role");
      return;
    }
    createRole.mutate(
      { groupId, name: newRoleName, color: newRoleColor },
      {
        onSuccess: () => {
          toast.success("Đã tạo role mới");
          setNewRoleName("");
          setShowCreateDialog(false);
        },
        onError: () => toast.error("Lỗi khi tạo role"),
      }
    );
  };

  const handleDeleteRole = (roleId: string) => {
    deleteRole.mutate(
      { groupId, roleId },
      {
        onSuccess: () => toast.success("Đã xoá role"),
        onError: () => toast.error("Lỗi khi xoá role"),
      }
    );
  };

  // Group permissions by role
  const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.role]) acc[perm.role] = perm;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Phân quyền theo vai trò</h3>
        {isOwner && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tạo role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo role tuỳ chỉnh</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tên role</Label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="VD: VIP, Moderator..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Màu sắc</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateRole} className="w-full">
                  Tạo role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Custom Roles */}
      {customRoles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Role tuỳ chỉnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {customRoles.map((role: any) => (
                <div
                  key={role.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{ borderColor: role.color }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="text-sm">{role.name}</span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Role Permissions */}
      <Tabs defaultValue="manager" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="manager" className="text-xs">Manager</TabsTrigger>
          <TabsTrigger value="seller" className="text-xs">Seller</TabsTrigger>
          <TabsTrigger value="member" className="text-xs">Member</TabsTrigger>
          <TabsTrigger value="viewer" className="text-xs">Viewer</TabsTrigger>
        </TabsList>

        {["manager", "seller", "member", "viewer"].map((role) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Quyền của {roleLabels[role]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(permissionLabels).map(([key, label]) => {
                  const perm = groupedPermissions[role];
                  const isChecked = perm?.[key] || false;
                  const isDisabled = role === "owner" || !isOwner;

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={(value) => handlePermissionChange(role as "owner" | "manager" | "seller" | "member" | "viewer", key, value)}
                        disabled={isDisabled}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
