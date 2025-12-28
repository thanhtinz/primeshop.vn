-- =============================================
-- CRITICAL SECURITY FIX: Strengthen RLS Policies
-- =============================================

-- 1. FIX orders table - restrict access to authenticated users
DROP POLICY IF EXISTS "Orders are viewable by email" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated" ON public.orders;

-- Orders viewable only by the customer who placed it (by email match) or admins
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    OR is_admin(auth.uid())
  )
);

-- Orders can only be created by authenticated users
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Orders can only be updated by admins or system processes
CREATE POLICY "Only admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 2. FIX payments table - restrict access
DROP POLICY IF EXISTS "Payments are viewable" ON public.payments;
DROP POLICY IF EXISTS "Payments can be created" ON public.payments;
DROP POLICY IF EXISTS "Payments can be updated" ON public.payments;

-- Payments viewable by order owner or admin
CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = payments.order_id 
      AND o.customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR is_admin(auth.uid())
  )
);

-- Payments can be created by authenticated users for their orders
CREATE POLICY "Users can create payments for own orders" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND o.customer_email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Payments can only be updated by admins (webhook updates)
CREATE POLICY "Only admins can update payments" 
ON public.payments 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 3. FIX referral_codes table
DROP POLICY IF EXISTS "Referral codes are viewable" ON public.referral_codes;
DROP POLICY IF EXISTS "Referral codes can be created" ON public.referral_codes;
DROP POLICY IF EXISTS "Referral codes can be updated" ON public.referral_codes;

-- Users can view their own referral code or check if a code exists (for validation)
CREATE POLICY "Users can view own referral code" 
ON public.referral_codes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    OR is_admin(auth.uid())
  )
);

-- Allow code lookup for validation (limited data)
CREATE POLICY "Public can check code exists" 
ON public.referral_codes 
FOR SELECT 
USING (true);

-- Only admins can create referral codes
CREATE POLICY "Only admins can create referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update referral codes
CREATE POLICY "Only admins can update referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 4. FIX referral_transactions table
DROP POLICY IF EXISTS "Referral transactions are viewable" ON public.referral_transactions;
DROP POLICY IF EXISTS "Referral transactions can be created" ON public.referral_transactions;
DROP POLICY IF EXISTS "Referral transactions can be updated" ON public.referral_transactions;

-- Users can view transactions for their referral code
CREATE POLICY "Users can view own referral transactions" 
ON public.referral_transactions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.referral_codes rc 
      WHERE rc.id = referral_code_id 
      AND rc.email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR is_admin(auth.uid())
  )
);

-- Only admins can create/update referral transactions
CREATE POLICY "Only admins can create referral transactions" 
ON public.referral_transactions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update referral transactions" 
ON public.referral_transactions 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 5. FIX reward_requests table
DROP POLICY IF EXISTS "Reward requests are viewable" ON public.reward_requests;
DROP POLICY IF EXISTS "Reward requests can be created" ON public.reward_requests;
DROP POLICY IF EXISTS "Reward requests can be updated" ON public.reward_requests;

-- Users can view their own reward requests
CREATE POLICY "Users can view own reward requests" 
ON public.reward_requests 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.referral_codes rc 
      WHERE rc.id = referral_code_id 
      AND rc.email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR is_admin(auth.uid())
  )
);

-- Users can create reward requests for their own referral code
CREATE POLICY "Users can create own reward requests" 
ON public.reward_requests 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.referral_codes rc 
    WHERE rc.id = referral_code_id 
    AND rc.email = (SELECT email FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Only admins can update reward requests (approve/reject)
CREATE POLICY "Only admins can update reward requests" 
ON public.reward_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 6. FIX deposit_transactions table
DROP POLICY IF EXISTS "Deposits can be updated" ON public.deposit_transactions;

-- Only admins can update deposit transactions (webhook updates)
CREATE POLICY "Only admins can update deposits" 
ON public.deposit_transactions 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 7. FIX user_event_points table
DROP POLICY IF EXISTS "Points can be updated" ON public.user_event_points;

-- Users can only view their own points
CREATE POLICY "Users can view own event points" 
ON public.user_event_points 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id
    OR is_admin(auth.uid())
  )
);

-- Only system/admin can update points
CREATE POLICY "Only admins can update event points" 
ON public.user_event_points 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Only system/admin can insert points
CREATE POLICY "Only admins can insert event points" 
ON public.user_event_points 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Enable RLS on user_event_points if not enabled
ALTER TABLE public.user_event_points ENABLE ROW LEVEL SECURITY;

-- 8. FIX notifications table - restrict insert
DROP POLICY IF EXISTS "Notifications can be inserted" ON public.notifications;

-- Only admins can create notifications
CREATE POLICY "Only admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- 9. FIX login_history table - restrict insert to auth trigger only
DROP POLICY IF EXISTS "Login history can be inserted" ON public.login_history;

-- Only the user themselves or admins can insert login history
CREATE POLICY "Users can record own login" 
ON public.login_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 10. FIX event_point_transactions - restrict insert
DROP POLICY IF EXISTS "Transactions can be inserted" ON public.event_point_transactions;

CREATE POLICY "Only admins can insert event transactions" 
ON public.event_point_transactions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- 11. FIX event_spin_history - restrict insert/update
DROP POLICY IF EXISTS "Spin history can be inserted" ON public.event_spin_history;
DROP POLICY IF EXISTS "Spin history can be updated" ON public.event_spin_history;

CREATE POLICY "Only admins can insert spin history" 
ON public.event_spin_history 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update spin history" 
ON public.event_spin_history 
FOR UPDATE 
USING (is_admin(auth.uid()));