-- Create atomic function for system balance payment (for premium/topup products, SMM orders)
CREATE OR REPLACE FUNCTION public.pay_with_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reference_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_total_spent NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số tiền không hợp lệ');
  END IF;

  -- Get current balance with lock
  SELECT balance, COALESCE(total_spent, 0) 
  INTO v_current_balance, v_current_total_spent 
  FROM profiles 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;
  
  v_new_balance := v_current_balance - p_amount;
  
  -- Deduct balance and update total_spent
  UPDATE profiles 
  SET balance = v_new_balance,
      total_spent = v_current_total_spent + p_amount
  WHERE user_id = p_user_id;
  
  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  )
  VALUES (
    p_user_id, 'payment', -p_amount, v_current_balance, v_new_balance,
    p_reference_type, p_reference_id, p_note, 'completed'
  );
  
  -- Update VIP level
  PERFORM update_user_vip_level(p_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'amount_paid', p_amount
  );
END;
$$;

-- Create atomic function for SMM order with balance payment
CREATE OR REPLACE FUNCTION public.create_smm_order_atomic(
  p_user_id UUID,
  p_amount_vnd NUMERIC,
  p_service_id UUID,
  p_external_order_id TEXT,
  p_link TEXT,
  p_quantity INTEGER,
  p_charge_usd NUMERIC,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_total_spent NUMERIC;
  v_new_balance NUMERIC;
  v_order_id UUID;
BEGIN
  -- Validate amount
  IF p_amount_vnd <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số tiền không hợp lệ');
  END IF;

  -- Get current balance with lock
  SELECT balance, COALESCE(total_spent, 0) 
  INTO v_current_balance, v_current_total_spent 
  FROM profiles 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  IF v_current_balance < p_amount_vnd THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;
  
  v_new_balance := v_current_balance - p_amount_vnd;
  
  -- Deduct balance and update total_spent
  UPDATE profiles 
  SET balance = v_new_balance,
      total_spent = v_current_total_spent + p_amount_vnd
  WHERE user_id = p_user_id;
  
  -- Create SMM order
  INSERT INTO smm_orders (
    user_id, service_id, external_order_id, link, quantity, charge, status
  )
  VALUES (
    p_user_id, p_service_id, p_external_order_id, p_link, p_quantity, p_charge_usd, 'Pending'
  )
  RETURNING id INTO v_order_id;
  
  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  )
  VALUES (
    p_user_id, 'payment', -p_amount_vnd, v_current_balance, v_new_balance,
    'smm_order', v_order_id, COALESCE(p_note, 'Đơn SMM'), 'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'new_balance', v_new_balance,
    'amount_paid', p_amount_vnd
  );
END;
$$;

-- Create atomic function for refund SMM order
CREATE OR REPLACE FUNCTION public.refund_smm_order(
  p_user_id UUID,
  p_order_id UUID,
  p_refund_amount_vnd NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_total_spent NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Validate amount
  IF p_refund_amount_vnd <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số tiền hoàn không hợp lệ');
  END IF;

  -- Get current balance with lock
  SELECT balance, COALESCE(total_spent, 0) 
  INTO v_current_balance, v_current_total_spent 
  FROM profiles 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản');
  END IF;
  
  v_new_balance := v_current_balance + p_refund_amount_vnd;
  
  -- Add balance and reduce total_spent
  UPDATE profiles 
  SET balance = v_new_balance,
      total_spent = GREATEST(0, v_current_total_spent - p_refund_amount_vnd)
  WHERE user_id = p_user_id;
  
  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  )
  VALUES (
    p_user_id, 'refund', p_refund_amount_vnd, v_current_balance, v_new_balance,
    'smm_order', p_order_id, COALESCE(p_reason, 'Hoàn tiền đơn SMM'), 'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'refund_amount', p_refund_amount_vnd
  );
END;
$$;