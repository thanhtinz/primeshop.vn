-- Drop existing RLS policies on admin_users that cause recursion
DROP POLICY IF EXISTS "Admin users can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin users" ON public.admin_users;

-- Create a security definer function to check if user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Create new RLS policies that allow authenticated users to check their own admin status
CREATE POLICY "Users can view their own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only super admins can manage other admin users
CREATE POLICY "Super admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert admin users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);