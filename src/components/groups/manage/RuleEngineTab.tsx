import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Zap, Trash2, AlertTriangle, MessageSquare, UserX, Clock } from "lucide-react";
import { useGroupAutoRules, useCreateAutoRule, useToggleAutoRule, useDeleteAutoRule } from "@/hooks/useGroupManagement";
import { toast } from "sonner";

interface RuleEngineTabProps {
  groupId: string;
  isOwner: boolean;
}

const ruleTypeLabels: Record<string, { label: string; icon: any; description: string }> = {
  post_limit: {
    label: "Giới hạn bài viết",
    icon: MessageSquare,
    description: "Giới hạn số bài viết mỗi ngày",
  },
  spam_detection: {
    label: "Phát hiện spam",
    icon: AlertTriangle,
    description: "Tự động mute khi spam",
  },
  low_reputation_kick: {
    label: "Kick điểm thấp",
    icon: UserX,
    description: "Tự động kick user điểm thấp",
  },
  inactive_kick: {
    label: "Kick không hoạt động",
    icon: Clock,
    description: "Kick thành viên không hoạt động",
  },
};

export function RuleEngineTab({ groupId, isOwner }: RuleEngineTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    ruleType: "post_limit",
    conditions: { limit: 5 },
    actions: { action: "mute", duration: 24 },
  });

  const { data: rules = [] } = useGroupAutoRules(groupId);
  const createRule = useCreateAutoRule();
  const toggleRule = useToggleAutoRule();
  const deleteRule = useDeleteAutoRule();

  const handleCreateRule = () => {
    if (!newRule.name.trim()) {
      toast.error("Vui lòng nhập tên rule");
      return;
    }
    createRule.mutate(
      {
        groupId,
        name: newRule.name,
        ruleType: newRule.ruleType,
        conditions: newRule.conditions,
        actions: newRule.actions,
      },
      {
        onSuccess: () => {
          toast.success("Đã tạo rule mới");
          setShowCreateDialog(false);
          setNewRule({
            name: "",
            ruleType: "post_limit",
            conditions: { limit: 5 },
            actions: { action: "mute", duration: 24 },
          });
        },
        onError: () => toast.error("Lỗi khi tạo rule"),
      }
    );
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    toggleRule.mutate(
      { groupId, ruleId, isActive: !isActive },
      {
        onSuccess: () => toast.success(isActive ? "Đã tắt rule" : "Đã bật rule"),
        onError: () => toast.error("Lỗi khi cập nhật rule"),
      }
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRule.mutate(
      { groupId, ruleId },
      {
        onSuccess: () => toast.success("Đã xoá rule"),
        onError: () => toast.error("Lỗi khi xoá rule"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Rule Engine</h3>
          <p className="text-xs text-muted-foreground">Tự động hoá quản lý group</p>
        </div>
        {isOwner && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tạo rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo rule tự động</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tên rule</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="VD: Giới hạn 5 bài/ngày"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại rule</Label>
                  <Select
                    value={newRule.ruleType}
                    onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ruleTypeLabels).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newRule.ruleType === "post_limit" && (
                  <div className="space-y-2">
                    <Label>Số bài tối đa/ngày</Label>
                    <Input
                      type="number"
                      value={newRule.conditions.limit}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: { ...newRule.conditions, limit: Number(e.target.value) },
                        })
                      }
                      min={1}
                    />
                  </div>
                )}

                {newRule.ruleType === "low_reputation_kick" && (
                  <div className="space-y-2">
                    <Label>Điểm tối thiểu</Label>
                    <Input
                      type="number"
                      value={newRule.conditions.limit || 0}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: { ...newRule.conditions, limit: Number(e.target.value) },
                        })
                      }
                      min={0}
                    />
                  </div>
                )}

                {newRule.ruleType === "inactive_kick" && (
                  <div className="space-y-2">
                    <Label>Số ngày không hoạt động</Label>
                    <Input
                      type="number"
                      value={newRule.conditions.limit || 30}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: { ...newRule.conditions, limit: Number(e.target.value) },
                        })
                      }
                      min={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Hành động khi vi phạm</Label>
                  <Select
                    value={newRule.actions.action}
                    onValueChange={(value) =>
                      setNewRule({ ...newRule, actions: { ...newRule.actions, action: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warn">Cảnh báo</SelectItem>
                      <SelectItem value="mute">Mute tạm thời</SelectItem>
                      <SelectItem value="kick">Kick</SelectItem>
                      <SelectItem value="ban">Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRule.actions.action === "mute" && (
                  <div className="space-y-2">
                    <Label>Thời gian mute (giờ)</Label>
                    <Input
                      type="number"
                      value={newRule.actions.duration}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          actions: { ...newRule.actions, duration: Number(e.target.value) },
                        })
                      }
                      min={1}
                    />
                  </div>
                )}

                <Button onClick={handleCreateRule} className="w-full">
                  Tạo rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Chưa có rule nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tạo rule để tự động hoá quản lý group
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => {
            const ruleInfo = ruleTypeLabels[rule.rule_type] || {
              label: rule.rule_type,
              icon: Zap,
              description: "",
            };
            const Icon = ruleInfo.icon;

            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rule.is_active ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${rule.is_active ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{rule.name}</span>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Đang bật" : "Đã tắt"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ruleInfo.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                        disabled={!isOwner}
                      />
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
