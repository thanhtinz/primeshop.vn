-- Add per_user_limit column to vouchers table
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT NULL;

-- Add per_user_limit column to seller_vouchers table  
ALTER TABLE public.seller_vouchers ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT NULL;

-- Create table to track voucher usage per user
CREATE TABLE IF NOT EXISTS public.voucher_user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
  seller_voucher_id UUID REFERENCES public.seller_vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(voucher_id, user_id),
  UNIQUE(seller_voucher_id, user_id)
);

-- Enable RLS
ALTER TABLE public.voucher_user_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own voucher usage"
ON public.voucher_user_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own voucher usage"
ON public.voucher_user_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own voucher usage"
ON public.voucher_user_usage
FOR UPDATE
USING (auth.uid() = user_id);