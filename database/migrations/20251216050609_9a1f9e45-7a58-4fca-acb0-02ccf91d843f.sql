-- Create referral_registrations table to track registration requests
CREATE TABLE public.referral_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  note text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Referral registrations are publicly insertable"
ON public.referral_registrations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Referral registrations viewable by email"
ON public.referral_registrations FOR SELECT
USING (true);

CREATE POLICY "Admins can update referral registrations"
ON public.referral_registrations FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete referral registrations"
ON public.referral_registrations FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_referral_registrations_updated_at
BEFORE UPDATE ON public.referral_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for email lookup
CREATE INDEX idx_referral_registrations_email ON public.referral_registrations(email);
CREATE INDEX idx_referral_registrations_status ON public.referral_registrations(status);