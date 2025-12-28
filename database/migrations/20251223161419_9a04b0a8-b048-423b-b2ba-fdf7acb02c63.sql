-- RPC function để mua Prime Boost subscription
CREATE OR REPLACE FUNCTION public.purchase_prime_boost(
  p_user_id uuid,
  p_plan_id uuid,
  p_amount_paid numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_plan_name text;
  v_plan_duration integer;
  v_plan_type text;
  v_expires_at timestamptz;
  v_subscription_id uuid;
BEGIN
  -- Get plan details
  SELECT name, duration_days, COALESCE(plan_type, 'boost')
  INTO v_plan_name, v_plan_duration, v_plan_type
  FROM prime_boost_plans
  WHERE id = p_plan_id AND is_active = true;

  IF v_plan_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan not found');
  END IF;

  -- Lock and get current balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_balance < p_amount_paid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Calculate expiry date
  v_expires_at := now() + (v_plan_duration || ' days')::interval;
  v_new_balance := v_current_balance - p_amount_paid;

  -- Update balance and profile
  UPDATE profiles
  SET 
    balance = v_new_balance,
    has_prime_boost = true,
    prime_expires_at = v_expires_at,
    prime_plan_type = v_plan_type
  WHERE user_id = p_user_id;

  -- Log wallet transaction
  INSERT INTO wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, note, status
  ) VALUES (
    p_user_id, 'payment', -p_amount_paid, v_current_balance, v_new_balance,
    'prime_boost', p_plan_id::text, 'Mua ' || v_plan_name, 'completed'
  );

  -- Create subscription
  INSERT INTO prime_boost_subscriptions (
    user_id, plan_id, expires_at, amount_paid
  ) VALUES (
    p_user_id, p_plan_id, v_expires_at, p_amount_paid
  ) RETURNING id INTO v_subscription_id;

  -- Log purchase history
  INSERT INTO item_shop_purchases (
    user_id, item_type, item_id, item_name, price, is_gift
  ) VALUES (
    p_user_id, 'prime_boost', p_plan_id, v_plan_name, p_amount_paid, false
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );
END;
$$;

-- RPC function cho spin wheel với prize balance
CREATE OR REPLACE FUNCTION public.spin_wheel_with_balance_prize(
  p_user_id uuid,
  p_event_id uuid,
  p_prize_id uuid,
  p_prize_type text,
  p_prize_name text,
  p_prize_value numeric,
  p_points_spent integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_spin_history_id uuid;
BEGIN
  -- Get current balance (for balance prizes)
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- If prize is balance, add to user balance
  IF p_prize_type = 'balance' AND p_prize_value > 0 THEN
    v_new_balance := v_current_balance + p_prize_value;
    
    UPDATE profiles
    SET balance = v_new_balance
    WHERE user_id = p_user_id;

    -- Log wallet transaction
    INSERT INTO wallet_transactions (
      user_id, type, amount, balance_before, balance_after,
      reference_type, reference_id, note, status
    ) VALUES (
      p_user_id, 'prize', p_prize_value, v_current_balance, v_new_balance,
      'event_spin', p_event_id::text, 'Giải thưởng vòng quay: ' || p_prize_name, 'completed'
    );
  ELSE
    v_new_balance := v_current_balance;
  END IF;

  -- Create spin history record
  INSERT INTO event_spin_history (
    user_id, event_id, prize_id, points_spent, prize_type, prize_name, claimed
  ) VALUES (
    p_user_id, p_event_id, p_prize_id, p_points_spent, p_prize_type, p_prize_name,
    CASE WHEN p_prize_type IN ('balance', 'points', 'nothing') THEN true ELSE false END
  ) RETURNING id INTO v_spin_history_id;

  -- Update prize quantity
  UPDATE event_spin_prizes
  SET quantity_remaining = quantity_remaining - 1
  WHERE id = p_prize_id AND quantity_remaining > 0;

  RETURN jsonb_build_object(
    'success', true,
    'spin_history_id', v_spin_history_id,
    'new_balance', v_new_balance,
    'balance_added', CASE WHEN p_prize_type = 'balance' THEN p_prize_value ELSE 0 END
  );
END;
$$;