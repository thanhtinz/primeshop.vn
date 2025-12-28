-- Add avatar_border_radius field to control the shape of avatar inside frame
-- '50%' = circle, '0%' = square, '20%' = rounded square, etc.
ALTER TABLE public.avatar_frames 
ADD COLUMN IF NOT EXISTS avatar_border_radius TEXT DEFAULT '50%';

-- Update existing frame to have square-ish shape (for cat frame style)
UPDATE public.avatar_frames 
SET avatar_border_radius = '30%' 
WHERE name = 'Khung mèo';