import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserMinus,
  Search,
  Loader2,
  Check,
  X,
  Heart,
  UserX,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  usePendingFriendRequests, 
  useAcceptFriendRequest, 
  useRejectFriendRequest,
  useFriends,
  useUnfriend
} from '@/hooks/useFriends';
import { useFollowers, useFollowing, useUnfollow } from '@/hooks/useFollow';
import { motion, AnimatePresence } from 'framer-motion';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl" />
      <div className="relative w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center border border-border/50">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-xs">{description}</p>
  </motion.div>
);

const UserCard = ({ 
  profile, 
  actions,
  delay = 0
}: { 
  profile: { user_id: string; full_name?: string; username?: string; avatar_url?: string };
  actions?: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.05 }}
  >
    <Card className="p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all duration-300 hover:border-primary/30 group bg-card/50 backdrop-blur-sm">
      <Link 
        to={`/user/${profile.username || profile.user_id}`} 
        className="flex items-center gap-4 flex-1 min-w-0"
      >
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/50 transition-all">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {profile.full_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
            {profile.full_name || 'Người dùng'}
          </p>
          {profile.username && (
            <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
          )}
        </div>
      </Link>
      {actions && (
        <div className="flex gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </Card>
  </motion.div>
);

const StatCard = ({ 
  icon: Icon, 
  value, 
  label,
  active 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string;
  active?: boolean;
}) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-primary/10 text-primary' : 'bg-muted/50'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-primary/20' : 'bg-background'}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default function FriendsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  
  // Data hooks
  const { data: pendingRequests, isLoading: loadingRequests } = usePendingFriendRequests();
  const { data: friends, isLoading: loadingFriends } = useFriends(user?.id);
  const { data: followers, isLoading: loadingFollowers } = useFollowers(user?.id);
  const { data: following, isLoading: loadingFollowing } = useFollowing(user?.id);
  
  // Mutation hooks
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const unfriend = useUnfriend();
  const unfollow = useUnfollow();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Đăng nhập để tiếp tục</h2>
            <p className="text-muted-foreground mb-6">Vui lòng đăng nhập để xem bạn bè và người theo dõi của bạn.</p>
            <Link to="/auth">
              <Button size="lg" className="px-8">Đăng nhập ngay</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const filterBySearch = (items: any[], key: string) => {
    if (!searchTerm) return items;
    return items?.filter(item => {
      const name = item[key]?.full_name || item[key]?.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];
  };

  const stats = [
    { icon: UserPlus, value: pendingRequests?.length || 0, label: 'Lời mời', key: 'requests' },
    { icon: Users, value: friends?.length || 0, label: 'Bạn bè', key: 'friends' },
    { icon: Heart, value: followers?.length || 0, label: 'Theo dõi bạn', key: 'followers' },
    { icon: UserCheck, value: following?.length || 0, label: 'Đang theo dõi', key: 'following' },
  ];

  return (
    <Layout>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border/50 p-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Bạn bè & Theo dõi</h1>
                <p className="text-sm text-muted-foreground">Quản lý kết nối của bạn</p>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {stats.map((stat) => (
                <StatCard 
                  key={stat.key}
                  icon={stat.icon} 
                  value={stat.value} 
                  label={stat.label}
                  active={activeTab === stat.key}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-card/50 border-border/50 rounded-xl focus:border-primary/50 transition-all"
          />
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-xl grid grid-cols-4 gap-1">
            <TabsTrigger 
              value="requests" 
              className="relative rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Lời mời</span>
              <span className="sm:hidden">Mời</span>
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="friends" 
              className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Bạn bè</span>
              <span className="sm:hidden">Bạn</span>
              <span className="ml-1 text-muted-foreground">({friends?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Theo dõi</span>
              <span className="sm:hidden">Fan</span>
              <span className="ml-1 text-muted-foreground">({followers?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <span className="hidden sm:inline">Đang theo</span>
              <span className="sm:hidden">Theo</span>
              <span className="ml-1 text-muted-foreground">({following?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Pending Friend Requests */}
            <TabsContent value="requests" className="space-y-3 mt-0">
              {loadingRequests ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : pendingRequests && pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {filterBySearch(pendingRequests, 'requester_profile').map((request, index) => (
                    <UserCard 
                      key={request.id} 
                      profile={request.requester_profile}
                      delay={index}
                      actions={
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => acceptRequest.mutate(request.id)}
                            disabled={acceptRequest.isPending}
                            className="rounded-full gap-1.5"
                          >
                            <Check className="h-4 w-4" />
                            <span className="hidden sm:inline">Chấp nhận</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => rejectRequest.mutate(request.id)}
                            disabled={rejectRequest.isPending}
                            className="rounded-full text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Sparkles}
                  title="Không có lời mời nào"
                  description="Khi có người gửi lời mời kết bạn, bạn sẽ thấy ở đây."
                />
              )}
            </TabsContent>

            {/* Friends List */}
            <TabsContent value="friends" className="space-y-3 mt-0">
              {loadingFriends ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : friends && friends.length > 0 ? (
                <div className="space-y-3">
                  {filterBySearch(friends, 'friend_profile').map((friendship, index) => (
                    <UserCard 
                      key={friendship.id} 
                      profile={friendship.friend_profile}
                      delay={index}
                      actions={
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => unfriend.mutate(friendship.friend_profile.user_id)}
                          disabled={unfriend.isPending}
                          className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserX className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Huỷ bạn</span>
                        </Button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Users}
                  title="Chưa có bạn bè"
                  description="Hãy kết nối với mọi người bằng cách gửi lời mời kết bạn."
                />
              )}
            </TabsContent>

            {/* Followers List */}
            <TabsContent value="followers" className="space-y-3 mt-0">
              {loadingFollowers ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : followers && followers.length > 0 ? (
                <div className="space-y-3">
                  {filterBySearch(followers.map(f => ({ profile: f })), 'profile').map((item, index) => (
                    <UserCard 
                      key={item.profile.user_id} 
                      profile={item.profile}
                      delay={index}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Heart}
                  title="Chưa có người theo dõi"
                  description="Khi có người theo dõi bạn, họ sẽ xuất hiện ở đây."
                />
              )}
            </TabsContent>

            {/* Following List */}
            <TabsContent value="following" className="space-y-3 mt-0">
              {loadingFollowing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Đang tải...</p>
                </div>
              ) : following && following.length > 0 ? (
                <div className="space-y-3">
                  {filterBySearch(following.map(f => ({ profile: f })), 'profile').map((item, index) => (
                    <UserCard 
                      key={item.profile.user_id} 
                      profile={item.profile}
                      delay={index}
                      actions={
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => unfollow.mutate(item.profile.user_id)}
                          disabled={unfollow.isPending}
                          className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <UserMinus className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Bỏ theo dõi</span>
                        </Button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={UserPlus}
                  title="Chưa theo dõi ai"
                  description="Theo dõi người dùng khác để xem hoạt động của họ."
                />
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </Layout>
  );
}
