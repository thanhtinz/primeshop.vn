-- Drop and recreate the create_product_boost function to use profiles.balance instead of sellers.balance
CREATE OR REPLACE FUNCTION public.create_product_boost(
  p_product_id UUID,
  p_boost_type TEXT,
  p_days INTEGER
)
RETURNS TABLE(success BOOLEAN, message TEXT, boost_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_seller_id UUID;
  v_user_balance NUMERIC;
  v_price_per_day NUMERIC;
  v_total_cost NUMERIC;
  v_boost_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get seller
  SELECT s.id INTO v_seller_id
  FROM sellers s
  JOIN seller_products sp ON sp.seller_id = s.id
  WHERE sp.id = p_product_id AND s.user_id = v_user_id;
  
  IF v_seller_id IS NULL THEN
    RETURN QUERY SELECT false, 'Sản phẩm không tồn tại hoặc không thuộc về bạn'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get user balance from profiles
  SELECT balance INTO v_user_balance
  FROM profiles
  WHERE user_id = v_user_id;
  
  IF v_user_balance IS NULL THEN
    v_user_balance := 0;
  END IF;
  
  -- Get pricing
  SELECT price_per_day INTO v_price_per_day
  FROM boost_pricing
  WHERE boost_type = p_boost_type AND is_active = true;
  
  IF v_price_per_day IS NULL THEN
    RETURN QUERY SELECT false, 'Loại boost không hợp lệ'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  v_total_cost := v_price_per_day * p_days;
  
  -- Check balance
  IF v_user_balance < v_total_cost THEN
    RETURN QUERY SELECT false, 'Số dư không đủ'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Deduct balance from profiles (user's web balance)
  UPDATE profiles
  SET balance = balance - v_total_cost
  WHERE user_id = v_user_id;
  
  -- Create boost
  INSERT INTO product_boosts (product_id, seller_id, boost_type, cost_per_day, total_cost, end_date)
  VALUES (p_product_id, v_seller_id, p_boost_type, v_price_per_day, v_total_cost, now() + (p_days || ' days')::INTERVAL)
  RETURNING id INTO v_boost_id;
  
  -- Record transaction in seller_wallet_transactions for tracking
  INSERT INTO seller_wallet_transactions (seller_id, type, amount, balance_before, balance_after, reference_id, reference_type, note)
  VALUES (v_seller_id, 'boost', -v_total_cost, v_user_balance, v_user_balance - v_total_cost, v_boost_id, 'boost', 'Thuê ghim sản phẩm ' || p_boost_type || ' ' || p_days || ' ngày');
  
  RETURN QUERY SELECT true, 'Ghim sản phẩm thành công!'::TEXT, v_boost_id;
END;
$$;