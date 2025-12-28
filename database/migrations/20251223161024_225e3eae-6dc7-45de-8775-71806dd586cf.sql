-- RPC function cho admin điều chỉnh balance user
CREATE OR REPLACE FUNCTION public.admin_adjust_user_balance(
  p_admin_user_id uuid,
  p_target_profile_id uuid,
  p_adjustment numeric,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_target_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = p_admin_user_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Lock and get target user balance
  SELECT balance, user_id INTO v_current_balance, v_target_user_id
  FROM profiles
  WHERE id = p_target_profile_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_adjustment;

  IF v_new_balance < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Balance cannot be negative');
  END IF;

  -- Update balance
  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_target_profile_id;

  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, note, status
  ) VALUES (
    v_target_user_id,
    CASE WHEN p_adjustment > 0 THEN 'admin_credit' ELSE 'admin_debit' END,
    p_adjustment,
    v_current_balance,
    v_new_balance,
    'admin_adjustment',
    COALESCE(p_reason, 'Điều chỉnh bởi admin'),
    'completed'
  );

  -- Log admin audit
  INSERT INTO admin_audit_logs (
    admin_user_id, action, table_name, record_id, details
  ) VALUES (
    p_admin_user_id,
    'adjust_balance',
    'profiles',
    p_target_profile_id::text,
    jsonb_build_object(
      'adjustment', p_adjustment,
      'old_balance', v_current_balance,
      'new_balance', v_new_balance,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'old_balance', v_current_balance,
    'new_balance', v_new_balance
  );
END;
$$;

-- RPC function cho withdraw seller to user balance (trong useMarketplace)
CREATE OR REPLACE FUNCTION public.withdraw_seller_to_user_balance(
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

  -- Create withdrawal request record
  INSERT INTO withdrawal_requests (
    seller_id, amount, bank_name, bank_account, bank_holder,
    withdrawal_type, status, processed_at
  ) VALUES (
    p_seller_id, p_amount, 'Số dư website', '-', '-',
    'balance', 'completed', now()
  );

  -- Log seller wallet transaction
  INSERT INTO seller_wallet_transactions (
    seller_id, type, amount, balance_before, balance_after,
    reference_type, note, status
  ) VALUES (
    p_seller_id, 'withdrawal', -p_amount, v_seller_balance, v_new_seller_balance,
    'withdraw_to_balance', 'Rút về số dư website', 'completed'
  );

  -- Log user wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    v_seller_user_id, 'transfer_in', p_amount, v_user_balance, v_new_user_balance,
    'seller_withdraw', p_seller_id::text, 'Nhận từ ví shop', 'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_seller_balance', v_new_seller_balance,
    'new_user_balance', v_new_user_balance
  );
END;
$$;