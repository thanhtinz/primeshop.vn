-- Update default value for trust_score to 0 for new sellers
ALTER TABLE public.sellers ALTER COLUMN trust_score SET DEFAULT 0;