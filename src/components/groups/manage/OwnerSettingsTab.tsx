import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Settings, Shield, Wallet, Users, Trash2, Lock, Eye, EyeOff, ArrowRightLeft, FileText } from "lucide-react";
import { useTransferOwnership } from "@/hooks/useGroupManagement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GroupSettings {
  post_moderation?: 'none' | 'new_members' | 'all';
  new_member_days?: number;
}

interface OwnerSettingsTabProps {
  groupId: string;
  group: {
    name: string;
    description?: string;
    avatar_url?: string;
    cover_url?: string;
    is_private?: boolean;
    join_type?: string;
    min_reputation?: number;
    join_fee?: number;
    settings?: GroupSettings;
  };
}

export function OwnerSettingsTab({ groupId, group }: OwnerSettingsTabProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [isPrivate, setIsPrivate] = useState(group.is_private || false);
  const [joinType, setJoinType] = useState<"open" | "approval" | "code" | "link" | "conditional">(group.join_type as any || "open");
  const [minReputation, setMinReputation] = useState(group.min_reputation || 0);
  const [joinFee, setJoinFee] = useState(group.join_fee || 0);
  const [isHidden, setIsHidden] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Post moderation settings
  const [postModeration, setPostModeration] = useState<'none' | 'new_members' | 'all'>(
    group.settings?.post_moderation || 'none'
  );
  const [newMemberDays, setNewMemberDays] = useState(group.settings?.new_member_days || 7);

  const transferOwnership = useTransferOwnership();

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settings = {
        post_moderation: postModeration,
        new_member_days: newMemberDays,
      } as Record<string, unknown>;
      
      const { error } = await supabase
        .from("groups")
        .update({
          name,
          description,
          is_private: isPrivate,
          join_type: joinType,
          min_reputation: minReputation,
          join_fee: joinFee,
          settings,
        } as any)
        .eq("id", groupId);

      if (error) throw error;
      toast.success("Đã lưu cài đặt group");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const handleTransferOwnership = () => {
    if (!newOwnerId) {
      toast.error("Vui lòng nhập ID thành viên");
      return;
    }
    transferOwnership.mutate(
      { groupId, newOwnerId },
      {
        onSuccess: () => {
          toast.success("Đã chuyển quyền Owner thành công");
          setNewOwnerId("");
        },
        onError: () => {
          toast.error("Lỗi khi chuyển quyền Owner");
        },
      }
    );
  };

  const handleDeleteGroup = async () => {
    try {
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;
      toast.success("Đã xoá group");
      window.location.href = "/groups";
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xoá group");
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="general" className="text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Cài đặt
        </TabsTrigger>
        <TabsTrigger value="posts" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          Bài viết
        </TabsTrigger>
        <TabsTrigger value="join" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          Tham gia
        </TabsTrigger>
        <TabsTrigger value="wallet" className="text-xs">
          <Wallet className="h-3 w-3 mr-1" />
          Tài chính
        </TabsTrigger>
        <TabsTrigger value="danger" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Nâng cao
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tên group</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Group riêng tư</Label>
                <p className="text-xs text-muted-foreground">
                  Chỉ thành viên mới xem được nội dung
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Ẩn khỏi tìm kiếm</Label>
                <p className="text-xs text-muted-foreground">
                  Group không hiển thị trong kết quả tìm kiếm
                </p>
              </div>
              <Switch checked={isHidden} onCheckedChange={setIsHidden} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Khoá group</Label>
                <p className="text-xs text-muted-foreground">
                  Không cho phép thành viên mới tham gia
                </p>
              </div>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} />
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="posts" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Kiểm duyệt bài viết</CardTitle>
            <CardDescription>
              Cấu hình cách duyệt bài viết trước khi đăng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chế độ kiểm duyệt</Label>
              <Select 
                value={postModeration} 
                onValueChange={(val) => setPostModeration(val as typeof postModeration)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Không cần duyệt - Bài viết đăng ngay
                  </SelectItem>
                  <SelectItem value="new_members">
                    Duyệt thành viên mới - Chỉ thành viên mới cần duyệt
                  </SelectItem>
                  <SelectItem value="all">
                    Duyệt tất cả - Mọi bài viết cần được duyệt
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {postModeration === 'none' && "Tất cả bài viết sẽ được đăng ngay lập tức"}
                {postModeration === 'new_members' && "Thành viên mới cần được duyệt bài, thành viên cũ đăng ngay"}
                {postModeration === 'all' && "Mọi bài viết cần được Owner/Manager duyệt trước"}
              </p>
            </div>
            
            {postModeration === 'new_members' && (
              <div className="space-y-2">
                <Label>Số ngày là "thành viên mới"</Label>
                <Input
                  type="number"
                  value={newMemberDays}
                  onChange={(e) => setNewMemberDays(Number(e.target.value))}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">
                  Thành viên tham gia trong {newMemberDays} ngày gần đây cần được duyệt bài
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Owner & Manager</Label>
                <p className="text-xs text-muted-foreground">
                  Không bị ảnh hưởng bởi kiểm duyệt
                </p>
              </div>
              <span className="text-xs text-green-500 font-medium">Luôn đăng ngay</span>
            </div>
            
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="join" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Điều kiện tham gia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hình thức tham gia</Label>
              <Select value={joinType} onValueChange={(val) => setJoinType(val as typeof joinType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Mở - Ai cũng có thể tham gia</SelectItem>
                  <SelectItem value="approval">Duyệt tay - Cần được phê duyệt</SelectItem>
                  <SelectItem value="code">Mã mời - Cần mã để tham gia</SelectItem>
                  <SelectItem value="link">Link mời - Chỉ tham gia qua link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Điểm uy tín tối thiểu</Label>
              <Input
                type="number"
                value={minReputation}
                onChange={(e) => setMinReputation(Number(e.target.value))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Thành viên cần có ít nhất điểm này để tham gia
              </p>
            </div>
            <div className="space-y-2">
              <Label>Phí vào group (đ)</Label>
              <Input
                type="number"
                value={joinFee}
                onChange={(e) => setJoinFee(Number(e.target.value))}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Phí một lần để tham gia group
              </p>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="wallet" className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cài đặt tài chính</CardTitle>
            <CardDescription>
              Thiết lập phí và hoa hồng cho group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phí thành viên hàng tháng (đ)</Label>
              <Input type="number" defaultValue={0} min={0} />
            </div>
            <div className="space-y-2">
              <Label>% hoa hồng từ deal</Label>
              <Input type="number" defaultValue={0} min={0} max={100} />
              <p className="text-xs text-muted-foreground">
                % ăn chia từ mỗi deal thành công trong group
              </p>
            </div>
            <div className="space-y-2">
              <Label>Giá bán role VIP (đ)</Label>
              <Input type="number" defaultValue={0} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Giá bán role Seller (đ)</Label>
              <Input type="number" defaultValue={0} min={0} />
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="danger" className="space-y-4">
        <Card className="border-orange-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Chuyển quyền Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ID thành viên mới</Label>
              <Input
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                placeholder="Nhập ID thành viên sẽ nhận quyền Owner"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10">
                  Chuyển quyền Owner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận chuyển quyền?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn sẽ mất quyền Owner và trở thành Manager. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTransferOwnership}>
                    Xác nhận chuyển
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Xoá group vĩnh viễn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Xoá toàn bộ dữ liệu group bao gồm bài viết, thành viên, deal, task. 
              Hành động này không thể hoàn tác.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Xoá group vĩnh viễn
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xoá group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tất cả dữ liệu sẽ bị xoá vĩnh viễn và không thể khôi phục. 
                    Bạn có chắc chắn muốn tiếp tục?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteGroup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Xoá vĩnh viễn
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
