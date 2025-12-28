-- Create atomic function for refunding balance payment
CREATE OR REPLACE FUNCTION public.refund_balance_payment(
  p_payment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_order RECORD;
  v_profile RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Get payment
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;
  
  IF v_payment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy thanh toán');
  END IF;
  
  IF v_payment.status = 'refunded' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Đã hoàn tiền trước đó', 'already_refunded', true);
  END IF;
  
  IF v_payment.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ có thể hoàn tiền thanh toán đã hoàn tất');
  END IF;
  
  -- Get order
  SELECT * INTO v_order
  FROM orders
  WHERE id = v_payment.order_id;
  
  -- Find user profile by email from order
  SELECT * INTO v_profile
  FROM profiles
  WHERE email = v_order.customer_email
  FOR UPDATE;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản người dùng');
  END IF;
  
  v_new_balance := COALESCE(v_profile.balance, 0) + v_payment.amount;
  
  -- Update payment status
  UPDATE payments
  SET 
    status = 'refunded',
    payment_data = COALESCE(payment_data, '{}'::jsonb) || jsonb_build_object(
      'refund', jsonb_build_object(
        'reason', p_reason,
        'processed_at', NOW(),
        'refund_amount', v_payment.amount
      )
    )
  WHERE id = p_payment_id;
  
  -- Update order status
  IF v_payment.order_id IS NOT NULL THEN
    UPDATE orders
    SET status = 'REFUNDED'
    WHERE id = v_payment.order_id;
  END IF;
  
  -- Refund to user balance
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
    v_profile.user_id,
    'refund',
    v_payment.amount,
    v_profile.balance,
    v_new_balance,
    'order',
    v_payment.order_id,
    'Hoàn tiền đơn hàng: ' || COALESCE(p_reason, 'Theo yêu cầu'),
    'completed'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'amount', v_payment.amount,
    'new_balance', v_new_balance,
    'order_number', v_order.order_number
  );
END;
$$;