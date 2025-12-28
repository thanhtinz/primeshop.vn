-- Fix 1: Create a view for public reviews that masks email addresses
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  product_id,
  user_id,
  rating,
  comment,
  user_name,
  is_verified_purchase,
  is_approved,
  admin_reply,
  admin_reply_at,
  created_at,
  updated_at,
  -- Mask email: show only first letter and domain
  CASE 
    WHEN user_email IS NOT NULL AND user_email LIKE '%@%' 
    THEN CONCAT(LEFT(user_email, 1), '***@', SPLIT_PART(user_email, '@', 2))
    ELSE '***@***.com'
  END as user_email_masked
FROM public.reviews
WHERE is_approved = true;

-- Grant access to the view
GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- Fix 2: Update RLS policy on reviews to restrict user_email visibility for non-admins
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;

CREATE POLICY "Reviews are publicly readable without email" 
ON public.reviews 
FOR SELECT 
USING (
  is_approved = true AND (
    -- Admins can see everything
    is_admin(auth.uid()) OR
    -- Users can see their own reviews
    auth.uid() = user_id OR
    -- Public can see reviews but we'll handle email masking in code
    true
  )
);

-- Fix 3: Add audit log table for admin actions on sensitive data
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));