import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MessageSquare, EyeOff, Users, Megaphone, HandCoins, ListTodo, PieChart, FileText } from 'lucide-react';
import { useGroupPosts, GroupPostType } from '@/hooks/useGroupPosts';
import { useDateFormat } from '@/hooks/useDateFormat';
import { cn } from '@/lib/utils';

interface GroupPostSearchDialogProps {
  groupId: string;
  trigger?: React.ReactNode;
  onSelectPost?: (postId: string) => void;
}

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

export function GroupPostSearchDialog({ groupId, trigger, onSelectPost }: GroupPostSearchDialogProps) {
  const { formatRelative } = useDateFormat();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allPosts, isLoading } = useGroupPosts(groupId);
  
  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!allPosts || !searchQuery.trim()) return allPosts || [];
    
    const query = searchQuery.toLowerCase();
    return allPosts.filter(post => {
      const content = post.content?.toLowerCase() || '';
      const title = post.title?.toLowerCase() || '';
      const authorName = (post.author as any)?.full_name?.toLowerCase() || '';
      
      return content.includes(query) || title.includes(query) || authorName.includes(query);
    });
  }, [allPosts, searchQuery]);
  
  const handleSelectPost = (postId: string) => {
    onSelectPost?.(postId);
    setOpen(false);
    // Scroll to post element
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('ring-2', 'ring-primary');
      setTimeout(() => {
        postElement.classList.remove('ring-2', 'ring-primary');
      }, 2000);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="icon" className="rounded-full">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tìm kiếm bài viết</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo nội dung, tiêu đề..."
              className="pl-9"
              autoFocus
            />
          </div>
          
          {/* Results */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.trim() === '' ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nhập từ khóa để tìm kiếm</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Không tìm thấy bài viết nào</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredPosts.map((post) => {
                  const authorProfile = post.author as any;
                  const typeConfig = postTypeConfig[post.post_type];
                  
                  return (
                    <button
                      key={post.id}
                      onClick={() => handleSelectPost(post.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* Author Avatar */}
                        {post.is_anonymous ? (
                          <Avatar className="h-10 w-10 bg-muted flex-shrink-0">
                            <AvatarFallback>
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={authorProfile?.avatar_url || ''} />
                            <AvatarFallback>
                              {authorProfile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {post.is_anonymous ? 'Thành viên ẩn danh' : (authorProfile?.full_name || 'Người dùng')}
                            </span>
                            {typeConfig && post.post_type !== 'discussion' && (
                              <Badge className={cn("text-[10px] h-4 px-1 gap-0.5", typeConfig.className)}>
                                {typeConfig.icon}
                                {typeConfig.label}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Title */}
                          {post.title && (
                            <p className="font-medium text-sm mt-0.5 truncate">
                              {post.title}
                            </p>
                          )}
                          
                          {/* Content Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {post.content}
                          </p>
                          
                          {/* Meta */}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>
                              {formatRelative(post.created_at)}
                            </span>
                            <span>·</span>
                            <span>{post.like_count} thích</span>
                            <span>·</span>
                            <span>{post.comment_count} bình luận</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
