import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupDiscoverCard } from '@/components/groups/GroupDiscoverCard';
import { GroupSearchDialog } from '@/components/groups/GroupSearchDialog';
import { GroupSortDialog } from '@/components/groups/GroupSortDialog';
import { PostCard } from '@/components/social/PostCard';

import { useGroups } from '@/hooks/useGroups';
import { useJoinedGroupPosts } from '@/hooks/useJoinedGroupPosts';
import { useJoinedGroupsWithUnread } from '@/hooks/useGroupLastViews';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, Loader2, Users, ArrowLeft, 
  PenSquare, Compass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type TabType = 'for-you' | 'your-groups' | 'posts' | 'discover';

export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('for-you');
  const [search, setSearch] = useState('');
  
  
  const { data: joinedGroups, isLoading: isLoadingJoined } = useGroups('joined');
  const { data: joinedGroupsWithUnread, isLoading: isLoadingUnread } = useJoinedGroupsWithUnread();
  const { data: allGroups, isLoading: isLoadingAll } = useGroups('all');
  const { data: feedPosts, isLoading: isLoadingPosts } = useJoinedGroupPosts();
  const [dismissedPosts, setDismissedPosts] = useState<string[]>([]);
  
  const filteredGroups = allGroups?.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Transform group posts to PostCard format
  const transformedPosts = feedPosts?.map(p => ({
    id: p.id,
    user_id: p.author_id,
    content: p.content,
    images: p.media_urls || [],
    visibility: 'public' as const,
    background_color: null,
    likes_count: p.like_count || 0,
    comments_count: p.comment_count || 0,
    shares_count: 0,
    is_pinned: p.is_pinned,
    pinned_at: null,
    created_at: p.created_at,
    updated_at: p.created_at,
    user_profile: p.is_anonymous ? null : {
      user_id: p.author_id,
      full_name: p.author_name,
      email: '',
      avatar_url: p.author_avatar,
      avatar_frame_id: p.author_frame?.id || null,
      is_verified: p.author_is_verified,
      has_prime_boost: p.author_has_prime_boost,
      total_spent: p.author_total_spent,
      vip_level_name: p.author_vip_level,
      // Add avatar frame object
      avatar_frame: p.author_frame,
      // Add name color object
      name_color: p.author_name_color,
    },
    is_group_post: true,
    is_anonymous: p.is_anonymous,
    group_id: p.group_id,
    group: {
      id: p.group_id,
      name: p.group_name || '',
      avatar_url: p.group_avatar,
      cover_url: p.group_cover,
    },
    post_type: p.post_type,
    title: p.title,
    // Add user reaction for like button state
    user_reaction: p.user_reaction,
  })) || [];

  const visiblePosts = transformedPosts.filter(p => !dismissedPosts.includes(p.id));
  const [dismissedGroups, setDismissedGroups] = useState<string[]>([]);

  const handleDismissPost = (postId: string) => {
    setDismissedPosts(prev => [...prev, postId]);
  };

  const handleDismissGroup = (groupId: string) => {
    setDismissedGroups(prev => [...prev, groupId]);
  };

  // Filter out joined groups for discover
  const joinedGroupIds = joinedGroups?.map(g => g.id) || [];
  const discoverGroups = filteredGroups?.filter(
    g => !joinedGroupIds.includes(g.id) && !dismissedGroups.includes(g.id)
  );

  const tabs: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'for-you', label: 'Dành cho bạn' },
    { id: 'your-groups', label: 'Nhóm của bạn' },
    { id: 'posts', label: 'Bài viết' },
    { id: 'discover', label: 'Khám phá' },
  ];
  
  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background border-b">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold text-lg">Nhóm</h1>
              <div className="flex items-center gap-1">
                {user && <CreateGroupDialog />}
                <GroupSearchDialog />
              </div>
            </div>
            
            {/* Tabs */}
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-3">
                {tabs.map(tab => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
        
        <div className="container max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Your Groups Section - Always show if user has joined groups */}
          {activeTab === 'for-you' && user && !isLoadingUnread && joinedGroupsWithUnread && joinedGroupsWithUnread.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Nhóm của bạn</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => setActiveTab('your-groups')}
                >
                  Xem tất cả
                </Button>
              </div>
              
              <div className="space-y-1">
                {joinedGroupsWithUnread.slice(0, 3).map(group => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
                      <AvatarImage 
                        src={group.avatar_url || group.cover_url || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-lg bg-primary/10">
                        {group.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{group.name}</h4>
                      {group.unread_count > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span>
                            {group.unread_count > 25 
                              ? `Hơn 25 bài viết mới`
                              : `${group.unread_count} bài viết mới`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <PenSquare className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </Link>
                ))}
              </div>
            </section>
          )}
          
          {/* Content based on active tab */}
          {activeTab === 'for-you' && (
            <section>
              {/* Section header */}
              <h3 className="font-semibold text-lg mb-4">Đề xuất cho bạn</h3>
              
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : visiblePosts && visiblePosts.length > 0 ? (
                <div className="space-y-4">
                  {visiblePosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post as any}
                      showGroupBanner
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Tham gia các nhóm để xem bài viết tại đây
                  </p>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'your-groups' && (
            <section>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Hay truy cập nhất</h2>
                {joinedGroupsWithUnread && joinedGroupsWithUnread.length > 0 && (
                  <GroupSortDialog groups={joinedGroupsWithUnread} />
                )}
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm tên nhóm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isLoadingUnread ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : joinedGroupsWithUnread && joinedGroupsWithUnread.length > 0 ? (
                <div className="space-y-1">
                  {joinedGroupsWithUnread
                    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
                    .map(group => (
                    <Link
                      key={group.id}
                      to={`/groups/${group.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-14 w-14 rounded-lg flex-shrink-0">
                        <AvatarImage 
                          src={group.avatar_url || group.cover_url || undefined} 
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-primary/10">
                          {group.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{group.name}</h4>
                        {group.unread_count > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <span>
                              {group.unread_count > 25 
                                ? `Hơn 25 bài viết mới`
                                : `${group.unread_count} bài viết mới`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <PenSquare className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Bạn chưa tham gia nhóm nào</p>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'posts' && (
            <section>
              {/* Section header */}
              <h3 className="font-semibold text-lg mb-4">Bài viết</h3>
              
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transformedPosts.length > 0 ? (
                <div className="space-y-4">
                  {transformedPosts.map(post => (
                    <PostCard key={post.id} post={post as any} showGroupBanner />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PenSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Chưa có bài viết nào</p>
                </div>
              )}
            </section>
          )}
          
          {activeTab === 'discover' && (
            <section>
              <h2 className="font-semibold mb-4">Gợi ý cho bạn</h2>
              
              {isLoadingAll ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : discoverGroups && discoverGroups.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {discoverGroups.map(group => (
                    <GroupDiscoverCard
                      key={group.id}
                      id={group.id}
                      name={group.name}
                      avatar_url={group.avatar_url}
                      cover_url={group.cover_url}
                      visibility={group.visibility}
                      member_count={group.member_count}
                      onDismiss={handleDismissGroup}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Compass className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Không tìm thấy nhóm nào</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
