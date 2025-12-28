-- Add design shop pricing settings to sellers table
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS design_rush_delivery_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_extra_revision_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_commercial_license_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_exclusive_license_price numeric DEFAULT 0;