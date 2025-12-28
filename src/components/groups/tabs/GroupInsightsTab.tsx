import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGroupInsights } from '@/hooks/useGroupInsights';
import { Users, MessageCircle, ListTodo, Handshake, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GroupInsightsTabProps {
  groupId: string;
}

export function GroupInsightsTab({ groupId }: GroupInsightsTabProps) {
  const { data: insights, isLoading } = useGroupInsights(groupId);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thành viên</p>
                <p className="text-xl font-bold">{insights?.memberStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{insights?.memberStats?.active || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <MessageCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bài viết tuần</p>
                <p className="text-xl font-bold">{insights?.activityStats?.postsThisWeek || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/10">
                <ListTodo className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks hoàn thành</p>
                <p className="text-xl font-bold">{insights?.taskStats?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng deals</span>
                <span className="font-medium">{insights?.dealStats?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thành công</span>
                <span className="font-medium text-green-600">{insights?.dealStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tỷ lệ thành công</span>
                <span className="font-medium">
                  {insights?.dealStats?.total 
                    ? Math.round((insights.dealStats.completed / insights.dealStats.total) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tài chính
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng thu</span>
                <span className="font-medium text-green-600">
                  {(insights?.walletStats?.totalIncome || 0).toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng chi</span>
                <span className="font-medium text-red-600">
                  {(insights?.walletStats?.totalExpense || 0).toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số dư</span>
                <span className="font-bold">
                  {(insights?.walletStats?.balance || 0).toLocaleString()}đ
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Contributors */}
      {insights?.memberStats?.topContributors && insights.memberStats.topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top đóng góp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.memberStats.topContributors.map((contributor, index) => (
                <div key={contributor.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <span className="font-bold text-lg w-6">{index + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={contributor.avatar_url || undefined} />
                    <AvatarFallback>
                      {contributor.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{contributor.full_name || 'Người dùng'}</p>
                  </div>
                  <span className="font-semibold text-primary">
                    {contributor.contribution_points} điểm
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
