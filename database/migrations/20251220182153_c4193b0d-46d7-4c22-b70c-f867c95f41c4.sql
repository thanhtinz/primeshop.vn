-- First drop the existing view if it exists
DROP VIEW IF EXISTS public.profiles_public;

-- Fix 1: Remove overly permissive policy on profiles
DROP POLICY IF EXISTS "Public can read profile display info" ON public.profiles;

-- Create a view for public profile info (only safe fields - no email, phone, balance, etc)
CREATE VIEW public.profiles_public AS
SELECT 
  user_id,
  username,
  full_name,
  avatar_url,
  avatar_frame_id,
  active_name_color_id,
  active_effect_id,
  bio,
  banner_url,
  has_prime_boost,
  prime_expires_at,
  is_verified,
  is_online,
  last_seen
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Fix 2: Recreate more restrictive policies for account_handovers
DROP POLICY IF EXISTS "Buyers can view own handovers" ON public.account_handovers;
DROP POLICY IF EXISTS "Buyers can update checklist" ON public.account_handovers;

CREATE POLICY "Buyers can view own handovers" 
ON public.account_handovers 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own handovers" 
ON public.account_handovers 
FOR UPDATE 
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);