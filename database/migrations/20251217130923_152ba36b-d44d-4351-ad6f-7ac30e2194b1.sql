-- Add rate limiting fields to user_api_keys
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS rate_limit_per_minute integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS rate_limit_per_day integer DEFAULT 10000;