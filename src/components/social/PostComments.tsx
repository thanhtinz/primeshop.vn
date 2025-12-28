import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  usePostComments, 
  useCreateComment, 
  useDeleteComment,
  useLikeComment,
  useUnlikeComment,
  PostComment 
} from '@/hooks/usePosts';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { Loader2, ChevronDown, ChevronUp, BadgeCheck, Shield, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CommentInput from './CommentInput';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';

interface PostCommentsProps {
  postId: string;
}

const CommentItem: React.FC<{
  comment: PostComment;
  postId: string;
  isReply?: boolean;
  frames?: any[];
}> = ({ comment, postId, isReply = false, frames }) => {
  const { user } = useAuth();
  const deleteComment = useDeleteComment();
  const likeComment = useLikeComment();
  const unlikeComment = useUnlikeComment();
  const createComment = useCreateComment();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const userFrame = frames?.find(f => f.id === (comment.user_profile as any)?.avatar_frame_id);

  const handleLike = () => {
    if (comment.is_liked) {
      unlikeComment.mutate({ commentId: comment.id, postId });
    } else {
      likeComment.mutate({ commentId: comment.id, postId });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Xoá bình luận này?')) {
      deleteComment.mutate({ commentId: comment.id, postId });
    }
  };

  const handleReply = async (content: string, imageUrl?: string) => {
    const finalContent = imageUrl ? `${content}\n[IMG:${imageUrl}]` : content;
    await createComment.mutateAsync({
      postId,
      content: finalContent,
      parentId: comment.id
    });
    setShowReplyInput(false);
  };

  // Parse content for images
  const parseContent = (text: string) => {
    const imgMatch = text.match(/\[IMG:(.*?)\]/);
    if (imgMatch) {
      const cleanContent = text.replace(/\[IMG:.*?\]/, '').trim();
      return { text: cleanContent, imageUrl: imgMatch[1] };
    }
    return { text, imageUrl: null };
  };

  const { text: commentText, imageUrl: commentImage } = parseContent(comment.content);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={cn("flex gap-2", isReply && "ml-10")}>
      <Link to={`/user/${(comment.user_profile as any)?.username || comment.user_id}`}>
        <div className={cn("relative flex-shrink-0", userFrame ? 'h-11 w-11' : '')}>
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
              className={cn(userFrame ? 'h-[72%] w-[72%]' : 'h-8 w-8', 'border border-background')}
              style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
            >
              <AvatarImage 
                src={comment.user_profile?.avatar_url || ''} 
                style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
              />
              <AvatarFallback 
                className="text-xs bg-primary/10 text-primary"
                style={{ borderRadius: userFrame?.avatar_border_radius || '50%' }}
              >
                {comment.user_profile?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="inline-block bg-muted rounded-2xl px-3 py-2 max-w-full">
          <div className="flex items-center gap-1 flex-wrap">
            <Link 
              to={`/user/${(comment.user_profile as any)?.username || comment.user_id}`}
              className="font-semibold text-sm hover:underline"
              style={{
                color: (comment.user_profile as any)?.name_color?.is_gradient 
                  ? undefined 
                  : (comment.user_profile as any)?.name_color?.color_value || undefined,
                background: (comment.user_profile as any)?.name_color?.is_gradient 
                  ? (comment.user_profile as any)?.name_color?.gradient_value 
                  : undefined,
                WebkitBackgroundClip: (comment.user_profile as any)?.name_color?.is_gradient ? 'text' : undefined,
                WebkitTextFillColor: (comment.user_profile as any)?.name_color?.is_gradient ? 'transparent' : undefined,
              }}
            >
              {comment.user_profile?.full_name || 'Người dùng'}
              {(comment.user_profile as any)?.nickname && (
                <span className="text-muted-foreground font-normal text-xs"> ({(comment.user_profile as any).nickname})</span>
              )}
            </Link>
            {(comment.user_profile as any)?.is_verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
            )}
            {(comment.user_profile as any)?.is_admin && (
              <Badge className="gap-0.5 text-[9px] h-3.5 px-1 bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white">
                <Shield className="h-2 w-2" />
                Admin
              </Badge>
            )}
            {(comment.user_profile as any)?.has_prime_boost && (
              <PrimeBadge size="sm" />
            )}
            {(comment.user_profile as any)?.vip_level_name && (comment.user_profile as any)?.vip_level_name !== 'Member' && (
              <VipBadge levelName={(comment.user_profile as any).vip_level_name} size="sm" />
            )}
          </div>
          {commentText && <p className="text-sm break-words">{commentText}</p>}
          {commentImage && (
            <img 
              src={commentImage} 
              alt="" 
              className="mt-2 max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(commentImage, '_blank')}
            />
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-1 px-2 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
          </span>
          <button 
            className={cn("font-semibold hover:underline", comment.is_liked && "text-red-500")}
            onClick={handleLike}
          >
            {comment.likes_count > 0 && `${comment.likes_count} `}Thích
          </button>
          {!isReply && (
            <button 
              className="font-semibold hover:underline"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Trả lời
            </button>
          )}
          {isOwner && (
            <button 
              className="font-semibold hover:underline text-destructive"
              onClick={handleDelete}
            >
              Xoá
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-2">
            <CommentInput 
              onSubmit={handleReply}
              placeholder={`Trả lời ${comment.user_profile?.full_name || 'Người dùng'}...`}
              isSubmitting={createComment.isPending}
              autoFocus
            />
          </div>
        )}

        {/* Show/Hide replies button */}
        {hasReplies && !isReply && (
          <button
            className="flex items-center gap-1 text-xs text-primary font-medium mt-2 ml-2 hover:underline"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Ẩn {comment.replies!.length} phản hồi
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Xem {comment.replies!.length} phản hồi
              </>
            )}
          </button>
        )}

        {/* Replies */}
        {showReplies && hasReplies && (
          <div className="mt-2 space-y-2">
            {comment.replies!.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                postId={postId}
                isReply
                frames={frames}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PostComments: React.FC<PostCommentsProps> = ({ postId }) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = usePostComments(postId);
  const { data: frames } = useAvatarFrames();
  const createComment = useCreateComment();

  const handleSubmit = async (content: string, imageUrl?: string) => {
    const finalContent = imageUrl ? `${content}\n[IMG:${imageUrl}]` : content;
    await createComment.mutateAsync({ postId, content: finalContent });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Comment input */}
      {user && (
        <CommentInput 
          onSubmit={handleSubmit}
          isSubmitting={createComment.isPending}
        />
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} frames={frames} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-4">
          Hãy là người đầu tiên bình luận
        </p>
      )}
    </div>
  );
};

export default PostComments;
