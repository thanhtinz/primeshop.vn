-- Fix duplicate triggers causing double counting

-- Drop duplicate post_likes trigger
DROP TRIGGER IF EXISTS on_post_like_change ON public.post_likes;

-- Also check and fix comment_likes duplicate triggers
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;

-- Reset incorrect counts - recalculate from actual data
UPDATE public.user_posts 
SET likes_count = (
  SELECT COUNT(*) FROM public.post_likes WHERE post_likes.post_id = user_posts.id
);

UPDATE public.post_comments 
SET likes_count = (
  SELECT COUNT(*) FROM public.comment_likes WHERE comment_likes.comment_id = post_comments.id
);