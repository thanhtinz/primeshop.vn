-- RPC function để mua item từ shop (avatar frame, name color, prime effect)
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_user_id uuid,
  p_item_type text,
  p_item_id uuid,
  p_item_name text,
  p_price numeric,
  p_recipient_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_actual_recipient_id uuid;
  v_is_gift boolean;
BEGIN
  -- Determine recipient (gift or self purchase)
  v_actual_recipient_id := COALESCE(p_recipient_user_id, p_user_id);
  v_is_gift := p_recipient_user_id IS NOT NULL AND p_recipient_user_id != p_user_id;

  -- Lock and get current balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_balance < p_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Check if recipient already owns this item
  IF p_item_type = 'avatar_frame' THEN
    IF EXISTS (SELECT 1 FROM user_avatar_frames WHERE user_id = v_actual_recipient_id AND frame_id = p_item_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already owns this item');
    END IF;
  ELSIF p_item_type = 'name_color' THEN
    IF EXISTS (SELECT 1 FROM user_name_colors WHERE user_id = v_actual_recipient_id AND color_id = p_item_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already owns this item');
    END IF;
  ELSIF p_item_type = 'prime_effect' THEN
    IF EXISTS (SELECT 1 FROM user_prime_effects WHERE user_id = v_actual_recipient_id AND effect_id = p_item_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Already owns this item');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid item type');
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_price;

  -- Deduct balance
  UPDATE profiles
  SET balance = v_new_balance
  WHERE user_id = p_user_id;

  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_user_id, 'payment', -p_price, v_current_balance, v_new_balance,
    p_item_type, p_item_id::text,
    CASE WHEN v_is_gift THEN 'Tặng ' ELSE 'Mua ' END || p_item_name,
    'completed'
  );

  -- Add item to recipient
  IF p_item_type = 'avatar_frame' THEN
    INSERT INTO user_avatar_frames (user_id, frame_id) VALUES (v_actual_recipient_id, p_item_id);
  ELSIF p_item_type = 'name_color' THEN
    INSERT INTO user_name_colors (user_id, color_id) VALUES (v_actual_recipient_id, p_item_id);
  ELSIF p_item_type = 'prime_effect' THEN
    INSERT INTO user_prime_effects (user_id, effect_id) VALUES (v_actual_recipient_id, p_item_id);
  END IF;

  -- Log purchase history
  INSERT INTO item_shop_purchases (user_id, item_type, item_id, item_name, price, is_gift, recipient_id)
  VALUES (p_user_id, p_item_type, p_item_id, p_item_name, p_price, v_is_gift, 
          CASE WHEN v_is_gift THEN v_actual_recipient_id ELSE NULL END);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'is_gift', v_is_gift
  );
END;
$$;

-- RPC function để chuyển tiền từ seller wallet sang user wallet
CREATE OR REPLACE FUNCTION public.transfer_seller_to_web_balance(
  p_seller_id uuid,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_balance numeric;
  v_seller_user_id uuid;
  v_new_seller_balance numeric;
  v_user_balance numeric;
  v_new_user_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Lock seller row and get balance
  SELECT balance, user_id INTO v_seller_balance, v_seller_user_id
  FROM sellers
  WHERE id = p_seller_id
  FOR UPDATE;

  IF v_seller_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;

  IF v_seller_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient seller balance');
  END IF;

  -- Lock and get user balance
  SELECT balance INTO v_user_balance
  FROM profiles
  WHERE user_id = v_seller_user_id
  FOR UPDATE;

  IF v_user_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Calculate new balances
  v_new_seller_balance := v_seller_balance - p_amount;
  v_new_user_balance := v_user_balance + p_amount;

  -- Update seller balance
  UPDATE sellers
  SET balance = v_new_seller_balance
  WHERE id = p_seller_id;

  -- Update user balance
  UPDATE profiles
  SET balance = v_new_user_balance
  WHERE user_id = v_seller_user_id;

  -- Log seller wallet transaction
  INSERT INTO seller_wallet_transactions (
    seller_id, type, amount, balance_before, balance_after,
    reference_type, note, status
  ) VALUES (
    p_seller_id, 'withdrawal', -p_amount, v_seller_balance, v_new_seller_balance,
    'transfer_to_web', 'Chuyển sang số dư website', 'completed'
  );

  -- Log user wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    v_seller_user_id, 'transfer_in', p_amount, v_user_balance, v_new_user_balance,
    'seller_transfer', p_seller_id::text, 'Nhận từ ví shop', 'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_seller_balance', v_new_seller_balance,
    'new_user_balance', v_new_user_balance
  );
END;
$$;

-- RPC function cho SMM order với balance deduction
CREATE OR REPLACE FUNCTION public.create_smm_order_with_balance(
  p_user_id uuid,
  p_charge numeric,
  p_external_order_id text,
  p_service_id uuid,
  p_link text,
  p_quantity integer,
  p_order_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Lock and get current balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_balance < p_charge THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_charge;

  -- Deduct balance
  UPDATE profiles
  SET balance = v_new_balance
  WHERE user_id = p_user_id;

  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_user_id, 'payment', -p_charge, v_current_balance, v_new_balance,
    'smm_order', p_order_number, 'SMM Order: ' || p_order_number, 'completed'
  );

  -- Create SMM order
  INSERT INTO smm_orders (
    user_id, service_id, external_order_id, link, quantity, charge, status, order_number
  ) VALUES (
    p_user_id, p_service_id, p_external_order_id, p_link, p_quantity, p_charge, 'Pending', p_order_number
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'order_number', p_order_number
  );
END;
$$;

-- RPC function cho seller withdrawal với atomic deduction
CREATE OR REPLACE FUNCTION public.create_seller_fast_withdrawal(
  p_seller_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_bank_account text,
  p_bank_holder text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_fast_fee numeric;
  v_actual_amount numeric;
  v_withdrawal_id uuid;
BEGIN
  -- Calculate fees (2% for fast withdrawal)
  v_fast_fee := p_amount * 0.02;
  v_actual_amount := p_amount - v_fast_fee;

  -- Lock and get seller balance
  SELECT balance INTO v_current_balance
  FROM sellers
  WHERE id = p_seller_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Deduct balance
  UPDATE sellers
  SET balance = v_new_balance
  WHERE id = p_seller_id;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    seller_id, amount, actual_amount, bank_name, bank_account, bank_holder,
    withdrawal_type, fast_fee, status
  ) VALUES (
    p_seller_id, p_amount, v_actual_amount, p_bank_name, p_bank_account, p_bank_holder,
    'fast', v_fast_fee, 'pending'
  ) RETURNING id INTO v_withdrawal_id;

  -- Log seller wallet transaction
  INSERT INTO seller_wallet_transactions (
    seller_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_seller_id, 'withdrawal', -p_amount, v_current_balance, v_new_balance,
    'withdrawal_request', v_withdrawal_id::text, 'Rút tiền nhanh', 'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'new_balance', v_new_balance,
    'actual_amount', v_actual_amount
  );
END;
$$;

-- RPC function cho seller normal withdrawal
CREATE OR REPLACE FUNCTION public.create_seller_normal_withdrawal(
  p_seller_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_bank_account text,
  p_bank_holder text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_current_locked numeric;
  v_new_balance numeric;
  v_new_locked numeric;
  v_fee numeric;
  v_actual_amount numeric;
  v_withdrawal_id uuid;
BEGIN
  -- Calculate fees (1% for normal withdrawal)
  v_fee := p_amount * 0.01;
  v_actual_amount := p_amount - v_fee;

  -- Lock and get seller balance
  SELECT balance, COALESCE(locked_balance, 0) INTO v_current_balance, v_current_locked
  FROM sellers
  WHERE id = p_seller_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller not found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Calculate new balances (move to locked)
  v_new_balance := v_current_balance - p_amount;
  v_new_locked := v_current_locked + p_amount;

  -- Update balances
  UPDATE sellers
  SET balance = v_new_balance,
      locked_balance = v_new_locked
  WHERE id = p_seller_id;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    seller_id, amount, actual_amount, bank_name, bank_account, bank_holder,
    withdrawal_type, fast_fee, status
  ) VALUES (
    p_seller_id, p_amount, v_actual_amount, p_bank_name, p_bank_account, p_bank_holder,
    'normal', v_fee, 'pending'
  ) RETURNING id INTO v_withdrawal_id;

  -- Log seller wallet transaction
  INSERT INTO seller_wallet_transactions (
    seller_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_seller_id, 'withdrawal', -p_amount, v_current_balance, v_new_balance,
    'withdrawal_request', v_withdrawal_id::text, 'Rút tiền thường (đang chờ duyệt)', 'pending'
  );

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'new_balance', v_new_balance,
    'locked_amount', p_amount,
    'actual_amount', v_actual_amount
  );
END;
$$;