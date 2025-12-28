import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  Image, 
  Loader2,
  FileText,
  TrendingUp,
  Users,
  MoreVertical,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/useDateFormat';

interface Post {
  id: string;
  user_id: string;
  content: string;
  images: string[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  visibility: string;
  created_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

const AdminPosts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { formatRelative, formatDateTime } = useDateFormat();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('user_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      return (data || []).map(post => ({
        ...post,
        full_name: profileMap.get(post.user_id)?.full_name,
        avatar_url: profileMap.get(post.user_id)?.avatar_url
      })) as Post[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('user_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Đã xóa bài viết');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    },
    onError: (error: any) => toast.error(error.message || 'Không thể xóa'),
  });

  const filteredPosts = posts || [];
  const totalLikes = filteredPosts.reduce((sum, p) => sum + p.likes_count, 0);
  const totalComments = filteredPosts.reduce((sum, p) => sum + p.comments_count, 0);
  const postsWithImages = filteredPosts.filter(p => p.images?.length).length;

  const handleView = (post: Post) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quản lý Bài viết</h1>
          <p className="text-sm text-muted-foreground">Quản lý bài viết của người dùng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredPosts.length}</p>
                <p className="text-xs text-muted-foreground">Bài viết</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLikes}</p>
                <p className="text-xs text-muted-foreground">Lượt thích</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalComments}</p>
                <p className="text-xs text-muted-foreground">Bình luận</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Image className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{postsWithImages}</p>
                <p className="text-xs text-muted-foreground">Có ảnh</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm bài viết..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Không có bài viết nào</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
              <div className="divide-y">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={post.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {post.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{post.full_name || 'Ẩn danh'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelative(post.created_at)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(post)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(post.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa bài viết
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Post content */}
                        <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
                        
                        {/* Images indicator */}
                        {post.images && post.images.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium">+{post.images.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-red-500" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                            {post.comments_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3.5 w-3.5 text-green-500" />
                            {post.shares_count}
                          </span>
                          <Badge variant="outline" className="text-xs h-5">
                            {post.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết bài viết</DialogTitle>
            <DialogDescription>Xem nội dung đầy đủ của bài viết</DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedPost.avatar_url || ''} />
                  <AvatarFallback>{selectedPost.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPost.full_name || 'Ẩn danh'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedPost.created_at)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="rounded-lg w-full" />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-500" /> {selectedPost.likes_count} thích
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 text-blue-500" /> {selectedPost.comments_count} bình luận
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => postToDelete && deleteMutation.mutate(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPosts;
