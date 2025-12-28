import { useSellerReviews } from '@/hooks/useMarketplace';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/hooks/useDateFormat';

interface SellerReviewsSectionProps {
  sellerId: string;
  ratingAverage: number;
  ratingCount: number;
  onViewAll?: () => void;
}

export function SellerReviewsSection({ sellerId, ratingAverage, ratingCount, onViewAll }: SellerReviewsSectionProps) {
  const { formatDate } = useDateFormat();
  const { data: reviews, isLoading } = useSellerReviews(sellerId);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bình luận & đánh giá</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stats Pills */}
      <div className="flex gap-3">
        <div className="flex-1 py-2 px-4 rounded-full border border-border bg-card text-center">
          <span className="font-bold">{ratingCount}</span>
          <span className="text-muted-foreground ml-1">Đánh giá</span>
        </div>
        <div className="flex-1 py-2 px-4 rounded-full border border-border bg-card text-center flex items-center justify-center gap-1">
          <span className="font-bold">{ratingAverage.toFixed(1)}/5</span>
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                {review.reviewer_avatar && (
                  <AvatarImage src={review.reviewer_avatar} alt={review.reviewer_name || 'User'} />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                  {getInitials(review.reviewer_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{review.reviewer_name || 'Người dùng'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.created_at, "dd 'tháng' M, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
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
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-foreground">{review.comment}</p>
                )}
                
                {/* Seller Reply */}
                {review.seller_reply && (
                  <div className="mt-2 p-2 rounded bg-primary/5 border-l-2 border-primary">
                    <p className="text-xs font-medium text-primary mb-1">Phản hồi từ shop</p>
                    <p className="text-xs text-foreground">{review.seller_reply}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Chưa có đánh giá nào
          </p>
        )}
      </div>
    </div>
  );
}
