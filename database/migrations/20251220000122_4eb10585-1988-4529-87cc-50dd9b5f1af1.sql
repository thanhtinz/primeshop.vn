-- Add prime_price column to avatar_frames
ALTER TABLE public.avatar_frames 
ADD COLUMN prime_price numeric DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.avatar_frames.prime_price IS 'Discounted price for Prime Boost users';

-- Update existing frames with sample prime prices (50% off)
UPDATE public.avatar_frames 
SET prime_price = price * 0.5 
WHERE price > 0;