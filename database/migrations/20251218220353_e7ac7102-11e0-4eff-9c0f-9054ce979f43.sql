-- Create auction type enum
CREATE TYPE public.auction_type AS ENUM ('time_based', 'buy_now', 'dutch', 'sealed');

-- Create auction status enum
CREATE TYPE public.auction_status AS ENUM ('draft', 'active', 'ended', 'cancelled', 'sold');

-- Create auctions table
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  auction_type public.auction_type NOT NULL DEFAULT 'time_based',
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Pricing
  starting_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  reserve_price NUMERIC, -- Giá tối thiểu để bán
  buy_now_price NUMERIC, -- Giá mua ngay
  
  -- Dutch auction specific
  dutch_start_price NUMERIC, -- Giá bắt đầu (cao)
  dutch_end_price NUMERIC, -- Giá kết thúc (thấp)
  dutch_decrement_amount NUMERIC, -- Số tiền giảm mỗi lần
  dutch_decrement_interval INTEGER, -- Số phút giữa các lần giảm
  
  -- Bidding rules
  min_bid_increment NUMERIC DEFAULT 10000, -- Bước giá tối thiểu
  max_bids_per_user INTEGER, -- Giới hạn số lần đấu giá
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  auto_extend_minutes INTEGER DEFAULT 5, -- Tự động gia hạn khi có bid mới
  
  -- Status
  status public.auction_status NOT NULL DEFAULT 'draft',
  winner_id UUID REFERENCES auth.users(id),
  winning_bid_id UUID,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create auction bids table
CREATE TABLE public.auction_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  max_auto_bid NUMERIC, -- Cho phép đấu giá tự động đến mức này
  is_sealed BOOLEAN DEFAULT false, -- Đấu giá kín
  is_winning BOOLEAN DEFAULT false,
  is_auto_bid BOOLEAN DEFAULT false, -- Được tạo tự động
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create auction watchers table (theo dõi phiên đấu giá)
CREATE TABLE public.auction_watchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notify_outbid BOOLEAN DEFAULT true,
  notify_ending BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(auction_id, user_id)
);

-- Enable RLS
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_watchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Auctions are viewable by everyone" 
ON public.auctions FOR SELECT 
USING (status != 'draft' OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can create auctions" 
ON public.auctions FOR INSERT 
WITH CHECK (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can update own auctions" 
ON public.auctions FOR UPDATE 
USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can delete own draft auctions" 
ON public.auctions FOR DELETE 
USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()) AND status = 'draft');

-- RLS Policies for bids
CREATE POLICY "Active auction bids are viewable" 
ON public.auction_bids FOR SELECT 
USING (
  (is_sealed = false) OR 
  (bidder_id = auth.uid()) OR 
  (auction_id IN (SELECT id FROM auctions WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())))
);

CREATE POLICY "Users can place bids" 
ON public.auction_bids FOR INSERT 
WITH CHECK (bidder_id = auth.uid());

-- RLS Policies for watchers
CREATE POLICY "Users can view own watches" 
ON public.auction_watchers FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can add watches" 
ON public.auction_watchers FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own watches" 
ON public.auction_watchers FOR DELETE 
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_auctions_seller ON public.auctions(seller_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX idx_auction_bids_auction ON public.auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder ON public.auction_bids(bidder_id);

-- Enable realtime for auctions and bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;

-- Function to place a bid
CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_auction_id UUID,
  p_amount NUMERIC,
  p_max_auto_bid NUMERIC DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, bid_id UUID, new_price NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_auction RECORD;
  v_current_highest NUMERIC;
  v_bid_id UUID;
  v_is_sealed BOOLEAN;
  v_actual_bid NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Vui lòng đăng nhập'::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Get auction details
  SELECT * INTO v_auction
  FROM auctions
  WHERE id = p_auction_id AND status = 'active'
    AND start_time <= now() AND end_time >= now();

  IF v_auction IS NULL THEN
    RETURN QUERY SELECT false, 'Phiên đấu giá không tồn tại hoặc đã kết thúc'::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Check if user is seller
  IF v_auction.seller_id IN (SELECT id FROM sellers WHERE user_id = v_user_id) THEN
    RETURN QUERY SELECT false, 'Bạn không thể đấu giá sản phẩm của mình'::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Get current highest bid
  SELECT COALESCE(MAX(amount), v_auction.starting_price) INTO v_current_highest
  FROM auction_bids
  WHERE auction_id = p_auction_id;

  -- Check sealed auction
  v_is_sealed := v_auction.auction_type = 'sealed';

  -- Validate bid amount
  IF NOT v_is_sealed AND p_amount <= v_current_highest THEN
    RETURN QUERY SELECT false, ('Giá phải cao hơn ' || v_current_highest)::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  IF NOT v_is_sealed AND p_amount < v_current_highest + v_auction.min_bid_increment THEN
    RETURN QUERY SELECT false, ('Bước giá tối thiểu là ' || v_auction.min_bid_increment)::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  v_actual_bid := p_amount;

  -- Insert bid
  INSERT INTO auction_bids (auction_id, bidder_id, amount, max_auto_bid, is_sealed)
  VALUES (p_auction_id, v_user_id, v_actual_bid, p_max_auto_bid, v_is_sealed)
  RETURNING id INTO v_bid_id;

  -- Update auction current price and bid count
  UPDATE auctions
  SET 
    current_price = v_actual_bid,
    bid_count = bid_count + 1,
    -- Auto extend if bid is near end
    end_time = CASE 
      WHEN v_auction.auto_extend_minutes > 0 AND end_time - now() < (v_auction.auto_extend_minutes || ' minutes')::INTERVAL
      THEN end_time + (v_auction.auto_extend_minutes || ' minutes')::INTERVAL
      ELSE end_time
    END,
    updated_at = now()
  WHERE id = p_auction_id;

  -- Mark this bid as winning and others as not
  UPDATE auction_bids SET is_winning = false WHERE auction_id = p_auction_id;
  UPDATE auction_bids SET is_winning = true WHERE id = v_bid_id;

  RETURN QUERY SELECT true, 'Đặt giá thành công!'::TEXT, v_bid_id, v_actual_bid;
END;
$$;

-- Function to end auction and determine winner
CREATE OR REPLACE FUNCTION public.finalize_auction(p_auction_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, winner_id UUID, winning_amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_winning_bid RECORD;
BEGIN
  SELECT * INTO v_auction
  FROM auctions
  WHERE id = p_auction_id AND status = 'active';

  IF v_auction IS NULL THEN
    RETURN QUERY SELECT false, 'Phiên đấu giá không tồn tại'::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  -- Get winning bid (highest for normal, special logic for sealed)
  IF v_auction.auction_type = 'sealed' THEN
    -- For sealed: highest bid wins
    SELECT * INTO v_winning_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id
    ORDER BY amount DESC
    LIMIT 1;
  ELSE
    SELECT * INTO v_winning_bid
    FROM auction_bids
    WHERE auction_id = p_auction_id AND is_winning = true
    LIMIT 1;
  END IF;

  -- Check reserve price
  IF v_auction.reserve_price IS NOT NULL AND 
     (v_winning_bid IS NULL OR v_winning_bid.amount < v_auction.reserve_price) THEN
    -- Reserve not met
    UPDATE auctions SET status = 'ended', updated_at = now() WHERE id = p_auction_id;
    RETURN QUERY SELECT false, 'Giá đấu không đạt mức tối thiểu'::TEXT, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  IF v_winning_bid IS NOT NULL THEN
    -- Update auction with winner
    UPDATE auctions
    SET 
      status = 'sold',
      winner_id = v_winning_bid.bidder_id,
      winning_bid_id = v_winning_bid.id,
      current_price = v_winning_bid.amount,
      updated_at = now()
    WHERE id = p_auction_id;

    RETURN QUERY SELECT true, 'Đấu giá kết thúc!'::TEXT, v_winning_bid.bidder_id, v_winning_bid.amount;
  ELSE
    -- No bids
    UPDATE auctions SET status = 'ended', updated_at = now() WHERE id = p_auction_id;
    RETURN QUERY SELECT false, 'Không có người đấu giá'::TEXT, NULL::UUID, NULL::NUMERIC;
  END IF;
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_auctions_updated_at
BEFORE UPDATE ON public.auctions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();