-- Add VIP-tier markup columns to smm_services
-- Each tier will have its own markup percentage
ALTER TABLE public.smm_services 
ADD COLUMN IF NOT EXISTS markup_member numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS markup_bronze numeric DEFAULT 18,
ADD COLUMN IF NOT EXISTS markup_silver numeric DEFAULT 15,
ADD COLUMN IF NOT EXISTS markup_gold numeric DEFAULT 12,
ADD COLUMN IF NOT EXISTS markup_diamond numeric DEFAULT 10;

-- Add comment for clarity
COMMENT ON COLUMN public.smm_services.markup_member IS 'Markup percentage for Member VIP tier';
COMMENT ON COLUMN public.smm_services.markup_bronze IS 'Markup percentage for Bronze VIP tier';
COMMENT ON COLUMN public.smm_services.markup_silver IS 'Markup percentage for Silver VIP tier';
COMMENT ON COLUMN public.smm_services.markup_gold IS 'Markup percentage for Gold VIP tier';
COMMENT ON COLUMN public.smm_services.markup_diamond IS 'Markup percentage for Diamond VIP tier';