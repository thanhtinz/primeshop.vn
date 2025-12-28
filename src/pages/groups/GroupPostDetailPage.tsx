import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, MoreHorizontal, Globe, ThumbsUp, MessageCircle, Share2, BadgeCheck
} from "lucide-react";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GroupPostComments } from "@/components/groups/GroupPostComments";
import { cn } from "@/lib/utils";
import { PostOptionsSheet } from "@/components/social/PostOptionsSheet";
import { useHidePost, PostType as ModerationPostType } from "@/hooks/usePostModeration";
import { useDeleteGroupPost, useReactToGroupPost, useGroupPostReactions } from "@/hooks/useGroupPosts";
import { EditGroupPostDialog } from "@/components/groups/EditGroupPostDialog";
import { ReportPostDialog } from "@/components/social/ReportPostDialog";
import { HideUserDialog } from "@/components/social/HideUserDialog";
import { ReactionsModal } from "@/components/social/ReactionsModal";
import { ReactionPicker, REACTION_EMOJIS, ReactionType } from "@/components/social/ReactionPicker";
// usePostReactions removed - using useGroupPostReactions instead
import { useAvatarFrames } from "@/hooks/useAvatarFrames";
import { VipBadge } from "@/components/ui/vip-badge";
import { PrimeBadge } from "@/components/ui/prime-badge";
import { MemberBadgeDisplay } from "@/components/groups/MemberBadgeDisplay";

export default function GroupPostDetailPage() {
  const { id: groupId, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [hideUserDialogOpen, setHideUserDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const hidePost = useHidePost();
  const deleteGroupPost = useDeleteGroupPost();
  const reactToGroupPost = useReactToGroupPost();
  const { data: frames } = useAvatarFrames();
  
  // Fetch post reactions when modal is open - use group post reactions hook
  const { data: reactionsData, isLoading: isLoadingReactions } = useGroupPostReactions(
    reactionsModalOpen ? postId! : ''
  );

  // Fetch post details
  const { data: post, isLoading } = useQuery({
    queryKey: ['group-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          group:groups(id, name, avatar_url)
        `)
        .eq('id', postId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      // Fetch author separately with all needed fields
      let author: any = null;
      let authorGroupBadges: any[] = [];
      
      if (data && !data.is_anonymous && data.author_id) {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select(`
            user_id, full_name, username, avatar_url, is_verified, has_prime_boost,
            avatar_frame_id, vip_level_id, nickname, active_name_color_id
          `)
          .eq('user_id', data.author_id)
          .maybeSingle();
        
        if (authorProfile) {
          // Fetch name color if exists
          let nameColor = null;
          if (authorProfile.active_name_color_id) {
            const { data: colorData } = await supabase
              .from('name_colors')
              .select('is_gradient, color_value, gradient_value')
              .eq('id', authorProfile.active_name_color_id)
              .maybeSingle();
            nameColor = colorData;
          }
          
          // Fetch VIP level name if exists
          let vipLevelName = null;
          if (authorProfile.vip_level_id) {
            const { data: vipData } = await supabase
              .from('vip_levels')
              .select('name')
              .eq('id', authorProfile.vip_level_id)
              .maybeSingle();
            vipLevelName = vipData?.name || null;
          }
          
          author = {
            ...authorProfile,
            name_color: nameColor,
            vip_level_name: vipLevelName,
          };
        }
        
        // Fetch author's group member ID first, then their badges
        const { data: memberData } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', data.group_id)
          .eq('user_id', data.author_id)
          .maybeSingle();
        
        if (memberData) {
          const { data: badgesData } = await supabase
            .from('group_member_badges')
            .select(`
              *,
              badge:group_badges(*)
            `)
            .eq('member_id', memberData.id);
          
          authorGroupBadges = badgesData || [];
        }
      }
      
      return { ...data, author, author_group_badges: authorGroupBadges };
    },
    enabled: !!postId
  });

  // Check if user liked this post and get their reaction type
  useQuery({
    queryKey: ['group-post-like', postId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('group_post_likes')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setIsLiked(true);
        setUserReaction((data.reaction_type as ReactionType) || 'like');
      } else {
        setIsLiked(false);
        setUserReaction(null);
      }
      return data;
    },
    enabled: !!postId && !!user?.id
  });

  const handleLike = async () => {
    console.log('[GroupPostDetailPage] handleLike called', { user: user?.id, postId, isLiked });
    
    if (!user) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      if (isLiked) {
        console.log('[GroupPostDetailPage] Removing like');
        const { error } = await supabase
          .from('group_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('[GroupPostDetailPage] Delete error:', error);
          throw error;
        }
        setIsLiked(false);
        setUserReaction(null);
      } else {
        console.log('[GroupPostDetailPage] Adding like');
        const { error } = await supabase
          .from('group_post_likes')
          .insert({ post_id: postId, user_id: user.id, reaction_type: 'like' });
        
        if (error) {
          console.error('[GroupPostDetailPage] Insert error:', error);
          throw error;
        }
        setIsLiked(true);
        setUserReaction('like');
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['group-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-post-reactions', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success(isLiked ? "Đã bỏ thích" : "Đã thích");
    } catch (error: any) {
      console.error('[GroupPostDetailPage] Like error:', error);
      toast.error(error?.message || "Có lỗi xảy ra");
    }
  };

  const handleReaction = (type: ReactionType) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thả cảm xúc");
      return;
    }
    setShowReactionPicker(false);
    reactToGroupPost.mutate({ 
      postId: postId!, 
      groupId: groupId!,
      reactionType: type 
    }, {
      onSuccess: () => {
        setIsLiked(true);
        setUserReaction(type);
      }
    });
  };

  const handleLongPressStart = useCallback(() => {
    if (!user) return;
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  }, [user]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc muốn xoá bài viết này?')) {
      deleteGroupPost.mutate({ postId: postId!, groupId: groupId! }, {
        onSuccess: () => {
          navigate(-1);
          toast.success('Đã xóa bài viết');
        }
      });
    }
  };

  const handleHidePost = () => {
    hidePost.mutate({ postId: postId!, postType: 'group_post' as ModerationPostType }, {
      onSuccess: () => navigate(-1)
    });
  };

  // Derived values
  const isOwner = user?.id === post?.author_id;
  const authorName = post?.is_anonymous ? "Ẩn danh" : post?.author?.full_name || "Người dùng";
  
  // Get user's avatar frame (for non-anonymous posts)
  const userFrame = !post?.is_anonymous && post?.author?.avatar_frame_id 
    ? frames?.find(f => f.id === post?.author?.avatar_frame_id) 
    : null;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-4 px-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8 px-4 text-center">
          <p className="text-muted-foreground">Không tìm thấy bài viết</p>
          <Button variant="link" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </Layout>
    );
  }

  const { formatRelative } = useDateFormat();
  const timeAgo = formatRelative(post.created_at, { addSuffix: false });
  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-background min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-base">Bài viết của {authorName}</h1>
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setOptionsSheetOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          )}
          {!user && <div className="w-10" />}
        </div>

        {/* Post Options Sheet */}
        <PostOptionsSheet
          open={optionsSheetOpen}
          onOpenChange={setOptionsSheetOpen}
          postId={post.id}
          authorName={authorName}
          authorAvatar={post.author?.avatar_url}
          isOwner={isOwner}
          isGroupPost={true}
          onHidePost={handleHidePost}
          onHideAuthor={() => setHideUserDialogOpen(true)}
          onReport={() => setReportDialogOpen(true)}
          onEdit={() => setEditDialogOpen(true)}
          onDelete={handleDelete}
        />

        {/* Edit Post Dialog */}
        <EditGroupPostDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={{
            id: post.id,
            content: post.content,
            title: post.title,
            media_urls: post.media_urls,
            group_id: groupId!,
          }}
        />

        {/* Report Post Dialog */}
        <ReportPostDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          postId={post.id}
          postType="group_post"
        />

        {/* Hide User Dialog */}
        {post.author_id && (
          <HideUserDialog
            open={hideUserDialogOpen}
            onOpenChange={setHideUserDialogOpen}
            userId={post.author_id}
            userName={authorName}
          />
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Group & Author Info */}
          <div className="px-4 py-3 flex items-start gap-3">
            {/* Avatar with frame */}
            {post.is_anonymous ? (
              <Avatar className="h-10 w-10 bg-muted">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            ) : userFrame ? (
              <Link to={`/user/${post.author?.username || post.author_id}`}>
                <div className="relative flex-shrink-0 h-14 w-14">
                  <img 
                    src={userFrame.image_url}
                    alt="Avatar frame"
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                    style={{ objectFit: 'contain' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar 
                      className={cn('h-[72%] w-[72%]', 'border-2 border-background')}
                      style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                    >
                      <AvatarImage 
                        src={post.author?.avatar_url || undefined} 
                        style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                      />
                      <AvatarFallback style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}>
                        {authorName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </Link>
            ) : (
              <Link to={`/user/${post.author?.username || post.author_id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback>{authorName?.[0] || '?'}</AvatarFallback>
                </Avatar>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/groups/${groupId}`} className="font-semibold text-sm hover:underline">
                  {post.group?.name}
                </Link>
                <span className="text-muted-foreground">·</span>
                <Button variant="link" className="h-auto p-0 text-primary text-sm font-medium">
                  Theo dõi
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                {post.is_anonymous ? (
                  <span>Ẩn danh</span>
                ) : (
                  <>
                    <Link 
                      to={`/user/${post.author?.username || post.author_id}`}
                      className="hover:underline"
                      style={{
                        color: post.author?.name_color?.is_gradient 
                          ? undefined 
                          : post.author?.name_color?.color_value || undefined,
                        background: post.author?.name_color?.is_gradient 
                          ? post.author?.name_color?.gradient_value || undefined
                          : undefined,
                        WebkitBackgroundClip: post.author?.name_color?.is_gradient ? 'text' : undefined,
                        WebkitTextFillColor: post.author?.name_color?.is_gradient ? 'transparent' : undefined,
                      }}
                    >
                      {authorName}
                      {post.author?.nickname && (
                        <span className="text-muted-foreground"> ({post.author.nickname})</span>
                      )}
                    </Link>
                    {post.author?.is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
                    )}
                    {post.author?.vip_level_name && (
                      <VipBadge levelName={post.author.vip_level_name} size="sm" />
                    )}
                    {post.author?.has_prime_boost && (
                      <PrimeBadge />
                    )}
                    {post.author_group_badges && post.author_group_badges.length > 0 && (
                      <MemberBadgeDisplay badges={post.author_group_badges} maxDisplay={2} />
                    )}
                  </>
                )}
                <span>·</span>
                <span>{timeAgo}</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3">
            {post.content && (
              <p className="text-base whitespace-pre-wrap">{post.content}</p>
            )}
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="relative">
              {post.media_urls.length === 1 ? (
                (() => {
                  const isSticker = post.media_urls[0].includes('/stickers/');
                  return isSticker ? (
                    <div className="flex justify-center py-4">
                      <img
                        src={post.media_urls[0]}
                        alt=""
                        className="max-w-[180px] max-h-[180px] object-contain"
                      />
                    </div>
                  ) : (
                    <img
                      src={post.media_urls[0]}
                      alt=""
                      className="w-full max-h-[500px] object-cover"
                    />
                  );
                })()
              ) : (
                <div className={cn(
                  "grid gap-1",
                  post.media_urls.length === 2 && "grid-cols-2",
                  post.media_urls.length >= 3 && "grid-cols-2"
                )}>
                  {post.media_urls.slice(0, 4).map((url: string, idx: number) => {
                    const isSticker = url.includes('/stickers/');
                    return (
                      <div key={idx} className={cn(
                        "relative",
                        isSticker ? "flex justify-center items-center p-4" : "aspect-square"
                      )}>
                        <img
                          src={url}
                          alt=""
                          className={isSticker 
                            ? "max-w-[120px] max-h-[120px] object-contain" 
                            : "w-full h-full object-cover"
                          }
                        />
                        {idx === 3 && post.media_urls.length > 4 && !isSticker && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                              +{post.media_urls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-4 py-2 flex items-center justify-between border-b">
            <div 
              className="relative flex-1"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              <ReactionPicker 
                isOpen={showReactionPicker}
                onSelect={handleReaction}
                currentReaction={userReaction}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("w-full gap-2", isLiked && "text-primary")}
                onClick={handleLike}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
              >
                {userReaction ? (
                  <>
                    <span className="text-lg">{REACTION_EMOJIS[userReaction].emoji}</span>
                    <span className={REACTION_EMOJIS[userReaction].color}>{REACTION_EMOJIS[userReaction].label}</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className={cn("h-5 w-5", isLiked && "fill-current")} />
                    Thích
                  </>
                )}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="flex-1 gap-2">
              <MessageCircle className="h-5 w-5" />
              Bình luận
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => {
                toast.info('Tính năng chia sẻ bài viết group đang phát triển');
              }}
            >
              <Share2 className="h-5 w-5" />
              Chia sẻ
            </Button>
          </div>

          {/* Reactions Bar - Always show */}
          <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b">
            <button 
              className="hover:underline"
              onClick={() => setReactionsModalOpen(true)}
            >
              {post.like_count || 0} lượt thích
            </button>
            <span>{post.comment_count || 0} bình luận</span>
          </div>

          {/* Comments Section */}
          <div className="px-4 py-2">
            <GroupPostComments postId={postId!} groupId={groupId!} postAuthorId={post.author_id} />
          </div>
        </div>

        {/* Reactions Modal */}
        <ReactionsModal
          open={reactionsModalOpen}
          onOpenChange={setReactionsModalOpen}
          reactions={reactionsData?.reactions || []}
          isLoading={isLoadingReactions}
          totalCount={reactionsData?.totalCount || post.like_count}
          reactionCounts={reactionsData?.reactionCounts || {}}
        />
      </div>
    </Layout>
  );
}
