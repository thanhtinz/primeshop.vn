-- Add policy for admins to view all sellers
CREATE POLICY "Admins can view all sellers" 
ON public.sellers 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- Add policy for admins to update sellers
CREATE POLICY "Admins can update sellers" 
ON public.sellers 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);