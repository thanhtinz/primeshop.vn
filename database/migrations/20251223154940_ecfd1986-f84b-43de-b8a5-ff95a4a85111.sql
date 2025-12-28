-- Create atomic function for processing withdrawals
CREATE OR REPLACE FUNCTION public.process_seller_withdrawal(
  p_withdrawal_id UUID,
  p_status TEXT, -- 'completed' or 'rejected'
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_seller RECORD;
BEGIN
  -- Lock and get withdrawal
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;
  
  IF v_withdrawal IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy yêu cầu rút tiền');
  END IF;
  
  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yêu cầu đã được xử lý');
  END IF;
  
  -- Get seller with lock
  SELECT * INTO v_seller
  FROM sellers
  WHERE id = v_withdrawal.seller_id
  FOR UPDATE;
  
  IF v_seller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy seller');
  END IF;
  
  -- Update withdrawal status
  UPDATE withdrawal_requests
  SET 
    status = p_status,
    admin_notes = p_admin_notes,
    processed_at = NOW(),
    processed_by = p_admin_id
  WHERE id = p_withdrawal_id;
  
  -- If rejected, refund the balance to seller
  IF p_status = 'rejected' THEN
    UPDATE sellers
    SET 
      balance = balance + v_withdrawal.amount,
      updated_at = NOW()
    WHERE id = v_withdrawal.seller_id;
    
    -- Log transaction
    INSERT INTO seller_wallet_transactions (
      seller_id, type, amount, balance_before, balance_after,
      reference_type, reference_id, note, status
    ) VALUES (
      v_withdrawal.seller_id,
      'refund',
      v_withdrawal.amount,
      v_seller.balance,
      v_seller.balance + v_withdrawal.amount,
      'withdrawal',
      p_withdrawal_id,
      'Hoàn tiền rút tiền bị từ chối: ' || COALESCE(p_admin_notes, ''),
      'completed'
    );
  ELSE
    -- If completed, log the successful withdrawal
    INSERT INTO seller_wallet_transactions (
      seller_id, type, amount, balance_before, balance_after,
      reference_type, reference_id, note, status
    ) VALUES (
      v_withdrawal.seller_id,
      'withdraw',
      -v_withdrawal.amount,
      v_seller.balance,
      v_seller.balance, -- Balance already deducted when creating request
      'withdrawal',
      p_withdrawal_id,
      'Rút tiền thành công',
      'completed'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'amount', v_withdrawal.amount
  );
END;
$$;

-- Create atomic function for creating withdrawal request
CREATE OR REPLACE FUNCTION public.create_seller_withdrawal(
  p_seller_id UUID,
  p_amount NUMERIC,
  p_type TEXT DEFAULT 'normal',
  p_bank_name TEXT DEFAULT NULL,
  p_account_number TEXT DEFAULT NULL,
  p_account_holder TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_seller RECORD;
  v_fee_rate NUMERIC;
  v_fee NUMERIC;
  v_net_amount NUMERIC;
  v_min_amount NUMERIC;
  v_withdrawal_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;
  
  -- Get seller with lock
  SELECT * INTO v_seller
  FROM sellers
  WHERE id = p_seller_id
  FOR UPDATE;
  
  IF v_seller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy cửa hàng');
  END IF;
  
  IF v_seller.user_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không có quyền');
  END IF;
  
  -- Get fee settings
  SELECT 
    COALESCE((SELECT (value->>'rate')::numeric FROM marketplace_settings WHERE key = 
      CASE WHEN p_type = 'fast' THEN 'withdrawal_fast_fee' ELSE 'withdrawal_normal_fee' END
    ), CASE WHEN p_type = 'fast' THEN 0.02 ELSE 0.01 END),
    COALESCE((SELECT (value->>'amount')::numeric FROM marketplace_settings WHERE key = 'min_withdrawal_amount'), 50000)
  INTO v_fee_rate, v_min_amount;
  
  IF p_amount < v_min_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số tiền tối thiểu là ' || v_min_amount);
  END IF;
  
  IF v_seller.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;
  
  v_fee := ROUND(p_amount * v_fee_rate);
  v_net_amount := p_amount - v_fee;
  
  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    seller_id, amount, fee, net_amount, type, status,
    bank_name, account_number, account_holder
  ) VALUES (
    p_seller_id, p_amount, v_fee, v_net_amount, p_type, 'pending',
    COALESCE(p_bank_name, v_seller.bank_name),
    COALESCE(p_account_number, v_seller.bank_account),
    COALESCE(p_account_holder, v_seller.bank_holder)
  )
  RETURNING id INTO v_withdrawal_id;
  
  -- Deduct from seller balance (reserve)
  UPDATE sellers
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = p_seller_id;
  
  -- Log transaction
  INSERT INTO seller_wallet_transactions (
    seller_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_seller_id,
    'withdraw_pending',
    -p_amount,
    v_seller.balance,
    v_seller.balance - p_amount,
    'withdrawal',
    v_withdrawal_id,
    'Yêu cầu rút tiền - Phí: ' || v_fee,
    'pending'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'fee', v_fee,
    'net_amount', v_net_amount
  );
END;
$$;