-- Create atomic function for completing deposit
CREATE OR REPLACE FUNCTION public.complete_deposit_transaction(
  p_deposit_id UUID,
  p_transaction_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
  v_profile RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Lock and get deposit
  SELECT * INTO v_deposit
  FROM deposit_transactions
  WHERE id = p_deposit_id
  FOR UPDATE;
  
  IF v_deposit IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy giao dịch nạp tiền');
  END IF;
  
  IF v_deposit.status = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Đã xử lý trước đó', 'already_processed', true);
  END IF;
  
  -- Get user profile with lock
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_deposit.user_id
  FOR UPDATE;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản người dùng');
  END IF;
  
  v_new_balance := COALESCE(v_profile.balance, 0) + v_deposit.amount;
  
  -- Update deposit status
  UPDATE deposit_transactions
  SET 
    status = 'completed',
    payment_data = COALESCE(payment_data, '{}'::jsonb) || COALESCE(p_transaction_data, '{}'::jsonb) || 
      jsonb_build_object('completed_at', NOW()),
    updated_at = NOW()
  WHERE id = p_deposit_id;
  
  -- Update user balance
  UPDATE profiles
  SET 
    balance = v_new_balance,
    updated_at = NOW()
  WHERE id = v_profile.id;
  
  -- Log wallet transaction
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
    v_deposit.user_id,
    'deposit',
    v_deposit.amount,
    v_profile.balance,
    v_new_balance,
    'deposit',
    p_deposit_id,
    'Nạp tiền qua ' || COALESCE(v_deposit.payment_provider, 'PayOS'),
    'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount', v_deposit.amount,
    'new_balance', v_new_balance,
    'user_id', v_deposit.user_id,
    'email', v_profile.email
  );
END;
$$;