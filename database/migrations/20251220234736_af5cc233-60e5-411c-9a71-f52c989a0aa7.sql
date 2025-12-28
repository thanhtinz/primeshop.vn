-- Add is_anonymous column to group_posts table
ALTER TABLE public.group_posts 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;