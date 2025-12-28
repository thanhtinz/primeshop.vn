-- Add public read policy for orders (leaderboard needs to aggregate spending)
CREATE POLICY "Public can read orders for leaderboard" 
ON public.orders 
FOR SELECT 
USING (true);

-- Add public read policy for profiles (display names/avatars on leaderboard and reviews)
CREATE POLICY "Public can read profile display info" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add public read policy for smm_orders (leaderboard needs to aggregate spending)
CREATE POLICY "Public can read smm_orders for leaderboard" 
ON public.smm_orders 
FOR SELECT 
USING (true);