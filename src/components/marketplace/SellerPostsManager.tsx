import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Image, Trash2, Send, MessageCircle, Loader2, 
  X, FileImage, Edit, MoreVertical, Reply
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  useMyShopPosts, useCreateShopPost, useDeleteShopPost, useUpdateShopPost,
  useShopPostsComments, useShopReplyComment, useDeleteShopComment
} from '@/hooks/useShopPosts';
import { useDateFormat } from '@/hooks/useDateFormat';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SellerPostsManagerProps {
  sellerId: string;
  shopName: string;
  shopAvatar?: string | null;
}

export function SellerPostsManager({ sellerId, shopName, shopAvatar }: SellerPostsManagerProps) {
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { formatRelative } = useDateFormat();

  const { data: posts = [], isLoading: postsLoading } = useMyShopPosts(sellerId);
  const { data: comments = [], isLoading: commentsLoading } = useShopPostsComments(sellerId);
  const createPost = useCreateShopPost();
  const deletePost = useDeleteShopPost();
  const updatePost = useUpdateShopPost();
  const replyComment = useShopReplyComment();
  const deleteComment = useDeleteShopComment();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (newPostImages.length + files.length > 10) {
      toast.error('Tối đa 10 ảnh');
      return;
    }

    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 50 * 1024 * 1024) continue;

        const fileExt = file.name.split('.').pop();
        const fileName = `shop-${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);
          newImages.push(publicUrl);
        }
      }

      if (newImages.length > 0) {
        setNewPostImages(prev => [...prev, ...newImages]);
      }
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostImages.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc thêm ảnh');
      return;
    }

    try {
      await createPost.mutateAsync({
        sellerId,
        content: newPostContent,
        images: newPostImages
      });
      setNewPostContent('');
      setNewPostImages([]);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Xác nhận xoá bài viết này?')) return;
    await deletePost.mutateAsync({ postId, sellerId });
  };

  const handleReplyComment = async () => {
    if (!replyingTo || !replyContent.trim()) return;

    await replyComment.mutateAsync({
      postId: replyingTo.post_id,
      content: replyContent,
      parentId: replyingTo.id,
      sellerId
    });
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Xác nhận xoá bình luận này?')) return;
    await deleteComment.mutateAsync({ commentId, sellerId });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileImage className="h-4 w-4" />
            Bài viết ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Bình luận ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-4">
          {/* Create Post */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Đăng bài viết mới
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={shopAvatar || undefined} />
                  <AvatarFallback>{shopName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Viết gì đó cho shop của bạn..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Image Preview */}
              {newPostImages.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {newPostImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setNewPostImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                    <span className="ml-2">Thêm ảnh</span>
                  </Button>
                </div>
                <Button onClick={handleCreatePost} disabled={createPost.isPending}>
                  {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-2">Đăng bài</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts List */}
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Shop chưa có bài viết nào
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarImage src={shopAvatar || undefined} />
                          <AvatarFallback>{shopName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{shopName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelative(post.created_at)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPost(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xoá bài
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {post.content && (
                      <p className="mt-3 whitespace-pre-wrap">{post.content}</p>
                    )}

                    {post.images?.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {post.images.slice(0, 6).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt="" 
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                      <span>{post.likes_count} lượt thích</span>
                      <span>{post.comments_count} bình luận</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có bình luận nào
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <Card key={comment.id}>
                    <CardContent className="py-3">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {comment.user_profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user_profile?.full_name || comment.user_profile?.email?.split('@')[0]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelative(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Bài viết: {comment.post?.content?.slice(0, 50)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setReplyingTo(comment)}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Trả lời
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Xoá
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả lời bình luận với tư cách Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">
                {replyingTo?.user_profile?.full_name || 'Người dùng'}:
              </p>
              <p className="text-sm text-muted-foreground">{replyingTo?.content}</p>
            </div>
            <Textarea
              placeholder="Nhập nội dung trả lời..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyingTo(null)}>
                Huỷ
              </Button>
              <Button onClick={handleReplyComment} disabled={replyComment.isPending}>
                {replyComment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Gửi trả lời
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
