-- Create table for seller NDA settings
CREATE TABLE IF NOT EXISTS public.design_seller_nda_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  requires_nda BOOLEAN DEFAULT false,
  no_portfolio_use BOOLEAN DEFAULT false,
  confidentiality_period_days INTEGER DEFAULT 365,
  nda_fee NUMERIC DEFAULT 0,
  violation_penalty NUMERIC DEFAULT 0,
  custom_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id)
);

-- Enable RLS
ALTER TABLE public.design_seller_nda_settings ENABLE ROW LEVEL SECURITY;

-- Policies for sellers to manage their own settings
CREATE POLICY "Sellers can view own NDA settings"
ON public.design_seller_nda_settings
FOR SELECT
USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can insert own NDA settings"
ON public.design_seller_nda_settings
FOR INSERT
WITH CHECK (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can update own NDA settings"
ON public.design_seller_nda_settings
FOR UPDATE
USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Public can view NDA settings for ordering
CREATE POLICY "Public can view NDA settings"
ON public.design_seller_nda_settings
FOR SELECT
USING (true);