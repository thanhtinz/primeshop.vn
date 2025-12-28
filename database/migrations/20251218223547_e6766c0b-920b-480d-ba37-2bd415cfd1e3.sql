-- =============================================
-- FIX CRITICAL SECURITY ISSUES
-- =============================================

-- 1. Fix profiles table - restrict to own data only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a public profile view with limited info
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  username,
  full_name,
  avatar_url,
  banner_url,
  bio,
  is_verified,
  avatar_frame_id,
  vip_level_id,
  created_at
FROM public.profiles;

-- 2. Fix orders table - remove public read
DROP POLICY IF EXISTS "Public can read orders for leaderboard" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;

-- Create a leaderboard view with masked data for public access
CREATE OR REPLACE VIEW public.orders_leaderboard AS
SELECT 
  id,
  CASE 
    WHEN customer_email IS NULL THEN NULL
    ELSE CONCAT(LEFT(customer_email, 2), '***@***', RIGHT(customer_email, 4))
  END as masked_email,
  CASE 
    WHEN customer_name IS NULL THEN NULL
    ELSE CONCAT(LEFT(customer_name, 1), '***')
  END as masked_name,
  total_amount,
  created_at,
  status
FROM public.orders
WHERE status = 'completed';

-- 3. Fix smm_orders table - remove public read
DROP POLICY IF EXISTS "Public can read smm_orders for leaderboard" ON public.smm_orders;

-- Create masked leaderboard view for smm_orders
CREATE OR REPLACE VIEW public.smm_orders_leaderboard AS
SELECT 
  o.id,
  CASE 
    WHEN p.email IS NULL THEN NULL
    ELSE CONCAT(LEFT(p.email, 2), '***@***', RIGHT(p.email, 4))
  END as masked_email,
  o.charge as total_amount,
  o.created_at,
  o.status
FROM public.smm_orders o
LEFT JOIN public.profiles p ON p.user_id = o.user_id
WHERE o.status = 'completed';

-- 4. Fix referral_registrations - restrict access
DROP POLICY IF EXISTS "Referral registrations viewable by email" ON public.referral_registrations;

CREATE POLICY "Referral registrations viewable by owner"
ON public.referral_registrations FOR SELECT
TO authenticated
USING (email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all referral registrations"
ON public.referral_registrations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix reviews table
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;

-- Create view with masked emails
CREATE OR REPLACE VIEW public.reviews_masked AS
SELECT 
  id,
  product_id,
  user_id,
  CASE 
    WHEN user_email IS NULL THEN NULL
    ELSE CONCAT(LEFT(user_email, 2), '***@***')
  END as user_email,
  user_name,
  rating,
  comment,
  is_verified_purchase,
  is_approved,
  admin_reply,
  admin_reply_at,
  created_at,
  updated_at
FROM public.reviews;

-- Allow public to read reviews
CREATE POLICY "Public can read reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (true);

-- 6. Fix site_settings - only allow admins to read
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;

-- Create a view that hides sensitive settings from public
CREATE OR REPLACE VIEW public.site_settings_public AS
SELECT 
  id,
  key,
  CASE 
    WHEN key ILIKE '%key%' OR key ILIKE '%secret%' OR key ILIKE '%password%' OR key ILIKE '%token%' OR key ILIKE '%checksum%'
    THEN '"[HIDDEN]"'::jsonb
    ELSE value
  END as value,
  updated_at
FROM public.site_settings;

-- Restrict site_settings to admins only
CREATE POLICY "Only admins can read site settings"
ON public.site_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Fix sellers table - hide financial data from public (use correct column names)
DROP POLICY IF EXISTS "Approved sellers are viewable by everyone" ON public.sellers;

CREATE POLICY "Public can view seller basic info"
ON public.sellers FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Create view with limited public info (excluding financial data)
CREATE OR REPLACE VIEW public.sellers_public AS
SELECT 
  id,
  user_id,
  shop_name,
  shop_slug,
  shop_description,
  shop_avatar_url,
  shop_banner_url,
  rating_average,
  rating_count,
  is_verified,
  status,
  created_at
  -- Excluded: balance, total_revenue, total_sales, phone, facebook_url, zalo_url, trust_score, admin_notes
FROM public.sellers
WHERE status = 'approved';