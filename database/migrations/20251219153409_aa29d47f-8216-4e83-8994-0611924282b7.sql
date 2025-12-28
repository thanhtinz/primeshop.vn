-- Add UPDATE policy for admins to modify daily checkin settings
CREATE POLICY "Admins can update checkin settings" 
ON public.daily_checkin_settings 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Also add INSERT and DELETE policies for completeness
CREATE POLICY "Admins can insert checkin settings" 
ON public.daily_checkin_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete checkin settings" 
ON public.daily_checkin_settings 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);