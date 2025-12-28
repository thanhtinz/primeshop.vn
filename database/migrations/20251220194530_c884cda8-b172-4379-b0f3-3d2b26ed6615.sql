-- Add reaction_type column to post_likes table
ALTER TABLE public.post_likes 
ADD COLUMN reaction_type TEXT NOT NULL DEFAULT 'like';

-- Add comment to explain the reaction types
COMMENT ON COLUMN public.post_likes.reaction_type IS 'Reaction type: like, love, care, haha, wow, sad, angry';