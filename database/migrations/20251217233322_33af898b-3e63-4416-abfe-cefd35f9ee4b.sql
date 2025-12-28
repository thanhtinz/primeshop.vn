-- Drop the security definer view and use regular view instead
DROP VIEW IF EXISTS public.reviews_public;

-- Create a regular view without security definer (inherits caller's permissions)
CREATE VIEW public.reviews_public 
WITH (security_invoker = true)
AS
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
  CASE 
    WHEN user_email IS NOT NULL AND user_email LIKE '%@%' 
    THEN CONCAT(LEFT(user_email, 1), '***@', SPLIT_PART(user_email, '@', 2))
    ELSE '***@***.com'
  END as user_email_masked
FROM public.reviews
WHERE is_approved = true;

GRANT SELECT ON public.reviews_public TO anon, authenticated;