-- Add avatar_description column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_description text,
ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;