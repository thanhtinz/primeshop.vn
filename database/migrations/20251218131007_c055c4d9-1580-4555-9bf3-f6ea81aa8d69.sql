-- Add columns to track resolution from both parties
ALTER TABLE public.seller_tickets 
ADD COLUMN IF NOT EXISTS buyer_resolved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_resolved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS buyer_resolved_at timestamptz,
ADD COLUMN IF NOT EXISTS seller_resolved_at timestamptz;