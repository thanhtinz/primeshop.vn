import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost, UserPost } from '@/hooks/usePosts';
import { Globe, Users, Lock, ChevronDown, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SharePostDialogProps {
  post: UserPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SharePostDialog: React.FC<SharePostDialogProps> = ({
  post,
  open,
  onOpenChange
}) => {
  const { user, profile } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');

  const handleShare = async () => {
    const sharedContent = content.trim() 
      ? `${content}\n\n---\n🔄 Đã chia sẻ từ @${post.user_profile?.full_name || 'Người dùng'}:\n"${post.content}"`
      : `🔄 Đã chia sẻ từ @${post.user_profile?.full_name || 'Người dùng'}:\n"${post.content}"`;
    
    await createPost.mutateAsync({
      content: sharedContent,
      images: post.images || [],
      visibility
    });

    toast.success('Đã chia sẻ bài viết về trang cá nhân');
    setContent('');
    onOpenChange(false);
  };

  const visibilityOptions = {
    public: { icon: Globe, label: 'Công khai' },
    friends: { icon: Users, label: 'Bạn bè' },
    private: { icon: Lock, label: 'Riêng tư' }
  };

  const VisIcon = visibilityOptions[visibility].icon;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Chia sẻ bài viết
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>{profile?.full_name?.[0] || user.email?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.full_name || user.email}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 gap-1 px-2 py-0.5">
                    <VisIcon className="h-3 w-3" />
                    {visibilityOptions[visibility].label}
                    <ChevronDown className="h-3 w-3" />
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setVisibility('public')}>
                    <Globe className="h-4 w-4 mr-2" />
                    Công khai
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibility('friends')}>
                    <Users className="h-4 w-4 mr-2" />
                    Bạn bè
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVisibility('private')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Riêng tư
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Share text */}
          <textarea
            placeholder="Nói gì đó về bài viết này..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[80px] bg-transparent border-0 outline-none resize-none text-sm"
          />

          {/* Original post preview */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.user_profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {post.user_profile?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.user_profile?.full_name || 'Người dùng'}</p>
              </div>
            </div>
            {post.content && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                {post.content}
              </p>
            )}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                {post.images.slice(0, 3).map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt="" 
                    className="aspect-square object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button onClick={handleShare} disabled={createPost.isPending}>
              {createPost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Chia sẻ ngay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePostDialog;
