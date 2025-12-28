-- ============================================
-- DESIGN ORDER ESCROW SYSTEM - COMPLETE REFACTOR
-- ============================================

-- 1. Function: Create design order with atomic transaction
CREATE OR REPLACE FUNCTION public.create_design_order_with_escrow(
  p_service_id UUID,
  p_seller_id UUID,
  p_amount NUMERIC,
  p_platform_fee_rate NUMERIC,
  p_platform_fee NUMERIC,
  p_seller_amount NUMERIC,
  p_requirement_text TEXT DEFAULT NULL,
  p_requirement_colors TEXT DEFAULT NULL,
  p_requirement_style TEXT DEFAULT NULL,
  p_requirement_size TEXT DEFAULT NULL,
  p_requirement_purpose TEXT DEFAULT NULL,
  p_requirement_notes TEXT DEFAULT NULL,
  p_reference_files TEXT[] DEFAULT NULL,
  p_voucher_code TEXT DEFAULT NULL,
  p_voucher_discount NUMERIC DEFAULT 0,
  p_original_amount NUMERIC DEFAULT NULL,
  p_license_type_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_service RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_deadline TIMESTAMP WITH TIME ZONE;
  v_new_balance NUMERIC;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;
  
  -- Get buyer profile and balance
  SELECT id, balance INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  IF v_profile.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ để thanh toán');
  END IF;
  
  -- Get service for delivery days
  SELECT delivery_days INTO v_service
  FROM design_services
  WHERE id = p_service_id;
  
  v_deadline := NOW() + (COALESCE(v_service.delivery_days, 3) || ' days')::INTERVAL;
  
  -- Calculate new balance
  v_new_balance := v_profile.balance - p_amount;
  
  -- Deduct balance from buyer
  UPDATE profiles
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Generate order number
  v_order_number := 'DS' || to_char(NOW(), 'YYMMDD') || lpad(floor(random() * 100000)::text, 5, '0');
  
  -- Create the order
  INSERT INTO design_orders (
    order_number,
    service_id,
    seller_id,
    buyer_id,
    amount,
    platform_fee_rate,
    platform_fee,
    seller_amount,
    requirement_text,
    requirement_colors,
    requirement_style,
    requirement_size,
    requirement_purpose,
    requirement_notes,
    reference_files,
    voucher_code,
    voucher_discount,
    original_amount,
    license_type_id,
    deadline,
    status,
    escrow_status
  ) VALUES (
    v_order_number,
    p_service_id,
    p_seller_id,
    v_user_id,
    p_amount,
    p_platform_fee_rate,
    p_platform_fee,
    p_seller_amount,
    p_requirement_text,
    p_requirement_colors,
    p_requirement_style,
    p_requirement_size,
    p_requirement_purpose,
    p_requirement_notes,
    p_reference_files,
    p_voucher_code,
    p_voucher_discount,
    p_original_amount,
    p_license_type_id,
    v_deadline,
    'pending_accept',
    'held'
  )
  RETURNING id INTO v_order_id;
  
  -- Record wallet transaction for buyer (escrow payment)
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
    -p_amount,
    v_profile.balance,
    v_new_balance,
    'design_order',
    v_order_id,
    'Thanh toán đơn thiết kế #' || v_order_number,
    'completed'
  );
  
  -- Update seller pending balance
  UPDATE sellers
  SET pending_balance = COALESCE(pending_balance, 0) + p_seller_amount,
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
    p_seller_amount,
    COALESCE(pending_balance, 0) - p_seller_amount,
    COALESCE(pending_balance, 0),
    v_order_id,
    'design_order',
    'Tiền giữ đơn thiết kế #' || v_order_number,
    'pending'
  FROM sellers WHERE id = p_seller_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order_id,
    'order_number', v_order_number
  );
END;
$$;

-- 2. Function: Release escrow to seller (called when escrow_release_at passes)
CREATE OR REPLACE FUNCTION public.release_design_escrow_to_seller(p_order_id UUID)
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
  FROM design_orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF v_order.escrow_status = 'released' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Đã release trước đó');
  END IF;
  
  IF v_order.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đơn hàng chưa hoàn thành');
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
    design_total_revenue = COALESCE(design_total_revenue, 0) + v_order.seller_amount,
    design_completed_orders = COALESCE(design_completed_orders, 0) + 1,
    updated_at = NOW()
  WHERE id = v_order.seller_id;
  
  -- Update order escrow status
  UPDATE design_orders
  SET escrow_status = 'released', updated_at = NOW()
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
    'design_order',
    'Nhận tiền đơn thiết kế #' || v_order.order_number,
    'completed'
  );
  
  -- Log audit
  INSERT INTO design_audit_logs (order_id, action, action_category, metadata)
  VALUES (
    p_order_id,
    'escrow_released_to_seller',
    'escrow',
    jsonb_build_object(
      'seller_id', v_order.seller_id,
      'amount', v_order.seller_amount,
      'released_at', NOW()
    )
  );
  
  RETURN jsonb_build_object('success', true, 'amount', v_order.seller_amount);
END;
$$;

-- 3. Function: Refund to buyer
CREATE OR REPLACE FUNCTION public.refund_design_order_to_buyer(
  p_order_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
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
  v_new_balance NUMERIC;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM design_orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF v_order.escrow_status = 'refunded' THEN
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
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Reduce seller pending balance
  IF v_seller IS NOT NULL THEN
    UPDATE sellers
    SET 
      pending_balance = GREATEST(0, COALESCE(pending_balance, 0) - v_order.seller_amount),
      updated_at = NOW()
    WHERE id = v_order.seller_id;
    
    -- Record seller wallet transaction (cancelled)
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
      'design_order',
      'Hoàn tiền đơn thiết kế #' || v_order.order_number,
      'completed'
    );
  END IF;
  
  -- Update order
  UPDATE design_orders
  SET 
    escrow_status = 'refunded',
    dispute_resolution = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_order_id;
  
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
    'design_order',
    p_order_id,
    'Hoàn tiền đơn thiết kế #' || v_order.order_number || COALESCE(' - ' || p_reason, ''),
    'completed'
  );
  
  -- Log audit
  INSERT INTO design_audit_logs (order_id, action, action_category, metadata)
  VALUES (
    p_order_id,
    'refunded_to_buyer',
    'escrow',
    jsonb_build_object(
      'buyer_id', v_order.buyer_id,
      'amount', v_order.amount,
      'reason', p_reason,
      'refunded_at', NOW()
    )
  );
  
  RETURN jsonb_build_object('success', true, 'amount', v_order.amount);
END;
$$;

-- 4. Updated auto release function - now actually transfers money
CREATE OR REPLACE FUNCTION public.auto_release_design_escrow()
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
    FROM design_orders
    WHERE status = 'completed'
    AND escrow_status IN ('held', 'holding')
    AND escrow_release_at IS NOT NULL
    AND escrow_release_at <= NOW()
  LOOP
    -- Release each order
    v_result := release_design_escrow_to_seller(v_order.id);
    
    -- Log any errors
    IF NOT (v_result->>'success')::boolean THEN
      INSERT INTO design_audit_logs (order_id, action, action_category, metadata)
      VALUES (
        v_order.id,
        'auto_release_failed',
        'escrow',
        jsonb_build_object('error', v_result->>'error')
      );
    END IF;
  END LOOP;
END;
$$;

-- 5. Function for admin to resolve disputes
CREATE OR REPLACE FUNCTION public.resolve_design_dispute(
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
  SELECT * INTO v_order FROM design_orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF p_action = 'seller' THEN
    -- Release to seller
    v_result := release_design_escrow_to_seller(p_order_id);
    
    IF (v_result->>'success')::boolean THEN
      UPDATE design_orders
      SET 
        status = 'completed',
        dispute_resolved_at = NOW(),
        dispute_resolution = p_resolution_notes,
        updated_at = NOW()
      WHERE id = p_order_id;
    END IF;
    
  ELSIF p_action = 'buyer' THEN
    -- Refund to buyer
    v_result := refund_design_order_to_buyer(p_order_id, 'Dispute resolved in favor of buyer', p_resolution_notes);
    
    IF (v_result->>'success')::boolean THEN
      UPDATE design_orders
      SET 
        status = 'refunded',
        dispute_resolved_at = NOW(),
        dispute_resolution = p_resolution_notes,
        updated_at = NOW()
      WHERE id = p_order_id;
    END IF;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Action không hợp lệ');
  END IF;
  
  -- Log admin action
  INSERT INTO admin_audit_logs (admin_user_id, action, table_name, record_id, details)
  VALUES (
    v_admin_id,
    'resolve_dispute',
    'design_orders',
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

-- 6. Function to cancel order and refund (before work starts)
CREATE OR REPLACE FUNCTION public.cancel_design_order(
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
  v_user_id UUID;
  v_is_buyer BOOLEAN;
  v_is_seller BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  SELECT * INTO v_order FROM design_orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  -- Check permissions
  v_is_buyer := v_order.buyer_id = v_user_id;
  v_is_seller := EXISTS (SELECT 1 FROM sellers WHERE id = v_order.seller_id AND user_id = v_user_id);
  
  IF NOT v_is_buyer AND NOT v_is_seller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền hủy đơn');
  END IF;
  
  -- Can only cancel pending orders
  IF v_order.status NOT IN ('pending_accept', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không thể hủy đơn đang thực hiện');
  END IF;
  
  -- Refund to buyer
  PERFORM refund_design_order_to_buyer(p_order_id, p_reason, 'Order cancelled');
  
  -- Update order status
  UPDATE design_orders
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Đã hủy đơn và hoàn tiền');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_design_order_with_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_design_escrow_to_seller TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_design_order_to_buyer TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_design_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_design_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_release_design_escrow TO authenticated;