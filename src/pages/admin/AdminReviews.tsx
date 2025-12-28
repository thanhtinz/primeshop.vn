import React, { useState } from 'react';
import { useAllReviews, useAdminReplyReview, useToggleReviewApproval, useDeleteReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Star, Search, MessageSquare, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const AdminReviews = () => {
  const { data: reviews, isLoading } = useAllReviews();
  const replyMutation = useAdminReplyReview();
  const toggleApprovalMutation = useToggleReviewApproval();
  const deleteMutation = useDeleteReview();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [replyDialog, setReplyDialog] = useState<{ open: boolean; review: any | null }>({ open: false, review: null });
  const [replyText, setReplyText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reviewId: string | null }>({ open: false, reviewId: null });

  const filteredReviews = reviews?.filter(review => 
    review.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (review.products as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReply = async () => {
    if (!replyDialog.review || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      await replyMutation.mutateAsync({
        id: replyDialog.review.id,
        admin_reply: replyText.trim(),
      });
      toast.success('Phản hồi thành công');
      setReplyDialog({ open: false, review: null });
      setReplyText('');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await toggleApprovalMutation.mutateAsync({ id, is_approved: !currentStatus });
      toast.success(currentStatus ? 'Đã ẩn đánh giá' : 'Đã hiện đánh giá');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.reviewId) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.reviewId);
      toast.success('Đã xóa đánh giá');
      setDeleteDialog({ open: false, reviewId: null });
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người đánh giá</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews?.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{review.user_name || 'Ẩn danh'}</p>
                            <p className="text-xs text-muted-foreground">{review.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/product/${(review.products as any)?.slug}`}
                            className="text-primary hover:underline"
                          >
                            {(review.products as any)?.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">{review.comment || '-'}</p>
                          {review.admin_reply && (
                            <p className="text-xs text-primary mt-1 truncate">
                              ↳ Đã phản hồi
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                            {review.is_approved ? 'Hiển thị' : 'Ẩn'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(review.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setReplyDialog({ open: true, review });
                                setReplyText(review.admin_reply || '');
                              }}
                              title="Phản hồi"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleApproval(review.id, review.is_approved)}
                              title={review.is_approved ? 'Ẩn' : 'Hiện'}
                            >
                              {review.is_approved ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog({ open: true, reviewId: review.id })}
                              className="text-destructive hover:text-destructive"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredReviews?.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{review.user_name || 'Ẩn danh'}</p>
                          <p className="text-xs text-muted-foreground">{review.user_email}</p>
                        </div>
                        <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                          {review.is_approved ? 'Hiển thị' : 'Ẩn'}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sản phẩm:</p>
                        <Link 
                          to={`/product/${(review.products as any)?.slug}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {(review.products as any)?.name}
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                      )}

                      {review.admin_reply && (
                        <div className="p-2 rounded bg-primary/5 border-l-2 border-primary">
                          <p className="text-xs text-primary font-medium mb-1">Phản hồi Admin:</p>
                          <p className="text-sm">{review.admin_reply}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyDialog({ open: true, review });
                            setReplyText(review.admin_reply || '');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Phản hồi
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleApproval(review.id, review.is_approved)}
                        >
                          {review.is_approved ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Ẩn
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Hiện
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, reviewId: review.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredReviews?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Không tìm thấy đánh giá nào
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialog.open} onOpenChange={(open) => setReplyDialog({ open, review: open ? replyDialog.review : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phản hồi đánh giá</DialogTitle>
          </DialogHeader>
          
          {replyDialog.review && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{replyDialog.review.user_name || 'Ẩn danh'}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3 w-3",
                          star <= replyDialog.review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm">{replyDialog.review.comment || 'Không có nội dung'}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nội dung phản hồi</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog({ open: false, review: null })}>
              Hủy
            </Button>
            <Button onClick={handleReply} disabled={replyMutation.isPending}>
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : 'Gửi phản hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, reviewId: open ? deleteDialog.reviewId : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReviews;