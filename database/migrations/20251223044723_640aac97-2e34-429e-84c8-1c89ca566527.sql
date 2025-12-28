-- Add rush_delivery_fee to design_services
ALTER TABLE public.design_services 
ADD COLUMN IF NOT EXISTS rush_delivery_fee numeric DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.design_services.rush_delivery_fee IS 'Fixed fee for rush delivery, set by seller';

-- Create table for service-specific license prices (seller sets price per license type per service)
CREATE TABLE IF NOT EXISTS public.design_service_license_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.design_services(id) ON DELETE CASCADE,
  license_type_id UUID NOT NULL REFERENCES public.design_license_types(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(service_id, license_type_id)
);

-- Enable RLS
ALTER TABLE public.design_service_license_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view license prices"
ON public.design_service_license_prices
FOR SELECT
USING (true);

CREATE POLICY "Sellers can manage their service license prices"
ON public.design_service_license_prices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.design_services ds
    JOIN public.sellers s ON ds.seller_id = s.id
    WHERE ds.id = design_service_license_prices.service_id
    AND s.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_design_service_license_prices_service 
ON public.design_service_license_prices(service_id);

CREATE INDEX IF NOT EXISTS idx_design_service_license_prices_license 
ON public.design_service_license_prices(license_type_id);