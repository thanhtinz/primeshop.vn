import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupPostComments, useAddGroupPostComment, GroupPostComment } from '@/hooks/useGroupPosts';
import { Loader2, EyeOff, Send, Image, X, BadgeCheck, Pen } from 'lucide-react';
import { useDateFormat } from '@/hooks/useDateFormat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';
import { MemberBadgeDisplay } from '@/components/groups/MemberBadgeDisplay';

interface GroupPostCommentsProps {
  postId: string;
  groupId: string;
  postAuthorId?: string;
}

const GroupCommentItem: React.FC<{
  comment: GroupPostComment;
  postId: string;
}> = ({ comment, postId }) => {
  const { formatRelative } = useDateFormat();
  const isAnonymous = (comment as any).is_anonymous;
  const author = comment.author;
  const hasFrame = !isAnonymous && author?.avatar_frame;
  const isPostAuthor = (comment as any).is_post_author;
  
  // Render avatar with or without frame
  const renderAvatar = () => {
    if (isAnonymous) {
      return (
        <Avatar className="h-8 w-8 bg-muted">
          <AvatarFallback>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      );
    }

    if (hasFrame) {
      return (
        <Link to={`/user/${author?.username || comment.author_id}`}>
          <div className="relative flex-shrink-0 h-11 w-11">
            <img 
              src={author.avatar_frame!.image_url}
              alt="Avatar frame"
              className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              style={{ objectFit: 'contain' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar 
                className={cn('h-[72%] w-[72%]', 'border border-background')}
                style={{ borderRadius: author.avatar_frame?.avatar_border_radius || '50%' }}
              >
                <AvatarImage 
                  src={author?.avatar_url || undefined} 
                  style={{ borderRadius: author.avatar_frame?.avatar_border_radius || '50%' }}
                />
                <AvatarFallback style={{ borderRadius: author.avatar_frame?.avatar_border_radius || '50%' }}>
                  {author?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link to={`/user/${author?.username || comment.author_id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatar_url || ''} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {author?.full_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      </Link>
    );
  };

  // Get display name with styling
  const renderAuthorName = () => {
    if (isAnonymous) {
      return (
        <span className="font-medium text-sm flex items-center gap-1">
          <EyeOff className="h-3 w-3" />
          Thành viên ẩn danh
        </span>
      );
    }

    const nameStyle = author?.name_color ? {
      color: author.name_color.is_gradient 
        ? undefined 
        : author.name_color.color_value || undefined,
      background: author.name_color.is_gradient 
        ? author.name_color.gradient_value || undefined
        : undefined,
      WebkitBackgroundClip: author.name_color.is_gradient ? 'text' : undefined,
      WebkitTextFillColor: author.name_color.is_gradient ? 'transparent' : undefined,
    } : {};

    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Link 
          to={`/user/${author?.username || comment.author_id}`}
          className="font-medium text-sm hover:underline"
          style={nameStyle as React.CSSProperties}
        >
          {author?.full_name || 'Người dùng'}
          {author?.nickname && (
            <span className="text-muted-foreground font-normal"> ({author.nickname})</span>
          )}
        </Link>
        
        {/* Verified badge */}
        {author?.is_verified && (
          <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
        )}
        
        {/* VIP badge */}
        {author?.vip_level_name && (
          <VipBadge levelName={author.vip_level_name} size="sm" />
        )}
        
        {/* Prime badge */}
        {author?.has_prime_boost && (
          <PrimeBadge />
        )}
        
        {/* Author badge */}
        {isPostAuthor && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5 bg-primary/10 text-primary border-primary/20">
            <Pen className="h-2.5 w-2.5" />
            Tác giả
          </Badge>
        )}
        
        {/* Group badges */}
        {author?.group_badges && author.group_badges.length > 0 && (
          <MemberBadgeDisplay badges={author.group_badges} maxDisplay={2} />
        )}
      </div>
    );
  };
  
  return (
    <div className="flex gap-2">
      {renderAvatar()}
      
      <div className="flex-1">
        <div className="bg-muted rounded-2xl px-3 py-2">
          <div className="mb-0.5">
            {renderAuthorName()}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-3 mt-1 ml-3 text-xs text-muted-foreground">
          <span>
            {formatRelative(comment.created_at, { addSuffix: false })}
          </span>
          <button className="hover:underline">Thích</button>
          <button className="hover:underline">Trả lời</button>
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-2">
            {comment.replies.map(reply => (
              <GroupCommentItem key={reply.id} comment={reply} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const GroupPostComments: React.FC<GroupPostCommentsProps> = ({ postId, groupId, postAuthorId }) => {
  const { user, profile } = useAuth();
  const { data: comments, isLoading } = useGroupPostComments(postId, postAuthorId);
  const addComment = useAddGroupPostComment();
  
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/group-comment-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;
    
    const finalContent = imageUrl ? `${content}\n[IMG:${imageUrl}]` : content;
    
    await addComment.mutateAsync({
      postId,
      content: finalContent,
      isAnonymous,
    });
    
    setContent('');
    setImageUrl(null);
    setIsAnonymous(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Comment input */}
      {user && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {isAnonymous ? (
              <Avatar className="h-8 w-8 bg-muted flex-shrink-0">
                <AvatarFallback>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {profile?.full_name?.[0] || user.email?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
                <input
                  type="text"
                  placeholder={isAnonymous ? "Bình luận ẩn danh..." : "Viết bình luận..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                  className="flex-1 bg-transparent border-0 outline-none text-sm py-1"
                />
                
                <div className="flex items-center gap-0.5">
                  <label className="p-1.5 rounded-full hover:bg-accent transition-colors cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Image className="h-4 w-4 text-muted-foreground hover:text-green-500" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>

                  <button 
                    className={`p-1.5 rounded-full transition-colors ${
                      (content.trim() || imageUrl) 
                        ? "text-primary hover:bg-primary/10" 
                        : "text-muted-foreground"
                    }`}
                    onClick={handleSubmit}
                    disabled={addComment.isPending || (!content.trim() && !imageUrl)}
                  >
                    {addComment.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Anonymous toggle */}
              <div className="flex items-center gap-2 mt-2 ml-1">
                <Switch
                  id="anonymous-comment"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                  className="scale-75"
                />
                <Label htmlFor="anonymous-comment" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                  <EyeOff className="h-3 w-3" />
                  Bình luận ẩn danh
                </Label>
              </div>
            </div>
          </div>
          
          {/* Image Preview */}
          {imageUrl && (
            <div className="relative inline-block ml-10">
              <img 
                src={imageUrl} 
                alt="" 
                className="h-20 w-20 object-cover rounded-lg border"
              />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <GroupCommentItem key={comment.id} comment={comment} postId={postId} />
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

export default GroupPostComments;
