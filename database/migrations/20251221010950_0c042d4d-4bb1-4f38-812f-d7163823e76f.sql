-- Add is_anonymous column to group_post_comments table
ALTER TABLE public.group_post_comments 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;