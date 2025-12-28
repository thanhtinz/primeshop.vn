-- Add partner status to sellers table
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT FALSE;

-- Create index for partner queries
CREATE INDEX IF NOT EXISTS idx_sellers_is_partner ON public.sellers(is_partner) WHERE is_partner = TRUE;