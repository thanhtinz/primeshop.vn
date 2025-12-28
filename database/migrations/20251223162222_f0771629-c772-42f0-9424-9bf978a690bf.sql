-- Create atomic function for daily checkin
CREATE OR REPLACE FUNCTION public.perform_daily_checkin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
  v_settings RECORD;
  v_yesterday_checkin RECORD;
  v_new_streak INTEGER;
  v_base_points INTEGER;
  v_streak_bonus INTEGER;
  v_milestone RECORD;
  v_milestone_bonus INTEGER := 0;
  v_total_points INTEGER;
  v_existing_points RECORD;
BEGIN
  -- Check if already checked in today
  IF EXISTS (SELECT 1 FROM daily_checkins WHERE user_id = p_user_id AND checkin_date = v_today) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn đã điểm danh hôm nay rồi!');
  END IF;

  -- Get settings
  SELECT * INTO v_settings FROM daily_checkin_settings LIMIT 1;
  
  IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tính năng điểm danh đang tạm ngưng!');
  END IF;

  -- Calculate streak
  SELECT streak_count INTO v_yesterday_checkin 
  FROM daily_checkins 
  WHERE user_id = p_user_id AND checkin_date = v_yesterday;
  
  v_new_streak := COALESCE(v_yesterday_checkin.streak_count, 0) + 1;

  -- Calculate points
  v_base_points := COALESCE(v_settings.base_points, 10);
  v_streak_bonus := LEAST(
    FLOOR(v_base_points * (COALESCE(v_settings.streak_bonus_multiplier, 1.1) - 1) * (v_new_streak - 1)),
    COALESCE(v_settings.max_streak_bonus, 100)
  )::INTEGER;

  -- Check for milestone bonus
  IF v_settings.streak_milestones IS NOT NULL THEN
    SELECT (m->>'bonus')::INTEGER INTO v_milestone_bonus
    FROM jsonb_array_elements(v_settings.streak_milestones) m
    WHERE (m->>'day')::INTEGER = v_new_streak
    LIMIT 1;
    
    v_milestone_bonus := COALESCE(v_milestone_bonus, 0);
  END IF;

  v_total_points := v_base_points + v_streak_bonus + v_milestone_bonus;

  -- Create checkin record
  INSERT INTO daily_checkins (user_id, checkin_date, points_earned, streak_count, is_milestone_bonus, milestone_bonus_points)
  VALUES (p_user_id, v_today, v_total_points, v_new_streak, v_milestone_bonus > 0, v_milestone_bonus);

  -- Update or create user points
  SELECT * INTO v_existing_points FROM user_points WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_existing_points IS NOT NULL THEN
    UPDATE user_points
    SET total_points = total_points + v_total_points,
        lifetime_earned = lifetime_earned + v_total_points,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO user_points (user_id, total_points, lifetime_earned, lifetime_spent)
    VALUES (p_user_id, v_total_points, v_total_points, 0);
  END IF;

  -- Log transaction
  INSERT INTO point_transactions (user_id, amount, transaction_type, source, description)
  VALUES (p_user_id, v_total_points, 'earn', 'checkin', 
          'Điểm danh ngày ' || v_today || ' (Streak: ' || v_new_streak || ')');

  RETURN jsonb_build_object(
    'success', true,
    'total_points', v_total_points,
    'new_streak', v_new_streak,
    'milestone_bonus', v_milestone_bonus
  );
END;
$$;

-- Create atomic function for redeeming points reward
CREATE OR REPLACE FUNCTION public.redeem_points_reward(p_user_id UUID, p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_user_points RECORD;
  v_voucher_code TEXT;
BEGIN
  -- Get reward details
  SELECT * INTO v_reward FROM points_rewards WHERE id = p_reward_id FOR UPDATE;
  
  IF v_reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phần thưởng không tồn tại');
  END IF;
  
  IF NOT v_reward.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phần thưởng không còn hoạt động');
  END IF;
  
  IF v_reward.quantity_limit IS NOT NULL AND v_reward.quantity_redeemed >= v_reward.quantity_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phần thưởng đã hết số lượng');
  END IF;

  -- Check user points
  SELECT * INTO v_user_points FROM user_points WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_user_points IS NULL OR v_user_points.total_points < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ điểm để đổi phần thưởng này');
  END IF;

  -- Generate voucher code if needed
  IF v_reward.reward_type = 'voucher' THEN
    v_voucher_code := 'PTS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT) FROM 1 FOR 8));
    
    -- Create voucher
    INSERT INTO vouchers (code, discount_type, discount_value, min_order_amount, max_uses, current_uses, is_active, expires_at)
    VALUES (
      v_voucher_code,
      CASE WHEN v_reward.voucher_discount_percent IS NOT NULL THEN 'percent' ELSE 'fixed' END,
      COALESCE(v_reward.voucher_discount_percent, v_reward.reward_value, 0),
      0,
      1,
      0,
      true,
      NOW() + INTERVAL '30 days'
    );
  END IF;

  -- Deduct points
  UPDATE user_points
  SET total_points = total_points - v_reward.points_cost,
      lifetime_spent = lifetime_spent + v_reward.points_cost,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Create redemption record
  INSERT INTO points_redemptions (user_id, reward_id, points_spent, voucher_code)
  VALUES (p_user_id, p_reward_id, v_reward.points_cost, v_voucher_code);

  -- Update quantity redeemed
  UPDATE points_rewards
  SET quantity_redeemed = COALESCE(quantity_redeemed, 0) + 1
  WHERE id = p_reward_id;

  -- Log transaction
  INSERT INTO point_transactions (user_id, amount, transaction_type, source, reference_id, description)
  VALUES (p_user_id, -v_reward.points_cost, 'spend', 'redeem', p_reward_id, 'Đổi phần thưởng: ' || v_reward.name);

  RETURN jsonb_build_object(
    'success', true,
    'reward_name', v_reward.name,
    'voucher_code', v_voucher_code,
    'points_spent', v_reward.points_cost,
    'new_points', v_user_points.total_points - v_reward.points_cost
  );
END;
$$;