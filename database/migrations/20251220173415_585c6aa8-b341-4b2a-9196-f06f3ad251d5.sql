-- Add prime_plan_type to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS prime_plan_type TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.prime_plan_type IS 'Type of prime subscription: basic or boost';