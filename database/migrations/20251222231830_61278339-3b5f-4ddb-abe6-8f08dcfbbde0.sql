-- Add policy to allow public viewing of completed design orders for shop display
CREATE POLICY "Public can view completed design orders for shop display"
ON public.design_orders
FOR SELECT
USING (status = 'completed' AND completed_at IS NOT NULL);