import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  MoreHorizontal, X, ThumbsUp, MessageCircle, Share2, 
  Globe, EyeOff, BadgeCheck, Megaphone
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { JoinedGroupPost } from '@/hooks/useJoinedGroupPosts';
import { cn } from '@/lib/utils';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { ReactionPicker, REACTION_EMOJIS, ReactionType } from '@/components/social/ReactionPicker';
import { ReactionsModal } from '@/components/social/ReactionsModal';
import { useGroupPostReactions } from '@/hooks/useGroupPosts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GroupPostFeedCardProps {
  post: JoinedGroupPost;
  onDismiss?: (postId: string) => void;
}

export function GroupPostFeedCard({ post, onDismiss }: GroupPostFeedCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(post.user_reaction as ReactionType | null);
  const [isLiked, setIsLiked] = useState(!!post.user_reaction);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch reactions when modal is open
  const { data: reactionsData, isLoading: isLoadingReactions } = useGroupPostReactions(
    reactionsModalOpen ? post.id : ''
  );
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: false, 
    locale: vi 
  });

  const displayName = post.is_anonymous 
    ? 'Thành viên ẩn danh' 
    : post.author_name || 'Người dùng';

  const handleCardClick = () => {
    navigate(`/groups/${post.group_id}/post/${post.id}`);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('group_post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setIsLiked(false);
        setUserReaction(null);
      } else {
        await supabase
          .from('group_post_likes')
          .insert({ post_id: post.id, user_id: user.id, reaction_type: 'like' });
        setIsLiked(true);
        setUserReaction('like');
      }
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thả cảm xúc");
      return;
    }
    setShowReactionPicker(false);

    try {
      // Delete existing reaction first
      await supabase
        .from('group_post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      // Insert new reaction
      await supabase
        .from('group_post_likes')
        .insert({ post_id: post.id, user_id: user.id, reaction_type: type });
      
      setIsLiked(true);
      setUserReaction(type);
      queryClient.invalidateQueries({ queryKey: ['joined-group-posts'] });
    } catch (error) {
      toast.error("Có lỗi xảy ra");
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

  // Render author avatar with frame
  const renderAuthorAvatar = () => {
    if (post.is_anonymous) {
      return (
        <Avatar className="h-10 w-10 bg-muted flex-shrink-0">
          <AvatarFallback>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      );
    }

    if (post.author_frame) {
      return (
        <Link to={`/user/${post.author_username || post.author_id}`}>
          <div className="relative flex-shrink-0 h-12 w-12">
            <img 
              src={post.author_frame.image_url}
              alt="Avatar frame"
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              style={{ objectFit: 'contain' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar 
                className={cn('h-[72%] w-[72%]', 'border border-background')}
                style={{ borderRadius: post.author_frame.avatar_border_radius || '50%' }}
              >
                <AvatarImage 
                  src={post.author_avatar || undefined} 
                  style={{ borderRadius: post.author_frame.avatar_border_radius || '50%' }}
                />
                <AvatarFallback style={{ borderRadius: post.author_frame.avatar_border_radius || '50%' }}>
                  {post.author_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link to={`/user/${post.author_username || post.author_id}`}>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={post.author_avatar || undefined} />
          <AvatarFallback>{post.author_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      </Link>
    );
  };

  // Get name style
  const getNameStyle = () => {
    if (!post.author_name_color) return {};
    return {
      color: post.author_name_color.is_gradient 
        ? undefined 
        : post.author_name_color.color_value || undefined,
      background: post.author_name_color.is_gradient 
        ? post.author_name_color.gradient_value || undefined
        : undefined,
      WebkitBackgroundClip: post.author_name_color.is_gradient ? 'text' : undefined,
      WebkitTextFillColor: post.author_name_color.is_gradient ? 'transparent' : undefined,
    } as React.CSSProperties;
  };

  return (
    <Card className="overflow-hidden">
      {/* Header with Author & Group */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {renderAuthorAvatar()}
            <div className="min-w-0 flex-1">
              {/* Author name with badges */}
              <div className="flex items-center gap-1 flex-wrap">
                {post.is_anonymous ? (
                  <span className="font-semibold text-sm flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Thành viên ẩn danh
                  </span>
                ) : (
                  <>
                    <Link 
                      to={`/user/${post.author_username || post.author_id}`}
                      className="font-semibold text-sm hover:underline"
                      style={getNameStyle()}
                    >
                      {displayName}
                    </Link>
                    {post.author_nickname && (
                      <span className="text-xs text-muted-foreground">({post.author_nickname})</span>
                    )}
                    {post.author_is_verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
                    )}
                    {post.author_vip_level && (
                      <VipBadge levelName={post.author_vip_level} size="sm" />
                    )}
                    {post.author_has_prime_boost && (
                      <PrimeBadge />
                    )}
                  </>
                )}
                
                {/* Post type badge */}
                {post.post_type === 'announcement' && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5 bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Megaphone className="h-2.5 w-2.5" />
                    Thông báo
                  </Badge>
                )}
              </div>
              
              {/* Group name and time */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link 
                  to={`/groups/${post.group_id}`}
                  className="hover:underline"
                >
                  {post.group_name}
                </Link>
                <span>·</span>
                <span>{timeAgo} trước</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onDismiss(post.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content - Clickable */}
      <div className="px-4 pb-3 cursor-pointer" onClick={handleCardClick}>
        <p className="text-sm whitespace-pre-wrap line-clamp-4">
          {post.content}
          {post.content.length > 200 && (
            <span className="text-primary ml-1 hover:underline">
              Xem thêm
            </span>
          )}
        </p>
      </div>
      
      {/* Media - Clickable */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="relative cursor-pointer" onClick={handleCardClick}>
          {(() => {
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
                className="w-full max-h-[400px] object-cover"
              />
            );
          })()}
          {post.media_urls.length > 1 && (
            <Badge className="absolute bottom-2 right-2 bg-black/60">
              +{post.media_urls.length - 1}
            </Badge>
          )}
        </div>
      )}
      
      {/* Reactions & Comments count */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-t">
        <button 
          className="flex items-center gap-1 hover:underline"
          onClick={() => setReactionsModalOpen(true)}
        >
          <span className="text-lg">👍❤️</span>
          <span>{post.like_count}</span>
        </button>
        <div className="flex items-center gap-4">
          <span>{post.comment_count} bình luận</span>
        </div>
      </div>
      
      {/* Reactions Modal */}
      <ReactionsModal
        open={reactionsModalOpen}
        onOpenChange={setReactionsModalOpen}
        reactions={reactionsData?.reactions || []}
        isLoading={isLoadingReactions}
        totalCount={reactionsData?.totalCount || 0}
        reactionCounts={reactionsData?.reactionCounts || {}}
      />
      
      {/* Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t">
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
                <ThumbsUp className={cn("h-4 w-4", isLiked && "fill-current")} />
                Thích
              </>
            )}
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={handleCardClick}
        >
          <MessageCircle className="h-4 w-4" />
          Bình luận
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={() => toast.info('Tính năng chia sẻ đang phát triển')}
        >
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </Button>
      </div>
    </Card>
  );
}
