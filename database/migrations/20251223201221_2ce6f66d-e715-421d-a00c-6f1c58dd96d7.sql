-- Create atomic function for auction "Buy Now"
CREATE OR REPLACE FUNCTION public.auction_buy_now(
  p_auction_id UUID,
  p_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_auction RECORD;
  v_product RECORD;
  v_buyer_balance NUMERIC;
  v_bid_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_platform_fee NUMERIC;
  v_seller_amount NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;

  -- Get auction details with lock
  SELECT a.*, p.id as product_id, p.title as product_title, p.images as product_images,
         p.account_data, s.user_id as seller_user_id, s.id as seller_id
  INTO v_auction
  FROM auctions a
  JOIN seller_products p ON a.product_id = p.id
  JOIN sellers s ON a.seller_id = s.id
  WHERE a.id = p_auction_id
  FOR UPDATE;

  IF v_auction IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phiên đấu giá không tồn tại');
  END IF;

  IF v_auction.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phiên đấu giá đã kết thúc hoặc chưa bắt đầu');
  END IF;

  IF now() < v_auction.start_time OR now() > v_auction.end_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phiên đấu giá không trong thời gian hoạt động');
  END IF;

  IF v_auction.buy_now_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phiên đấu giá này không hỗ trợ mua ngay');
  END IF;

  IF p_price != v_auction.buy_now_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Giá mua ngay không khớp');
  END IF;

  -- Check if user is seller
  IF v_auction.seller_user_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không thể mua sản phẩm của mình');
  END IF;

  -- Get buyer balance with lock
  SELECT balance INTO v_buyer_balance
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_buyer_balance IS NULL OR v_buyer_balance < p_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ. Vui lòng nạp thêm tiền.');
  END IF;

  -- Calculate fees (5% platform fee)
  v_platform_fee := p_price * 0.05;
  v_seller_amount := p_price - v_platform_fee;

  -- Generate order number
  v_order_number := 'AUC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

  -- Deduct buyer balance
  UPDATE profiles
  SET balance = balance - p_price,
      total_spent = total_spent + p_price,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Record wallet transaction for buyer
  INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, reference_type, note, status)
  VALUES (v_user_id, 'payment', p_price, v_buyer_balance, v_buyer_balance - p_price, 'auction_buy_now', 'Mua ngay đấu giá: ' || v_auction.title, 'completed');

  -- Create winning bid
  INSERT INTO auction_bids (auction_id, bidder_id, amount, is_winning)
  VALUES (p_auction_id, v_user_id, p_price, true)
  RETURNING id INTO v_bid_id;

  -- Mark all other bids as not winning
  UPDATE auction_bids SET is_winning = false WHERE auction_id = p_auction_id AND id != v_bid_id;

  -- Update auction status to sold
  UPDATE auctions
  SET status = 'sold',
      winner_id = v_user_id,
      winning_bid_id = v_bid_id,
      current_price = p_price,
      updated_at = now()
  WHERE id = p_auction_id;

  -- Update product status
  UPDATE seller_products
  SET status = 'sold',
      buyer_id = v_user_id,
      sold_at = now()
  WHERE id = v_auction.product_id;

  -- Create seller order for payment tracking
  INSERT INTO seller_orders (
    order_number, product_id, seller_id, buyer_id, buyer_email, 
    amount, platform_fee, seller_amount, status, delivery_content, notes
  )
  SELECT 
    v_order_number, v_auction.product_id, v_auction.seller_id, v_user_id, p.email,
    p_price, v_platform_fee, v_seller_amount, 'paid', v_auction.account_data,
    'Mua ngay từ đấu giá: ' || v_auction.title
  FROM profiles p WHERE p.user_id = v_user_id
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true, 
    'bid_id', v_bid_id,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'amount', p_price
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;