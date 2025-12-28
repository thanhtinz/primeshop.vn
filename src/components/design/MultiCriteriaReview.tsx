import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageCircle, Clock, Palette, Loader2 } from 'lucide-react';
import { useCreateReviewCriteria } from '@/hooks/useDesignAdvanced';
import { cn } from '@/lib/utils';

interface MultiCriteriaReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  serviceId: string;
  sellerId: string;
  isOnTime?: boolean;
}

interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ComponentType<any>;
}

function RatingStars({ value, onChange, label, icon: Icon }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm">{label}</Label>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="p-0.5 focus:outline-none"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                (hovered || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Chưa đánh giá'}
        </span>
      </div>
    </div>
  );
}

export function MultiCriteriaReview({
  open,
  onOpenChange,
  orderId,
  serviceId,
  sellerId,
  isOnTime = true,
}: MultiCriteriaReviewProps) {
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    deadline: 0,
    quality: 0,
  });
  const [comment, setComment] = useState('');
  const createReview = useCreateReviewCriteria();

  const handleSubmit = () => {
    if (ratings.overall === 0) return;

    createReview.mutate(
      {
        order_id: orderId,
        service_id: serviceId,
        seller_id: sellerId,
        overall_rating: ratings.overall,
        communication_rating: ratings.communication || null,
        deadline_rating: ratings.deadline || null,
        quality_rating: ratings.quality || null,
        comment: comment || null,
        is_on_time: isOnTime,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRatings({ overall: 0, communication: 0, deadline: 0, quality: 0 });
          setComment('');
        },
      }
    );
  };

  const averageRating = Object.values(ratings).filter(r => r > 0).reduce((a, b) => a + b, 0) / 
    Object.values(ratings).filter(r => r > 0).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh giá dịch vụ</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Overall Rating */}
          <RatingStars
            value={ratings.overall}
            onChange={(v) => setRatings({ ...ratings, overall: v })}
            label="Đánh giá tổng thể *"
            icon={Star}
          />

          {/* Communication */}
          <RatingStars
            value={ratings.communication}
            onChange={(v) => setRatings({ ...ratings, communication: v })}
            label="Giao tiếp"
            icon={MessageCircle}
          />

          {/* Deadline */}
          <RatingStars
            value={ratings.deadline}
            onChange={(v) => setRatings({ ...ratings, deadline: v })}
            label="Đúng deadline"
            icon={Clock}
          />

          {/* Quality */}
          <RatingStars
            value={ratings.quality}
            onChange={(v) => setRatings({ ...ratings, quality: v })}
            label="Chất lượng thiết kế"
            icon={Palette}
          />

          {/* Average display */}
          {averageRating > 0 && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Điểm trung bình</p>
              <p className="text-2xl font-bold text-yellow-500">
                {averageRating.toFixed(1)} / 5
              </p>
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label>Nhận xét (tùy chọn)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Bỏ qua
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReview.isPending || ratings.overall === 0}
            >
              {createReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Gửi đánh giá
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
