-- Add processing_time and refill_policy fields to smm_services
ALTER TABLE public.smm_services
ADD COLUMN IF NOT EXISTS processing_time text DEFAULT null,
ADD COLUMN IF NOT EXISTS refill_policy text DEFAULT null;

-- Add refund columns to smm_orders
ALTER TABLE public.smm_orders
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_at timestamp with time zone DEFAULT null,
ADD COLUMN IF NOT EXISTS refund_reason text DEFAULT null;