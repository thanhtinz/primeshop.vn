-- ============================================
-- SELLER ORDERS (GAME ACCOUNT) ESCROW SYSTEM
-- ============================================

-- 1. Function: Create seller order with atomic transaction
CREATE OR REPLACE FUNCTION public.create_seller_order_with_escrow(
  p_product_id UUID,
  p_seller_id UUID,
  p_amount NUMERIC,
  p_platform_fee_percent NUMERIC DEFAULT 5,
  p_voucher_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_product RECORD;
  v_seller RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_final_price NUMERIC;
  v_platform_fee NUMERIC;
  v_seller_amount NUMERIC;
  v_new_balance NUMERIC;
  v_escrow_release_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;
  
  -- Get product with lock
  SELECT * INTO v_product
  FROM seller_products
  WHERE id = p_product_id
  FOR UPDATE;
  
  IF v_product IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy sản phẩm');
  END IF;
  
  IF v_product.status = 'sold' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sản phẩm đã được bán');
  END IF;
  
  -- Check if buyer is the seller
  SELECT * INTO v_seller FROM sellers WHERE id = p_seller_id;
  IF v_seller.user_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không thể mua sản phẩm của chính mình');
  END IF;
  
  -- Check blacklist
  IF EXISTS (
    SELECT 1 FROM seller_buyer_blacklist 
    WHERE seller_id = p_seller_id AND buyer_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn đã bị shop này chặn');
  END IF;
  
  -- Get buyer profile with lock
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  -- Calculate prices
  v_final_price := GREATEST(0, p_amount - COALESCE(p_discount_amount, 0));
  v_platform_fee := v_final_price * (p_platform_fee_percent / 100);
  v_seller_amount := v_final_price - v_platform_fee;
  
  IF v_profile.balance < v_final_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_profile.balance - v_final_price;
  v_escrow_release_at := NOW() + INTERVAL '3 days';
  
  -- Deduct balance from buyer
  UPDATE profiles
  SET 
    balance = v_new_balance, 
    total_spent = COALESCE(total_spent, 0) + v_final_price,
    updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Generate order number
  v_order_number := 'MP' || to_char(NOW(), 'YYMMDD') || lpad(floor(random() * 100000)::text, 5, '0');
  
  -- Create the order
  INSERT INTO seller_orders (
    order_number,
    product_id,
    seller_id,
    buyer_id,
    buyer_email,
    amount,
    platform_fee,
    seller_amount,
    status,
    escrow_release_at,
    dispute_status,
    delivery_content,
    notes
  ) VALUES (
    v_order_number,
    p_product_id,
    p_seller_id,
    v_user_id,
    v_profile.email,
    v_final_price,
    v_platform_fee,
    v_seller_amount,
    'paid',
    v_escrow_release_at,
    'none',
    v_product.account_data,
    CASE WHEN p_voucher_code IS NOT NULL 
      THEN 'Voucher: ' || p_voucher_code || ', Giảm: ' || p_discount_amount 
      ELSE NULL 
    END
  )
  RETURNING id INTO v_order_id;
  
  -- Update product status
  UPDATE seller_products
  SET 
    status = 'sold',
    sold_at = NOW(),
    buyer_id = v_user_id,
    order_id = v_order_id,
    updated_at = NOW()
  WHERE id = p_product_id;
  
  -- Record wallet transaction for buyer
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference_type,
    reference_id,
    note,
    status
  ) VALUES (
    v_user_id,
    'payment',
    -v_final_price,
    v_profile.balance,
    v_new_balance,
    'seller_order',
    v_order_id,
    'Mua sản phẩm #' || v_order_number,
    'completed'
  );
  
  -- Update seller pending balance
  UPDATE sellers
  SET 
    pending_balance = COALESCE(pending_balance, 0) + v_seller_amount,
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  -- Record seller wallet transaction (pending)
  INSERT INTO seller_wallet_transactions (
    seller_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference_id,
    reference_type,
    note,
    status
  )
  SELECT 
    p_seller_id,
    'escrow_lock',
    v_seller_amount,
    COALESCE(pending_balance, 0) - v_seller_amount,
    COALESCE(pending_balance, 0),
    v_order_id,
    'seller_order',
    'Tiền giữ đơn #' || v_order_number,
    'pending'
  FROM sellers WHERE id = p_seller_id;
  
  -- Handle voucher usage
  IF p_voucher_code IS NOT NULL THEN
    -- Try seller voucher first
    UPDATE seller_vouchers
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE seller_id = p_seller_id AND code = p_voucher_code;
    
    -- Try system voucher if seller voucher not found
    IF NOT FOUND THEN
      UPDATE vouchers
      SET used_count = COALESCE(used_count, 0) + 1
      WHERE code = p_voucher_code;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order_id,
    'order_number', v_order_number,
    'delivery_content', v_product.account_data
  );
END;
$$;

-- 2. Function: Release escrow to seller for game orders
CREATE OR REPLACE FUNCTION public.release_seller_order_escrow(p_order_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_seller RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM seller_orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF v_order.released_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Đã release trước đó');
  END IF;
  
  IF v_order.status NOT IN ('paid', 'delivered', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đơn hàng chưa thanh toán');
  END IF;
  
  -- Get seller with lock
  SELECT * INTO v_seller
  FROM sellers
  WHERE id = v_order.seller_id
  FOR UPDATE;
  
  IF v_seller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy seller');
  END IF;
  
  -- Calculate new balances
  v_new_balance := COALESCE(v_seller.balance, 0) + v_order.seller_amount;
  
  -- Update seller balances
  UPDATE sellers
  SET 
    balance = v_new_balance,
    pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_order.seller_amount),
    total_revenue = COALESCE(total_revenue, 0) + v_order.seller_amount,
    total_sales = COALESCE(total_sales, 0) + 1,
    updated_at = NOW()
  WHERE id = v_order.seller_id;
  
  -- Update order
  UPDATE seller_orders
  SET 
    status = 'completed',
    released_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Record seller wallet transaction
  INSERT INTO seller_wallet_transactions (
    seller_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference_id,
    reference_type,
    note,
    status
  ) VALUES (
    v_order.seller_id,
    'escrow_release',
    v_order.seller_amount,
    COALESCE(v_seller.balance, 0),
    v_new_balance,
    p_order_id,
    'seller_order',
    'Nhận tiền đơn #' || v_order.order_number,
    'completed'
  );
  
  RETURN jsonb_build_object('success', true, 'amount', v_order.seller_amount);
END;
$$;

-- 3. Function: Refund seller order to buyer
CREATE OR REPLACE FUNCTION public.refund_seller_order_to_buyer(
  p_order_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_profile RECORD;
  v_seller RECORD;
  v_product RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM seller_orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF v_order.status = 'refunded' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Đã hoàn tiền trước đó');
  END IF;
  
  -- Get buyer profile with lock
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_order.buyer_id
  FOR UPDATE;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy buyer');
  END IF;
  
  -- Get seller with lock
  SELECT * INTO v_seller
  FROM sellers
  WHERE id = v_order.seller_id
  FOR UPDATE;
  
  -- Calculate new balance
  v_new_balance := COALESCE(v_profile.balance, 0) + v_order.amount;
  
  -- Refund to buyer
  UPDATE profiles
  SET 
    balance = v_new_balance, 
    total_spent = GREATEST(0, COALESCE(total_spent, 0) - v_order.amount),
    updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Reduce seller pending balance
  IF v_seller IS NOT NULL AND v_order.released_at IS NULL THEN
    UPDATE sellers
    SET 
      pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_order.seller_amount),
      updated_at = NOW()
    WHERE id = v_order.seller_id;
    
    -- Record seller wallet transaction
    INSERT INTO seller_wallet_transactions (
      seller_id,
      type,
      amount,
      balance_before,
      balance_after,
      reference_id,
      reference_type,
      note,
      status
    ) VALUES (
      v_order.seller_id,
      'refund',
      -v_order.seller_amount,
      COALESCE(v_seller.pending_balance, 0),
      GREATEST(0, COALESCE(v_seller.pending_balance, 0) - v_order.seller_amount),
      p_order_id,
      'seller_order',
      'Hoàn tiền đơn #' || v_order.order_number,
      'completed'
    );
  END IF;
  
  -- Update order status
  UPDATE seller_orders
  SET 
    status = 'refunded',
    dispute_status = 'resolved',
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Restore product status
  UPDATE seller_products
  SET 
    status = 'available',
    buyer_id = NULL,
    order_id = NULL,
    sold_at = NULL,
    updated_at = NOW()
  WHERE id = v_order.product_id;
  
  -- Record buyer wallet transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference_type,
    reference_id,
    note,
    status
  ) VALUES (
    v_order.buyer_id,
    'refund',
    v_order.amount,
    COALESCE(v_profile.balance, 0),
    v_new_balance,
    'seller_order',
    p_order_id,
    'Hoàn tiền đơn #' || v_order.order_number || COALESCE(' - ' || p_reason, ''),
    'completed'
  );
  
  RETURN jsonb_build_object('success', true, 'amount', v_order.amount);
END;
$$;

-- 4. Function: Auto release seller order escrow
CREATE OR REPLACE FUNCTION public.auto_release_seller_order_escrow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_result jsonb;
BEGIN
  -- Find all orders ready for release
  FOR v_order IN
    SELECT id
    FROM seller_orders
    WHERE status IN ('paid', 'delivered')
    AND released_at IS NULL
    AND dispute_status = 'none'
    AND escrow_release_at IS NOT NULL
    AND escrow_release_at <= NOW()
  LOOP
    -- Release each order
    v_result := release_seller_order_escrow(v_order.id);
  END LOOP;
END;
$$;

-- 5. Function: Resolve seller order dispute
CREATE OR REPLACE FUNCTION public.resolve_seller_order_dispute(
  p_order_id UUID,
  p_action TEXT, -- 'seller' or 'buyer'
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_result jsonb;
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_admin_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền admin');
  END IF;
  
  -- Get order
  SELECT * INTO v_order FROM seller_orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF p_action = 'seller' THEN
    -- Release to seller
    v_result := release_seller_order_escrow(p_order_id);
    
    IF (v_result->>'success')::boolean THEN
      UPDATE seller_orders
      SET 
        dispute_status = 'resolved',
        updated_at = NOW()
      WHERE id = p_order_id;
    END IF;
    
  ELSIF p_action = 'buyer' THEN
    -- Refund to buyer
    v_result := refund_seller_order_to_buyer(p_order_id, p_resolution_notes);
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Action không hợp lệ');
  END IF;
  
  -- Log admin action
  INSERT INTO admin_audit_logs (admin_user_id, action, table_name, record_id, details)
  VALUES (
    v_admin_id,
    'resolve_dispute',
    'seller_orders',
    p_order_id,
    jsonb_build_object(
      'action', p_action,
      'resolution', p_resolution_notes,
      'result', v_result
    )
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_seller_order_with_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_seller_order_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_seller_order_to_buyer TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_release_seller_order_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_seller_order_dispute TO authenticated;

-- Schedule cron job to auto-release seller orders escrow every hour
SELECT cron.schedule(
  'auto-release-seller-order-escrow',
  '30 * * * *', -- Every hour at minute 30
  'SELECT public.auto_release_seller_order_escrow()'
);