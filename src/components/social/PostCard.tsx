import React, { useState, forwardRef, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLikePost, useUnlikePost, useDeletePost, usePinPost, useUnpinPost, useReactPost, usePostReactions, UserPost } from '@/hooks/usePosts';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit, Globe, Users, Lock, ChevronLeft, ChevronRight, Store, BadgeCheck, Shield, Star, Pin, PinOff, EyeOff, Megaphone, HandCoins, ListTodo, PieChart, FileText, MessageSquare, Flag, UserX } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PostComments from './PostComments';
// import GroupPostComments from '@/components/groups/GroupPostComments';
import SharePostDialog from './SharePostDialog';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { PartnerBadge } from '@/components/ui/partner-badge';
import { ReactionPicker, REACTION_EMOJIS, ReactionType } from './ReactionPicker';
import { ReactionsModal } from './ReactionsModal';
import { ReportPostDialog } from './ReportPostDialog';
import { HideUserDialog } from './HideUserDialog';
import { EditPostDialog } from './EditPostDialog';
// import { EditGroupPostDialog } from '@/components/groups/EditGroupPostDialog';
import { PostOptionsSheet } from './PostOptionsSheet';
import { useHidePost, PostType } from '@/hooks/usePostModeration';
// import { useDeleteGroupPost, useReactToGroupPost, useGroupPostReactions } from '@/hooks/useGroupPosts';

// Stub functions for removed group features
const useDeleteGroupPost = () => ({ mutate: () => {} });
const useReactToGroupPost = () => ({ mutate: () => {} });
const useGroupPostReactions = () => ({ data: null, isLoading: false });

interface ExtendedPost extends UserPost {
  is_shop_post?: boolean;
  shop_name?: string;
  shop_verified?: boolean;
  seller_id?: string;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url: string | null;
    is_verified: boolean;
    is_partner?: boolean;
  };
}

interface PostCardProps {
  post: ExtendedPost;
  showComments?: boolean;
  showPinOption?: boolean;
  showGroupBanner?: boolean; // Show group avatar with user overlay (for newsfeed/groups list)
  isGroupOwnerOrAdmin?: boolean; // For group posts - whether current user is owner/admin of the group
}

export const PostCard = forwardRef<HTMLDivElement, PostCardProps>(({ post, showComments = false, showPinOption = false, showGroupBanner = false, isGroupOwnerOrAdmin = false }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatRelative } = useDateFormat();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const reactPost = useReactPost();
  const reactToGroupPost = useReactToGroupPost();
  const deletePost = useDeletePost();
  const deleteGroupPost = useDeleteGroupPost();
  const pinPost = usePinPost();
  const unpinPost = useUnpinPost();
  const { data: frames } = useAvatarFrames();
  
  // Determine if this is a group post early (needed for reaction handlers)
  const groupId = (post as any).group_id;
  const isGroupPostCheck = !!(post as any).is_group_post || !!groupId;
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [hideUserDialogOpen, setHideUserDialogOpen] = useState(false);
  const [editGroupPostDialogOpen, setEditGroupPostDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hidePost = useHidePost();

  // Get post reactions data - use appropriate hook based on post type
  const { data: regularReactionsData, isLoading: isLoadingRegularReactions } = usePostReactions(
    reactionsModalOpen && !isGroupPostCheck ? post.id : ''
  );
  const { data: groupReactionsData, isLoading: isLoadingGroupReactions } = useGroupPostReactions(
    reactionsModalOpen && isGroupPostCheck ? post.id : ''
  );
  
  const reactionsData = isGroupPostCheck ? groupReactionsData : regularReactionsData;
  const isLoadingReactions = isGroupPostCheck ? isLoadingGroupReactions : isLoadingRegularReactions;
  
  console.log('[PostCard] Reactions debug:', { 
    isGroupPostCheck, 
    groupId, 
    reactionsModalOpen, 
    reactionsData, 
    isLoadingReactions,
    postId: post.id 
  });

  // Find user's avatar frame - prioritize directly passed avatar_frame object, fallback to frames lookup
  const userFrame = (post.user_profile as any)?.avatar_frame || frames?.find(f => f.id === (post.user_profile as any)?.avatar_frame_id);

  // Determine post type first
  const isShopPostCheck = post.is_shop_post || !!post.seller_id || !!post.seller;
  // For shop posts, check seller_id instead of user_id
  const isShopOwner = isShopPostCheck && post.seller_id ? user?.id === post.seller_id : false;
  const isOwner = user?.id === post.user_id || isShopOwner;
  const userReaction = (post as any).user_reaction as ReactionType | null;
  // For group posts, is_liked might not exist, so check user_reaction instead
  const isLiked = post.is_liked || !!userReaction;
  const reactionCounts = (post as any).reaction_counts as Record<string, number> || {};
  const isPinned = (post as any).is_pinned;

  // Get top 3 reactions for display
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as ReactionType);

  const handleLike = () => {
    if (!user) return;
    console.log('[PostCard] handleLike called', { isGroupPostCheck, groupId, postId: post.id, isLiked });
    if (isGroupPostCheck && groupId) {
      // For group posts, use react with 'like' type
      console.log('[PostCard] Calling reactToGroupPost with like');
      reactToGroupPost.mutate({ 
        postId: post.id, 
        groupId, 
        reactionType: 'like' 
      });
    } else {
      if (isLiked) {
        unlikePost.mutate(post.id);
      } else {
        likePost.mutate(post.id);
      }
    }
  };

  const handleReaction = (type: ReactionType) => {
    if (!user) return;
    setShowReactionPicker(false);
    if (isGroupPostCheck && groupId) {
      // For group posts, use group reaction hook
      reactToGroupPost.mutate({ 
        postId: post.id, 
        groupId, 
        reactionType: type 
      });
    } else {
      if (userReaction === type) {
        unlikePost.mutate(post.id);
      } else {
        reactPost.mutate({ postId: post.id, reactionType: type });
      }
    }
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
      if (isGroupPost) {
        deleteGroupPost.mutate({ postId: post.id, groupId: (post as any).group_id });
      } else {
        deletePost.mutate(post.id);
      }
    }
  };

  const handlePin = () => {
    if (isPinned) {
      unpinPost.mutate(post.id);
    } else {
      pinPost.mutate(post.id);
    }
  };

  const visibilityIcon = {
    public: Globe,
    friends: Users,
    private: Lock
  };
  const VisIcon = visibilityIcon[post.visibility];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
  };

  const isShopPost = isShopPostCheck;
  // Use already declared groupId and isGroupPostCheck from above
  const isGroupPost = isGroupPostCheck;
  const isAnonymousPost = !!(post as any).is_anonymous;
  const showRealAuthor = !!(post as any).show_real_author;
  const realAuthor = (post as any).real_author as { full_name: string; avatar_url?: string } | undefined;
  const postType = (post as any).post_type as string | undefined;
  const postTitle = (post as any).title as string | undefined;

  // Navigate to post detail page
  const handleGoToPostDetail = () => {
    if (isGroupPost && groupId) {
      navigate(`/groups/${groupId}/post/${post.id}`);
    } else {
      // Navigate to general post detail page for user/shop posts
      navigate(`/post/${post.id}`);
    }
  };
  const shopData = post.seller || {
    shop_name: post.shop_name, 
    is_verified: post.shop_verified,
    shop_slug: '',
    shop_avatar_url: post.user_profile?.avatar_url
  };
  const groupData = (post as any).group;
  const postTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    announcement: { 
      label: 'Thông báo', 
      icon: <Megaphone className="h-3 w-3" />, 
      className: 'bg-blue-500 text-white border-blue-500' 
    },
    deal: { 
      label: 'Deal/Kèo', 
      icon: <HandCoins className="h-3 w-3" />, 
      className: 'bg-green-500 text-white border-green-500' 
    },
    task: { 
      label: 'Task', 
      icon: <ListTodo className="h-3 w-3" />, 
      className: 'bg-yellow-500 text-white border-yellow-500' 
    },
    profit_share: { 
      label: 'Chia lợi nhuận', 
      icon: <PieChart className="h-3 w-3" />, 
      className: 'bg-purple-500 text-white border-purple-500' 
    },
    report: { 
      label: 'Kết quả', 
      icon: <FileText className="h-3 w-3" />, 
      className: 'bg-orange-500 text-white border-orange-500' 
    },
    discussion: { 
      label: 'Thảo luận', 
      icon: <MessageSquare className="h-3 w-3" />, 
      className: 'bg-muted text-muted-foreground' 
    },
  };
  const currentPostType = postType && postTypeConfig[postType];

  return (
    <div className="relative">
      <div 
        className="relative bg-card rounded-xl border shadow-sm overflow-hidden z-10"
      >
        {/* Pinned indicator */}
        {isPinned && showPinOption && (
          <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-2 text-sm text-muted-foreground">
            <Pin className="h-3.5 w-3.5" />
            <span>Bài viết đã ghim</span>
          </div>
        )}

      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-3">
          {isGroupPost && showGroupBanner ? (
            // Newsfeed/Groups list view: Group avatar with user overlay
            <Link to={`/groups/${(post as any).group_id}`} className="relative">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted">
                {groupData?.cover_url ? (
                  <img 
                    src={groupData.cover_url} 
                    alt={groupData?.name || 'Group'} 
                    className="h-full w-full object-cover"
                  />
                ) : groupData?.avatar_url ? (
                  <img 
                    src={groupData.avatar_url} 
                    alt={groupData?.name || 'Group'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              {/* User avatar overlay - bottom right corner */}
              {!isAnonymousPost && post.user_profile?.avatar_url && (
                <Avatar className="h-5 w-5 absolute -bottom-1 -right-1 border-2 border-background">
                  <AvatarImage src={post.user_profile.avatar_url} />
                  <AvatarFallback className="text-[8px]">
                    {post.user_profile.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              )}
              {isAnonymousPost && (
                <div className="h-5 w-5 absolute -bottom-1 -right-1 border-2 border-background rounded-full bg-muted flex items-center justify-center">
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </Link>
          ) : isGroupPost ? (
            // Inside group view: User avatar with frame or anonymous icon
            isAnonymousPost ? (
              <Avatar className="h-10 w-10 bg-muted">
                <AvatarFallback>
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Link to={`/user/${(post.user_profile as any)?.username || post.user_id}`}>
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
                        src={post.user_profile?.avatar_url || ''} 
                        style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                      />
                      <AvatarFallback style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}>
                        {post.user_profile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </Link>
            )
          ) : isShopPost ? (
            <Link to={shopData.shop_slug ? `/shops/${shopData.shop_slug}` : '#'}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={shopData.shop_avatar_url || ''} />
                <AvatarFallback className="bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to={`/user/${(post.user_profile as any)?.username || post.user_id}`}>
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
                      src={post.user_profile?.avatar_url || ''} 
                      style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
                    />
                    <AvatarFallback style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}>
                      {post.user_profile?.full_name?.[0] || post.user_profile?.email?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </Link>
          )}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isGroupPost && showGroupBanner ? (
                // Newsfeed/Groups list: Show group name + post type badge
                <>
                  <Link 
                    to={`/groups/${(post as any).group_id}`}
                    className="font-semibold hover:underline"
                  >
                    {groupData?.name || 'Nhóm'}
                  </Link>
                  {currentPostType && postType !== 'discussion' && (
                    <Badge className={cn("text-[10px] h-5 px-1.5 gap-1", currentPostType.className)}>
                      {currentPostType.icon}
                      {currentPostType.label}
                    </Badge>
                  )}
                </>
              ) : isGroupPost ? (
                // Inside group: Show author name (or anonymous) + badges + post type badge
                <>
                  {isAnonymousPost ? (
                    <span className="font-semibold text-muted-foreground">Thành viên ẩn danh</span>
                  ) : (
                    <>
                      <Link 
                        to={`/user/${(post.user_profile as any)?.username || post.user_id}`}
                        className="font-semibold hover:underline"
                        style={{
                          color: (post.user_profile as any)?.name_color?.is_gradient 
                            ? undefined 
                            : (post.user_profile as any)?.name_color?.color_value || undefined,
                          background: (post.user_profile as any)?.name_color?.is_gradient 
                            ? (post.user_profile as any)?.name_color?.gradient_value 
                            : undefined,
                          WebkitBackgroundClip: (post.user_profile as any)?.name_color?.is_gradient ? 'text' : undefined,
                          WebkitTextFillColor: (post.user_profile as any)?.name_color?.is_gradient ? 'transparent' : undefined,
                        }}
                      >
                        {post.user_profile?.full_name || 'Người dùng'}
                      </Link>
                      {(post.user_profile as any)?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-100 flex-shrink-0" />
                      )}
                      {(post.user_profile as any)?.has_prime_boost && (
                        <PrimeBadge size="sm" />
                      )}
                      {(post.user_profile as any)?.vip_level_name && (post.user_profile as any)?.vip_level_name !== 'Member' && (
                        <VipBadge levelName={(post.user_profile as any).vip_level_name} size="sm" />
                      )}
                    </>
                  )}
                  {showRealAuthor && realAuthor && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1">
                      <EyeOff className="h-2.5 w-2.5" />
                      {realAuthor.full_name}
                    </Badge>
                  )}
                  {currentPostType && postType !== 'discussion' && (
                    <Badge className={cn("text-[10px] h-5 px-1.5 gap-1", currentPostType.className)}>
                      {currentPostType.icon}
                      {currentPostType.label}
                    </Badge>
                  )}
                </>
              ) : isShopPost ? (
                <Link 
                  to={shopData.shop_slug ? `/shops/${shopData.shop_slug}` : '#'}
                  className="font-semibold hover:underline flex items-center gap-1"
                >
                  {shopData.shop_name || 'Shop'}
                  {shopData.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
                  )}
                  {(shopData as any).is_partner && (
                    <PartnerBadge size="sm" variant="icon-only" />
                  )}
                </Link>
              ) : (
                <>
                  <Link 
                    to={`/user/${(post.user_profile as any)?.username || post.user_id}`}
                    className="font-semibold hover:underline"
                    style={{
                      color: (post.user_profile as any)?.name_color?.is_gradient 
                        ? undefined 
                        : (post.user_profile as any)?.name_color?.color_value || undefined,
                      background: (post.user_profile as any)?.name_color?.is_gradient 
                        ? (post.user_profile as any)?.name_color?.gradient_value 
                        : undefined,
                      WebkitBackgroundClip: (post.user_profile as any)?.name_color?.is_gradient ? 'text' : undefined,
                      WebkitTextFillColor: (post.user_profile as any)?.name_color?.is_gradient ? 'transparent' : undefined,
                    }}
                  >
                    {post.user_profile?.full_name || post.user_profile?.email || 'Người dùng'}
                    {(post.user_profile as any)?.nickname && (
                      <span className="text-muted-foreground font-normal text-sm"> ({(post.user_profile as any).nickname})</span>
                    )}
                  </Link>
                  {(post.user_profile as any)?.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-100 flex-shrink-0" />
                  )}
                  {(post.user_profile as any)?.is_admin && (
                    <Badge className="gap-0.5 text-[10px] h-4 px-1 bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white">
                      <Shield className="h-2.5 w-2.5" />
                      Admin
                    </Badge>
                  )}
                  {(post.user_profile as any)?.has_prime_boost && (
                    <PrimeBadge size="sm" />
                  )}
                  {(post.user_profile as any)?.vip_level_name && (post.user_profile as any)?.vip_level_name !== 'Member' && (
                    <VipBadge levelName={(post.user_profile as any).vip_level_name} size="sm" />
                  )}
                  {((post.user_profile as any)?.total_spent || 0) >= 1000000 && (
                    <Badge variant="outline" className="gap-0.5 text-[10px] h-4 px-1 bg-purple-500/10 border-purple-500/30 text-purple-600">
                      <Star className="h-2.5 w-2.5" />
                      Top
                    </Badge>
                  )}
                </>
              )}
              {isShopPost && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  <Store className="h-3 w-3 mr-1" />
                  Shop
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              {isGroupPost && showGroupBanner && (
                // Newsfeed/Groups list: Show author name below group name with badges
                <>
                  {isAnonymousPost ? (
                    <span className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Thành viên ẩn danh
                      {showRealAuthor && realAuthor && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-1 gap-1">
                          <EyeOff className="h-2.5 w-2.5" />
                          {realAuthor.full_name}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 flex-wrap">
                      <Link 
                        to={`/user/${(post.user_profile as any)?.username || post.user_id}`}
                        className="hover:underline font-medium"
                        style={{
                          color: (post.user_profile as any)?.name_color?.is_gradient 
                            ? undefined 
                            : (post.user_profile as any)?.name_color?.color_value || undefined,
                          background: (post.user_profile as any)?.name_color?.is_gradient 
                            ? (post.user_profile as any)?.name_color?.gradient_value 
                            : undefined,
                          WebkitBackgroundClip: (post.user_profile as any)?.name_color?.is_gradient ? 'text' : undefined,
                          WebkitTextFillColor: (post.user_profile as any)?.name_color?.is_gradient ? 'transparent' : undefined,
                        }}
                      >
                        {post.user_profile?.full_name || 'Người dùng'}
                      </Link>
                      {(post.user_profile as any)?.is_verified && (
                        <BadgeCheck className="h-3 w-3 text-blue-500 fill-blue-100 flex-shrink-0" />
                      )}
                      {(post.user_profile as any)?.has_prime_boost && (
                        <PrimeBadge size="sm" />
                      )}
                      {(post.user_profile as any)?.vip_level_name && (post.user_profile as any)?.vip_level_name !== 'Member' && (
                        <VipBadge levelName={(post.user_profile as any).vip_level_name} size="sm" />
                      )}
                    </span>
                  )}
                  <span>·</span>
                </>
              )}
              <span>
                {formatRelative(post.created_at)}
              </span>
              <span>·</span>
              {isGroupPost ? (
                <Globe className="h-3 w-3" />
              ) : (
                <VisIcon className="h-3 w-3" />
              )}
            </div>
          </div>
        </div>

        {/* Menu - always show if user is logged in */}
        {user && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setOptionsSheetOpen(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            <PostOptionsSheet
              open={optionsSheetOpen}
              onOpenChange={setOptionsSheetOpen}
              postId={post.id}
              authorName={post.user_profile?.full_name || 'Người dùng'}
              isOwner={isOwner}
              isGroupPost={isGroupPost}
              isShopPost={isShopPost}
              isPinned={isPinned}
              showPinOption={showPinOption}
              isGroupOwnerOrAdmin={isGroupOwnerOrAdmin}
              onHidePost={() => {
                const postType: PostType = isGroupPost ? 'group_post' : (isShopPost ? 'shop_post' : 'user_post');
                hidePost.mutate({ postId: post.id, postType });
              }}
              onHideAuthor={() => setHideUserDialogOpen(true)}
              onReport={() => setReportDialogOpen(true)}
              onPin={handlePin}
              onEdit={() => isGroupPost ? setEditGroupPostDialogOpen(true) : setEditDialogOpen(true)}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {/* Post Title (for group posts) */}
      {isGroupPost && postTitle && (
        <div className="px-4 pb-2">
          <h3 className="font-semibold text-base">{postTitle}</h3>
        </div>
      )}

      {/* Content - Clickable to go to post detail */}
      {post.content && (
        <div 
          className={cn(
            "px-4 pb-3 cursor-pointer",
            post.background_color && "py-8 min-h-[150px] flex items-center justify-center",
            post.background_color
          )}
          onClick={handleGoToPostDetail}
        >
          <p className={cn(
            "whitespace-pre-wrap",
            post.background_color && "text-white text-xl font-semibold text-center"
          )}>
            {post.content}
          </p>
        </div>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="relative">
          {post.images.length === 1 ? (
            (() => {
              const isSticker = post.images[0].includes('/stickers/');
              return isSticker ? (
                // Sticker - limited size, centered
                <div className="flex justify-center py-4">
                  <img
                    src={post.images[0]}
                    alt=""
                    className="max-w-[180px] max-h-[180px] object-contain"
                  />
                </div>
              ) : (
                <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                  <DialogTrigger asChild>
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full max-h-[500px] object-cover cursor-pointer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0">
                    <img src={post.images[0]} alt="" className="w-full h-auto" />
                  </DialogContent>
                </Dialog>
              );
            })()
          ) : (
            <div className="relative">
              {(() => {
                const currentImage = post.images[currentImageIndex];
                const isSticker = currentImage.includes('/stickers/');
                return isSticker ? (
                  <div className="flex justify-center py-4">
                    <img
                      src={currentImage}
                      alt=""
                      className="max-w-[180px] max-h-[180px] object-contain"
                    />
                  </div>
                ) : (
                  <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                    <DialogTrigger asChild>
                      <img
                        src={currentImage}
                        alt=""
                        className="w-full aspect-video object-cover cursor-pointer"
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                      <img src={currentImage} alt="" className="w-full h-auto" />
                    </DialogContent>
                  </Dialog>
                );
              })()}
              
              {/* Image navigation */}
              {post.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  
                  {/* Image indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.images.map((_, idx) => (
                      <button
                        key={idx}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          idx === currentImageIndex ? "bg-white" : "bg-white/50"
                        )}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b">
        <button 
          className="flex items-center gap-1 hover:underline"
          onClick={() => setReactionsModalOpen(true)}
        >
          {topReactions.length > 0 ? (
            <span className="flex -space-x-1">
              {topReactions.map(type => (
                <span key={type} className="text-base">{REACTION_EMOJIS[type].emoji}</span>
              ))}
            </span>
          ) : (
            <Heart className="h-4 w-4" />
          )}
          <span>{post.likes_count}</span>
        </button>
        <button 
          className="hover:underline"
          onClick={() => setShowCommentsSection(!showCommentsSection)}
        >
          {post.comments_count} bình luận
        </button>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center border-b">
        <div 
          className="relative flex-1"
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <ReactionPicker 
            isOpen={showReactionPicker}
            onSelect={handleReaction}
            currentReaction={userReaction}
          />
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-2",
              isLiked && userReaction && REACTION_EMOJIS[userReaction]?.color
            )}
            onClick={handleLike}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
            {userReaction ? (
              <>
                <span className="text-lg">{REACTION_EMOJIS[userReaction].emoji}</span>
                {REACTION_EMOJIS[userReaction].label}
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                Thích
              </>
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="flex-1 gap-2"
          onClick={handleGoToPostDetail}
        >
          <MessageCircle className="h-5 w-5" />
          Bình luận
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 gap-2"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-5 w-5" />
          Chia sẻ
        </Button>
      </div>

      {/* Comments */}
      {showCommentsSection && (
        isGroupPost ? (
          <GroupPostComments postId={post.id} groupId={(post as any).group_id} />
        ) : (
          <PostComments postId={post.id} />
        )
      )}

      {/* Share Dialog */}
      <SharePostDialog 
        post={post}
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
        reactionCounts={reactionsData?.reactionCounts as Record<ReactionType, number> || {}}
      />

      {/* Report Post Dialog */}
      <ReportPostDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        postId={post.id}
        postType={isGroupPost ? 'group_post' : (isShopPost ? 'shop_post' : 'user_post')}
      />

      {/* Hide User Dialog */}
      {post.user_profile && (
        <HideUserDialog
          open={hideUserDialogOpen}
          onOpenChange={setHideUserDialogOpen}
          userId={post.user_id}
          userName={post.user_profile.full_name || 'Người dùng'}
        />
      )}

      {/* Edit Post Dialog */}
      {isOwner && !isGroupPost && !isShopPost && (
        <EditPostDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={{
            id: post.id,
            content: post.content,
            images: post.images,
            visibility: post.visibility,
          }}
        />
      )}

      {/* Edit Group Post Dialog */}
      {isOwner && isGroupPost && (
        <EditGroupPostDialog
          open={editGroupPostDialogOpen}
          onOpenChange={setEditGroupPostDialogOpen}
          post={{
            id: post.id,
            content: post.content || '',
            title: (post as any).title,
            media_urls: post.images,
            group_id: (post as any).group_id,
          }}
        />
      )}
      </div>
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;
