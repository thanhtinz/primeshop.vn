-- Create atomic RPC function to purchase revision package with proper escrow handling
CREATE OR REPLACE FUNCTION purchase_design_revision_package(
  p_order_id UUID,
  p_quantity INT,
  p_price_per_revision NUMERIC
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_order RECORD;
  v_total_price NUMERIC;
  v_new_balance NUMERIC;
  v_package_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;
  
  -- Calculate total price
  v_total_price := p_quantity * p_price_per_revision;
  
  -- Get buyer profile and balance with lock
  SELECT id, balance INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  IF v_profile.balance < v_total_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ để thanh toán');
  END IF;
  
  -- Get order to verify buyer owns it
  SELECT * INTO v_order FROM design_orders WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  IF v_order.buyer_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không phải buyer của đơn này');
  END IF;
  
  IF v_order.status NOT IN ('pending_accept', 'in_progress', 'revision_requested', 'delivered') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không thể mua thêm revision cho đơn đã hoàn tất/hủy');
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_profile.balance - v_total_price;
  
  -- Deduct balance from buyer
  UPDATE profiles
  SET balance = v_new_balance, updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Create revision package
  INSERT INTO design_revision_packages (
    order_id,
    buyer_id,
    seller_id,
    quantity,
    price_per_revision,
    total_price,
    escrow_status,
    purchased_at
  ) VALUES (
    p_order_id,
    v_user_id,
    v_order.seller_id,
    p_quantity,
    p_price_per_revision,
    v_total_price,
    'held',
    NOW()
  )
  RETURNING id INTO v_package_id;
  
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
    -v_total_price,
    v_profile.balance,
    v_new_balance,
    'design_revision',
    v_package_id,
    'Mua thêm ' || p_quantity || ' lượt chỉnh sửa cho đơn #' || v_order.order_number,
    'completed'
  );
  
  -- Update order extra_revisions_purchased count
  UPDATE design_orders
  SET 
    extra_revisions_purchased = COALESCE(extra_revisions_purchased, 0) + p_quantity,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Update seller pending balance
  UPDATE sellers
  SET pending_balance = pending_balance + v_total_price
  WHERE id = v_order.seller_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'package_id', v_package_id,
    'total_price', v_total_price,
    'new_balance', v_new_balance
  );
END;
$$;