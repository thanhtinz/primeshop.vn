-- Drop the old recursive policy that might still exist
DROP POLICY IF EXISTS "Admin users viewable by admins" ON public.admin_users;