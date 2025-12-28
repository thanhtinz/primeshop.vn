-- Update spin_event_wheel to handle balance prizes
CREATE OR REPLACE FUNCTION public.spin_event_wheel(p_event_id uuid)
RETURNS TABLE(success boolean, message text, spin_id uuid, prize_type text, prize_name text, prize_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_event RECORD;
  v_user_points RECORD;
  v_random DECIMAL;
  v_cumulative DECIMAL := 0;
  v_prize RECORD;
  v_spin_id UUID;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Vui lòng đăng nhập', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Get event
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id AND is_active = true AND start_date <= now() AND end_date >= now();

  IF v_event IS NULL THEN
    RETURN QUERY SELECT false, 'Sự kiện không tồn tại hoặc đã kết thúc', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Get user points
  SELECT * INTO v_user_points
  FROM user_event_points
  WHERE user_id = v_user_id AND event_id = p_event_id;

  IF v_user_points IS NULL OR v_user_points.current_balance < v_event.spin_cost THEN
    RETURN QUERY SELECT false, 'Không đủ điểm để quay', NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Deduct points
  UPDATE user_event_points
  SET current_balance = current_balance - v_event.spin_cost,
      total_spent = total_spent + v_event.spin_cost,
      updated_at = now()
  WHERE user_id = v_user_id AND event_id = p_event_id;

  -- Generate random number
  v_random := random() * 100;

  -- Find prize based on win rate
  FOR v_prize IN 
    SELECT * FROM event_spin_prizes 
    WHERE event_id = p_event_id 
      AND is_active = true 
      AND (quantity_remaining > 0 OR quantity_remaining = -1)
    ORDER BY sort_order
  LOOP
    v_cumulative := v_cumulative + v_prize.win_rate;
    IF v_random <= v_cumulative THEN
      -- Found prize, update quantity if limited
      IF v_prize.quantity_remaining > 0 THEN
        UPDATE event_spin_prizes
        SET quantity_remaining = quantity_remaining - 1,
            updated_at = now()
        WHERE id = v_prize.id;
      END IF;

      -- Create spin history
      INSERT INTO event_spin_history (user_id, event_id, prize_id, points_spent, prize_type, prize_name, prize_data, claimed)
      VALUES (
        v_user_id, 
        p_event_id, 
        v_prize.id, 
        v_event.spin_cost, 
        v_prize.prize_type, 
        v_prize.name,
        jsonb_build_object('prize_reference_id', v_prize.prize_reference_id, 'prize_value', v_prize.prize_value),
        CASE WHEN v_prize.prize_type IN ('points', 'nothing', 'balance') THEN true ELSE false END
      )
      RETURNING id INTO v_spin_id;

      -- Record transaction
      INSERT INTO event_point_transactions (user_id, event_id, points, transaction_type, reference_id, note)
      VALUES (v_user_id, p_event_id, -v_event.spin_cost, 'spin', v_spin_id, 'Quay vòng quay may mắn');

      -- If prize is points, add them immediately
      IF v_prize.prize_type = 'points' AND v_prize.prize_value > 0 THEN
        UPDATE user_event_points
        SET total_earned = total_earned + v_prize.prize_value,
            current_balance = current_balance + v_prize.prize_value,
            updated_at = now()
        WHERE user_id = v_user_id AND event_id = p_event_id;

        INSERT INTO event_point_transactions (user_id, event_id, points, transaction_type, reference_id, note)
        VALUES (v_user_id, p_event_id, v_prize.prize_value, 'reward', v_spin_id, 'Phần thưởng: ' || v_prize.name);
      END IF;

      -- If prize is balance, add to user balance atomically
      IF v_prize.prize_type = 'balance' AND v_prize.prize_value > 0 THEN
        -- Lock and get current balance
        SELECT balance INTO v_current_balance
        FROM profiles
        WHERE user_id = v_user_id
        FOR UPDATE;

        v_new_balance := COALESCE(v_current_balance, 0) + v_prize.prize_value;

        -- Update balance
        UPDATE profiles
        SET balance = v_new_balance
        WHERE user_id = v_user_id;

        -- Log wallet transaction
        INSERT INTO wallet_transactions (
          user_id, type, amount, balance_before, balance_after,
          reference_type, reference_id, note, status
        ) VALUES (
          v_user_id, 'prize', v_prize.prize_value, COALESCE(v_current_balance, 0), v_new_balance,
          'event_spin', v_spin_id::text, 'Giải thưởng vòng quay: ' || v_prize.name, 'completed'
        );
      END IF;

      RETURN QUERY SELECT 
        true, 
        'Chúc mừng bạn nhận được: ' || v_prize.name, 
        v_spin_id,
        v_prize.prize_type,
        v_prize.name,
        jsonb_build_object('prize_reference_id', v_prize.prize_reference_id, 'prize_value', v_prize.prize_value);
      RETURN;
    END IF;
  END LOOP;

  -- No prize (fallback)
  INSERT INTO event_spin_history (user_id, event_id, prize_id, points_spent, prize_type, prize_name, claimed)
  VALUES (v_user_id, p_event_id, NULL, v_event.spin_cost, 'nothing', 'Chúc bạn may mắn lần sau', true)
  RETURNING id INTO v_spin_id;

  INSERT INTO event_point_transactions (user_id, event_id, points, transaction_type, reference_id, note)
  VALUES (v_user_id, p_event_id, -v_event.spin_cost, 'spin', v_spin_id, 'Quay vòng quay may mắn');

  RETURN QUERY SELECT true, 'Chúc bạn may mắn lần sau!', v_spin_id, 'nothing'::TEXT, 'Chúc bạn may mắn lần sau'::TEXT, NULL::JSONB;
END;
$$;