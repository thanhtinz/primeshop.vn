import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useProductReviews, useUserReview, useCheckVerifiedPurchase, useCreateReview, useUpdateReview, useProductRatingStats } from '@/hooks/useReviews';
import { useAvatarFrames } from '@/hooks/useAvatarFrames';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VipBadge } from '@/components/ui/vip-badge';
import { PrimeBadge } from '@/components/ui/prime-badge';

import { toast } from 'sonner';
import { Star, User, CheckCircle, Loader2, ShieldCheck, Image as ImageIcon, ThumbsUp, MessageCircle, BadgeCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReviewImageUpload } from './ReviewImageUpload';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const { data: reviews, isLoading: loadingReviews } = useProductReviews(productId);
  const { data: userReview } = useUserReview(productId, user?.id);
  const { data: isVerifiedPurchase } = useCheckVerifiedPurchase(productId, profile?.email);
  const { data: stats } = useProductRatingStats(productId);
  const { data: frames } = useAvatarFrames();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || '');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error(t('pleaseLogin'));
      return;
    }

    if (rating === 0) {
      toast.error(t('pleaseSelectStars'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (userReview) {
        await updateReview.mutateAsync({
          id: userReview.id,
          rating,
          comment: comment || null,
        });
        
        // Handle new images for existing review
        if (reviewImages.length > 0) {
          const imageInserts = reviewImages.map((url, index) => ({
            review_id: userReview.id,
            image_url: url,
            sort_order: index
          }));
          
          await supabase
            .from('review_images')
            .insert(imageInserts);
        }
        
        toast.success(t('reviewUpdated'));
      } else {
        const newReview = await createReview.mutateAsync({
          product_id: productId,
          user_id: user.id,
          user_email: profile.email,
          user_name: profile.full_name,
          rating,
          comment: comment || null,
          is_verified_purchase: isVerifiedPurchase || false,
        });
        
        // Save images to review_images table
        if (reviewImages.length > 0 && newReview?.id) {
          const imageInserts = reviewImages.map((url, index) => ({
            review_id: newReview.id,
            image_url: url,
            sort_order: index
          }));
          
          await supabase
            .from('review_images')
            .insert(imageInserts);
        }
        
        toast.success(t('reviewSubmitted'));
      }
      setShowForm(false);
      setReviewImages([]);
    } catch (error) {
      toast.error(t('reviewError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary - Compact Style */}
      <div className="flex gap-3">
        <div className="flex-1 py-2.5 px-4 rounded-full border border-border bg-card text-center">
          <span className="font-bold">{stats?.count || 0}</span>
          <span className="text-muted-foreground ml-1">{t('reviewCount')}</span>
        </div>
        <div className="flex-1 py-2.5 px-4 rounded-full border border-border bg-card text-center flex items-center justify-center gap-1">
          <span className="font-bold">{stats?.average.toFixed(1) || '0.0'}/5</span>
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      </div>

      {/* Write Review */}
      {user ? (
        <div className="space-y-4">
          {!showForm && !userReview && (
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Star className="h-4 w-4 mr-2" />
              {t('writeReview')}
            </Button>
          )}
          
          {(showForm || userReview) && (
            <div className="p-4 rounded-lg border border-border bg-card space-y-4">
              <h4 className="font-medium">
                {userReview ? t('updateYourReview') : t('writeReview')}
              </h4>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('selectStars')}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground hover:text-yellow-400"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('commentOptional')}</p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('shareExperience')}
                  rows={3}
                />
              </div>
              
              {/* Image Upload */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Thêm ảnh (tuỳ chọn)</p>
                <ReviewImageUpload
                  images={reviewImages}
                  onChange={setReviewImages}
                  maxImages={5}
                  disabled={isSubmitting}
                />
              </div>
              
              
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : userReview ? t('update') : t('sendReview')}
                </Button>
                {showForm && !userReview && (
                  <Button variant="ghost" onClick={() => setShowForm(false)}>
                    {t('cancel')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <a href="/auth" className="text-primary hover:underline">{t('login')}</a> {t('loginToReview')}
        </p>
      )}


      {/* Reviews List - Compact Style */}
      <div className="space-y-4">
        {loadingReviews ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => {
            const reviewFrame = frames?.find(f => f.id === review.user_avatar_frame_id);
            return (
            <div key={review.id} className="flex gap-3">
              {/* Avatar with frame */}
              <div className={cn("relative flex-shrink-0", reviewFrame ? 'h-12 w-12' : '')}>
                {reviewFrame && (
                  <img 
                    src={reviewFrame.image_url}
                    alt="Avatar frame"
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                    style={{ objectFit: 'contain' }}
                  />
                )}
                <div className={reviewFrame ? 'absolute inset-0 flex items-center justify-center' : ''}>
                  <Avatar 
                    className={cn(reviewFrame ? 'h-[72%] w-[72%]' : 'h-10 w-10')}
                    style={{ borderRadius: reviewFrame?.avatar_border_radius || '50%' }}
                  >
                    {review.user_avatar_url ? (
                      <AvatarImage src={review.user_avatar_url} alt={review.user_name || 'User'} style={{ borderRadius: reviewFrame?.avatar_border_radius || '50%' }} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground" style={{ borderRadius: reviewFrame?.avatar_border_radius || '50%' }}>
                      {getInitials(review.user_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span 
                        className="font-semibold text-sm"
                        style={{
                          color: (review as any).name_color?.is_gradient 
                            ? undefined 
                            : (review as any).name_color?.color_value || undefined,
                          background: (review as any).name_color?.is_gradient 
                            ? (review as any).name_color?.gradient_value 
                            : undefined,
                          WebkitBackgroundClip: (review as any).name_color?.is_gradient ? 'text' : undefined,
                          WebkitTextFillColor: (review as any).name_color?.is_gradient ? 'transparent' : undefined,
                        }}
                      >
                        {review.user_name || t('anonymous')}
                        {review.user_nickname && (
                          <span className="text-muted-foreground font-normal"> ({review.user_nickname})</span>
                        )}
                      </span>
                      {review.user_is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-100 flex-shrink-0" />
                      )}
                      {review.user_is_admin && (
                        <Badge className="gap-0.5 text-[10px] h-4 px-1 bg-gradient-to-r from-red-500 to-red-600 border-red-500 text-white">
                          <Shield className="h-2.5 w-2.5" />
                          Admin
                        </Badge>
                      )}
                      {review.has_prime_boost && (
                        <PrimeBadge size="sm" />
                      )}
                      <VipBadge levelName={review.vip_level_name} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                      {review.is_verified_purchase && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="inline h-3 w-3 mr-0.5" />
                          {t('verifiedPurchase')}
                        </span>
                      )}
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

                {/* Review Images */}
                {(review as any).review_images && (review as any).review_images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(review as any).review_images.map((img: any, index: number) => (
                      <a 
                        key={img.id || index} 
                        href={img.image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img 
                          src={img.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Admin Reply */}
                {review.admin_reply && (
                  <div className="mt-3 p-2 rounded bg-primary/5 border-l-2 border-primary">
                    <p className="text-xs font-medium text-primary mb-1">{t('adminReply')}</p>
                    <p className="text-xs text-foreground">{review.admin_reply}</p>
                  </div>
                )}
              </div>
            </div>
          );})
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t('noReviewsYet')}
          </p>
        )}
      </div>
    </div>
  );
}
