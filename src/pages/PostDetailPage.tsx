import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Globe, Users, Lock, ThumbsUp, MessageCircle, 
  Share2, BadgeCheck, Store, MoreHorizontal
} from "lucide-react";
import { PostOptionsSheet } from "@/components/social/PostOptionsSheet";
import { useHidePost, PostType as ModerationPostType } from "@/hooks/usePostModeration";
import { useDeletePost, usePinPost, useUnpinPost, usePostReactions, useReactPost } from "@/hooks/usePosts";
import { EditPostDialog } from "@/components/social/EditPostDialog";
import { ReportPostDialog } from "@/components/social/ReportPostDialog";
import { HideUserDialog } from "@/components/social/HideUserDialog";
import { ReactionsModal } from "@/components/social/ReactionsModal";
import { ReactionPicker, REACTION_EMOJIS, ReactionType } from "@/components/social/ReactionPicker";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PostComments } from "@/components/social/PostComments";
import { SharePostDialog } from "@/components/social/SharePostDialog";
import { cn } from "@/lib/utils";
import { useLikePost, useUnlikePost, UserPost } from "@/hooks/usePosts";
import { useAvatarFrames } from "@/hooks/useAvatarFrames";
import { VipBadge } from "@/components/ui/vip-badge";
import { PrimeBadge } from "@/components/ui/prime-badge";

interface PostData {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  visibility: string;
  background_color: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  seller_id: string | null;
  title?: string;
  user_profile?: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    has_prime_boost: boolean;
    avatar_frame_id: string | null;
    vip_level_name: string | null;
    nickname: string | null;
    name_color: {
      is_gradient: boolean;
      color_value: string | null;
      gradient_value: string | null;
    } | null;
  } | null;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url: string | null;
    is_verified: boolean;
  } | null;
  is_liked?: boolean;
  user_reaction?: ReactionType | null;
}

export default function PostDetailPage() {
  const { formatRelative } = useDateFormat();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const reactPost = useReactPost();
  const deletePost = useDeletePost();
  const pinPost = usePinPost();
  const unpinPost = useUnpinPost();
  const hidePost = useHidePost();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { data: frames } = useAvatarFrames();
  
  // State for dialogs
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [hideUserDialogOpen, setHideUserDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Fetch post reactions when modal is open
  const { data: reactionsData, isLoading: isLoadingReactions } = usePostReactions(
    reactionsModalOpen ? postId! : ''
  );

  // Fetch post details
  const { data: post, isLoading, error: postError } = useQuery<PostData | null>({
    queryKey: ['post-detail', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      let result: PostData = {
        ...data,
        user_profile: null,
        seller: null,
        is_liked: false,
        user_reaction: null,
      };

      // Fetch author profile with all needed fields
      if (data?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            user_id, full_name, username, avatar_url, is_verified, has_prime_boost,
            avatar_frame_id, vip_level_id, nickname, active_name_color_id
          `)
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        if (profile) {
          // Fetch name color if exists
          let nameColor = null;
          if (profile.active_name_color_id) {
            const { data: colorData } = await supabase
              .from('name_colors')
              .select('is_gradient, color_value, gradient_value')
              .eq('id', profile.active_name_color_id)
              .maybeSingle();
            nameColor = colorData;
          }
          
          // Fetch VIP level name if exists
          let vipLevelName = null;
          if (profile.vip_level_id) {
            const { data: vipData } = await supabase
              .from('vip_levels')
              .select('name')
              .eq('id', profile.vip_level_id)
              .maybeSingle();
            vipLevelName = vipData?.name || null;
          }
          
          result.user_profile = {
            user_id: profile.user_id,
            full_name: profile.full_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            is_verified: profile.is_verified ?? false,
            has_prime_boost: profile.has_prime_boost ?? false,
            avatar_frame_id: profile.avatar_frame_id,
            vip_level_name: vipLevelName,
            nickname: profile.nickname,
            name_color: nameColor,
          };
        }
      }

      // Check if it's a shop post
      if (data.seller_id) {
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('id, shop_name, shop_slug, shop_avatar_url, is_verified, is_partner')
          .eq('id', data.seller_id)
          .maybeSingle();
        result.seller = sellerData;
      }

      // Check if user liked this post and get reaction type
      if (user?.id) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id, reaction_type')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        result.is_liked = !!likeData;
        result.user_reaction = likeData?.reaction_type as ReactionType | null;
      }
      
      return result;
    },
    enabled: !!postId
  });

  const handleLike = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    if (post?.is_liked) {
      unlikePost.mutate(postId!, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['post-detail', postId] });
        }
      });
    } else {
      likePost.mutate(postId!, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['post-detail', postId] });
        }
      });
    }
  };

  const handleReaction = (type: ReactionType) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thả cảm xúc");
      return;
    }
    setShowReactionPicker(false);
    reactPost.mutate({ postId: postId!, reactionType: type }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['post-detail', postId] });
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
      deletePost.mutate(postId!, {
        onSuccess: () => {
          navigate(-1);
          toast.success('Đã xóa bài viết');
        }
      });
    }
  };

  const handlePin = () => {
    if (!post) return;
    if (post.is_pinned) {
      unpinPost.mutate(postId!);
    } else {
      pinPost.mutate(postId!);
    }
  };

  const handleHidePost = () => {
    if (!post) return;
    const isShopPostLocal = !!post.seller;
    const postType: ModerationPostType = isShopPostLocal ? 'shop_post' : 'user_post';
    hidePost.mutate({ postId: postId!, postType }, {
      onSuccess: () => navigate(-1)
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-4 px-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
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

  const isShopPost = !!post.seller;
  const isOwner = user?.id === post.user_id || (isShopPost && user?.id === post.seller_id);
  const authorName = isShopPost 
    ? post.seller?.shop_name 
    : post.user_profile?.full_name || "Người dùng";
  const authorAvatar = isShopPost 
    ? post.seller?.shop_avatar_url 
    : post.user_profile?.avatar_url;
  const authorUsername = isShopPost 
    ? post.seller?.shop_slug 
    : post.user_profile?.username;
  const isVerified = isShopPost 
    ? post.seller?.is_verified 
    : post.user_profile?.is_verified;
  const timeAgo = formatRelative(post.created_at, { addSuffix: false });
  
  // Get user's avatar frame (for non-shop posts)
  const userFrame = !isShopPost && post.user_profile?.avatar_frame_id 
    ? frames?.find(f => f.id === post.user_profile?.avatar_frame_id) 
    : null;

  const visibilityIcon = {
    public: Globe,
    friends: Users,
    private: Lock
  };
  const VisIcon = visibilityIcon[post.visibility as keyof typeof visibilityIcon] || Globe;

  const profileLink = isShopPost 
    ? `/shops/${post.seller?.shop_slug}` 
    : `/user/${authorUsername || post.user_id}`;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-background min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-base">
            Bài viết của {authorName}
          </h1>
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setOptionsSheetOpen(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
          {!user && <div className="w-10" />}
        </div>

        {/* Post Options Sheet */}
        <PostOptionsSheet
          open={optionsSheetOpen}
          onOpenChange={setOptionsSheetOpen}
          postId={post.id}
          authorName={authorName || 'Người dùng'}
          authorAvatar={authorAvatar}
          isOwner={isOwner}
          isShopPost={isShopPost}
          isPinned={post.is_pinned}
          showPinOption={isOwner && !isShopPost}
          onHidePost={handleHidePost}
          onHideAuthor={() => setHideUserDialogOpen(true)}
          onReport={() => setReportDialogOpen(true)}
          onPin={handlePin}
          onEdit={() => setEditDialogOpen(true)}
          onDelete={handleDelete}
        />

        {/* Edit Post Dialog */}
        <EditPostDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={{
            id: post.id,
            content: post.content,
            images: post.images || [],
            visibility: post.visibility as 'public' | 'friends' | 'private',
          }}
        />

        {/* Report Post Dialog */}
        <ReportPostDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          postId={post.id}
          postType={isShopPost ? 'shop_post' : 'user_post'}
        />

        {/* Hide User Dialog */}
        <HideUserDialog
          open={hideUserDialogOpen}
          onOpenChange={setHideUserDialogOpen}
          userId={post.user_id}
          userName={authorName || 'Người dùng'}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Author Info */}
          <div className="px-4 py-3 flex items-start gap-3">
            {isShopPost ? (
              <Link to={profileLink}>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={authorAvatar || undefined} />
                  <AvatarFallback className="bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to={profileLink}>
                <div className="relative flex-shrink-0 h-14 w-14">
                  {userFrame && (
                    <img 
                      src={userFrame.image_url}
                      alt="Avatar frame"
                      className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                  <div className={userFrame ? 'absolute inset-0 flex items-center justify-center' : ''}>
                    <Avatar 
                      className={cn(userFrame ? 'h-[72%] w-[72%]' : 'h-10 w-10', 'border-2 border-background')}
                      style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                    >
                      <AvatarImage 
                        src={authorAvatar || undefined} 
                        style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                      />
                      <AvatarFallback style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}>
                        {authorName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isShopPost ? (
                  <Link to={profileLink} className="font-semibold text-sm hover:underline flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-primary" />
                    {authorName}
                    {isVerified && <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />}
                  </Link>
                ) : (
                  <>
                    <Link 
                      to={profileLink} 
                      className="font-semibold text-sm hover:underline"
                      style={{
                        color: post.user_profile?.name_color?.is_gradient 
                          ? undefined 
                          : post.user_profile?.name_color?.color_value || undefined,
                        background: post.user_profile?.name_color?.is_gradient 
                          ? post.user_profile?.name_color?.gradient_value || undefined
                          : undefined,
                        WebkitBackgroundClip: post.user_profile?.name_color?.is_gradient ? 'text' : undefined,
                        WebkitTextFillColor: post.user_profile?.name_color?.is_gradient ? 'transparent' : undefined,
                      }}
                    >
                      {authorName}
                      {post.user_profile?.nickname && (
                        <span className="text-muted-foreground font-normal text-xs"> ({post.user_profile.nickname})</span>
                      )}
                    </Link>
                    {isVerified && (
                      <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-100 flex-shrink-0" />
                    )}
                    {post.user_profile?.vip_level_name && (
                      <VipBadge levelName={post.user_profile.vip_level_name} size="sm" />
                    )}
                    {post.user_profile?.has_prime_boost && (
                      <PrimeBadge />
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{timeAgo}</span>
                <span>·</span>
                <VisIcon className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Post Title */}
          {post.title && (
            <div className="px-4 pb-2">
              <h2 className="text-lg font-semibold">{post.title}</h2>
            </div>
          )}

          {/* Post Content */}
          <div className="px-4 pb-3">
            {post.content && (
              <p className={cn(
                "whitespace-pre-wrap",
                post.background_color && "py-8 min-h-[150px] flex items-center justify-center text-white text-xl font-semibold text-center rounded-lg",
                post.background_color
              )}>
                {post.content}
              </p>
            )}
          </div>

          {/* Media */}
          {post.images && post.images.length > 0 && (
            <div className="relative">
              {post.images.length === 1 ? (
                <img
                  src={post.images[0]}
                  alt=""
                  className="w-full max-h-[500px] object-cover"
                />
              ) : (
                <div className={cn(
                  "grid gap-1",
                  post.images.length === 2 && "grid-cols-2",
                  post.images.length >= 3 && "grid-cols-2"
                )}>
                  {post.images.slice(0, 4).map((url: string, idx: number) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && post.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            +{post.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions Bar - Only show if there are likes or comments */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b">
              {post.likes_count > 0 && (
                <button 
                  className="hover:underline"
                  onClick={() => setReactionsModalOpen(true)}
                >
                  {post.likes_count} lượt thích
                </button>
              )}
              {post.likes_count === 0 && <div />}
              {post.comments_count > 0 && (
                <span>{post.comments_count} bình luận</span>
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
                currentReaction={post.user_reaction || null}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn("w-full gap-2", post.is_liked && "text-primary")}
                onClick={handleLike}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
              >
                {post.user_reaction ? (
                  <>
                    <span className="text-lg">{REACTION_EMOJIS[post.user_reaction].emoji}</span>
                    <span className={REACTION_EMOJIS[post.user_reaction].color}>{REACTION_EMOJIS[post.user_reaction].label}</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className={cn("h-5 w-5", post.is_liked && "fill-current")} />
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
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="h-5 w-5" />
              Chia sẻ
            </Button>
          </div>

          {/* Comments Section */}
          <div className="px-4 py-2">
            <PostComments postId={postId!} />
          </div>
        </div>

        {/* Share Dialog */}
        <SharePostDialog 
          post={{
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            images: post.images || [],
            visibility: post.visibility as 'public' | 'friends' | 'private',
            background_color: post.background_color,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            shares_count: post.shares_count,
            is_pinned: post.is_pinned,
            pinned_at: null,
            created_at: post.created_at,
            updated_at: post.updated_at,
            user_profile: post.user_profile ? {
              user_id: post.user_profile.user_id,
              email: null,
              full_name: post.user_profile.full_name,
              avatar_url: post.user_profile.avatar_url,
            } : null,
            is_liked: post.is_liked || false,
          }}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />

        {/* Reactions Modal */}
        <ReactionsModal
          open={reactionsModalOpen}
          onOpenChange={setReactionsModalOpen}
          reactions={reactionsData?.reactions || []}
          isLoading={isLoadingReactions}
          totalCount={reactionsData?.totalCount || post.likes_count}
          reactionCounts={reactionsData?.reactionCounts || {}}
        />
      </div>
    </Layout>
  );
}
