import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useGroupPosts, GroupPostType } from '@/hooks/useGroupPosts';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { Loader2 } from 'lucide-react';
import { CreateGroupPostCard } from '@/components/groups/CreateGroupPostCard';
import { PostFilterSheet, PostFilterType } from '@/components/groups/PostFilterSheet';
import { PostCard } from '@/components/social/PostCard';

interface GroupPostsTabProps {
  groupId: string;
  membership: { role: string } | null;
  groupInfo?: { name: string; avatar_url: string | null };
}

export function GroupPostsTab({ groupId, membership, groupInfo }: GroupPostsTabProps) {
  const { user } = useAuth();
  const [postFilter, setPostFilter] = useState<PostFilterType>('relevant');
  const { data: posts, isLoading } = useGroupPosts(groupId, undefined, postFilter);
  const { data: frames } = useAvatarFrames();
  
  const isOwnerOrAdmin = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'manager';
  
  // Transform group posts to PostCard format with full author profile data
  const transformedPosts = useMemo(() => {
    return posts?.map(post => {
      const authorProfile = post.author as any;
      const postData = post as any;
      return {
        id: post.id,
        user_id: post.author_id,
        content: post.content,
        images: post.media_urls || [],
        visibility: 'public' as const,
        background_color: null,
        likes_count: post.like_count || 0,
        comments_count: post.comment_count || 0,
        shares_count: 0,
        is_pinned: post.is_pinned,
        pinned_at: null,
        created_at: post.created_at,
        updated_at: post.updated_at || post.created_at,
        user_profile: post.is_anonymous ? null : {
          user_id: post.author_id,
          full_name: authorProfile?.full_name || 'Người dùng',
          email: '',
          avatar_url: authorProfile?.avatar_url,
          avatar_frame_id: authorProfile?.avatar_frame_id,
          is_verified: authorProfile?.is_verified,
          has_prime_boost: authorProfile?.has_prime_boost,
          total_spent: authorProfile?.total_spent,
          vip_level_name: authorProfile?.vip_level_name,
          username: authorProfile?.username,
          // Add avatar frame and name color objects
          avatar_frame: authorProfile?.avatar_frame,
          name_color: authorProfile?.name_color,
        },
        is_group_post: true,
        is_anonymous: post.is_anonymous,
        is_liked: !!post.user_reaction,
        group_id: groupId,
        group: {
          id: groupId,
          name: groupInfo?.name || '',
          avatar_url: groupInfo?.avatar_url || null,
        },
        post_type: post.post_type,
        title: post.title,
        user_reaction: post.user_reaction,
        reaction_counts: postData.reaction_counts || {},
        // For admin/owner: show real author even if anonymous
        show_real_author: post.is_anonymous && isOwnerOrAdmin,
        real_author: post.is_anonymous && isOwnerOrAdmin ? {
          full_name: authorProfile?.full_name || 'Người dùng',
          avatar_url: authorProfile?.avatar_url,
        } : undefined,
      };
    }) || [];
  }, [posts, groupId, groupInfo, isOwnerOrAdmin]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Create Post */}
      {membership && (
        <CreateGroupPostCard groupId={groupId} />
      )}
      
      {/* Sort/Filter */}
      <PostFilterSheet 
        value={postFilter} 
        onChange={setPostFilter}
      />
      
      {/* Posts List */}
      {transformedPosts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có bài viết nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transformedPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post as any}
              showGroupBanner={false}
              isGroupOwnerOrAdmin={isOwnerOrAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
