-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;

-- Recreate using the existing is_admin function
CREATE POLICY "Admins can view all sellers" 
ON public.sellers 
FOR SELECT 
USING (is_admin(auth.uid()));