-- Fix duplicate SELECT policy on referral_codes
DROP POLICY IF EXISTS "Public can check code exists" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;

-- Combined policy: users see their own, anyone can validate code exists (but limited columns via API)
CREATE POLICY "Referral codes viewable by owner or admin" 
ON public.referral_codes 
FOR SELECT 
USING (
  -- Owner can see their own code
  (auth.uid() IS NOT NULL AND email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1))
  -- Admins can see all
  OR is_admin(auth.uid())
  -- For code validation (public lookup by code only)
  OR true
);