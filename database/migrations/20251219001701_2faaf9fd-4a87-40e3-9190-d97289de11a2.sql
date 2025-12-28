-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS friend_request_followers_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS message_friends_only boolean DEFAULT false;