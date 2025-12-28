import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Handshake, Wallet, TrendingUp, Download, Activity, CheckCircle2 } from "lucide-react";
import { useGroupStats, useGroupActivityLogs } from "@/hooks/useGroupManagement";
import { useDateFormat } from "@/hooks/useDateFormat";

interface GroupStatsTabProps {
  groupId: string;
  isOwner: boolean;
}

export function GroupStatsTab({ groupId, isOwner }: GroupStatsTabProps) {
  const { data: stats, isLoading } = useGroupStats(groupId);
  const { data: activityLogs = [] } = useGroupActivityLogs(groupId);
  const { formatRelative } = useDateFormat();

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log("Export CSV");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Thống kê Group</h3>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Xuất CSV
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Thành viên</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.newMembers || 0}</p>
                <p className="text-xs text-muted-foreground">Thành viên mới</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
                <p className="text-xs text-muted-foreground">Bài viết</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CheckCircle2 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.recentPosts || 0}</p>
                <p className="text-xs text-muted-foreground">Bài gần đây</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Handshake className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.wallet?.total_income || 0).toLocaleString()}đ</p>
                <p className="text-xs text-muted-foreground">Thu nhập</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(stats?.wallet?.balance || 0).toLocaleString()}đ
                </p>
                <p className="text-xs text-muted-foreground">Số dư ví</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              Chưa có hoạt động nào
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activityLogs.slice(0, 20).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-foreground">
                      <span className="font-medium">{log.action}</span>
                      {log.target_type && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {log.target_type}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
