-- Add plan_type column to distinguish between Basic and Boost
ALTER TABLE public.prime_boost_plans 
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'boost';

-- Add comment for documentation
COMMENT ON COLUMN public.prime_boost_plans.plan_type IS 'Type of prime plan: basic or boost';