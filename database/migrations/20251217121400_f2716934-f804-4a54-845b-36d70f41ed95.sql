-- Create user_vouchers table for personal voucher assignment
CREATE TABLE public.user_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, voucher_id)
);

-- Enable RLS
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;

-- Users can view their own assigned vouchers
CREATE POLICY "Users can view their own vouchers"
ON public.user_vouchers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all user vouchers
CREATE POLICY "Admins can manage all user vouchers"
ON public.user_vouchers
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Users can update their own vouchers (mark as used)
CREATE POLICY "Users can update their own vouchers"
ON public.user_vouchers
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_vouchers_user_id ON public.user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_voucher_id ON public.user_vouchers(voucher_id);