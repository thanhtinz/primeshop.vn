-- Add policy for public to view completed/delivered orders (for recent transactions display)
CREATE POLICY "Public can view completed orders for transactions display" 
ON seller_orders 
FOR SELECT 
USING (status IN ('completed', 'delivered'));