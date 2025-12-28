-- Fix 1: Drop the permissive policy that exposes all profiles publicly
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Fix 2: Create proper RLS policies for profiles table
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can view basic public info of others via profiles_public view (already exists)
-- This is the safe way to expose limited profile data

-- Fix 3: Restrict site_settings to admins only (ensure policy exists)
DROP POLICY IF EXISTS "Only admins can read site settings" ON public.site_settings;
CREATE POLICY "Only admins can read site settings" 
ON public.site_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 4: Add policy for site_settings_public view for non-sensitive settings
-- (The view already masks sensitive values)

-- Fix 5: Add encryption flag comment for account_handovers
COMMENT ON COLUMN public.account_handovers.account_password IS 'SECURITY: Should be encrypted at application layer before storage';
COMMENT ON COLUMN public.account_handovers.email_password IS 'SECURITY: Should be encrypted at application layer before storage';
COMMENT ON COLUMN public.account_handovers.recovery_info IS 'SECURITY: Should be encrypted at application layer before storage';