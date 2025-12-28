-- Add is_pinned column to user_posts table
ALTER TABLE public.user_posts
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add pinned_at timestamp to track when post was pinned
ALTER TABLE public.user_posts  
ADD COLUMN pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster queries on pinned posts by user
CREATE INDEX idx_user_posts_pinned ON public.user_posts (user_id, is_pinned) WHERE is_pinned = true;