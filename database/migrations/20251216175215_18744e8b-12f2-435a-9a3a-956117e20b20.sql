-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  points_type TEXT NOT NULL DEFAULT 'per_amount', -- 'fixed' or 'per_amount'
  points_value INTEGER NOT NULL DEFAULT 1, -- fixed points OR points earned
  points_per_amount INTEGER NOT NULL DEFAULT 10000, -- amount divisor (e.g., every 10000 = 1 point)
  spin_cost INTEGER NOT NULL DEFAULT 10, -- points per spin
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event spin prizes table
CREATE TABLE public.event_spin_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prize_type TEXT NOT NULL DEFAULT 'points', -- 'voucher', 'product', 'game_account', 'points', 'nothing'
  prize_reference_id UUID, -- voucher_id, product_id
  prize_value INTEGER DEFAULT 0, -- for points type
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- percentage 0-100
  quantity_total INTEGER NOT NULL DEFAULT -1, -- -1 = unlimited
  quantity_remaining INTEGER NOT NULL DEFAULT -1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user event points table
CREATE TABLE public.user_event_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  current_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create event point transactions table
CREATE TABLE public.event_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'order', 'spin', 'reward', 'admin_adjust'
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event spin history table
CREATE TABLE public.event_spin_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prize_id UUID REFERENCES public.event_spin_prizes(id),
  points_spent INTEGER NOT NULL,
  prize_type TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  prize_data JSONB, -- stores prize details for reference
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  custom_fields JSONB, -- for product claims that need custom fields
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_spin_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_spin_history ENABLE ROW LEVEL SECURITY;

-- Events policies (public read for active events)
CREATE POLICY "Events are publicly readable when active"
ON public.events FOR SELECT
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
USING (is_admin(auth.uid()));

-- Spin prizes policies
CREATE POLICY "Spin prizes are publicly readable for active events"
ON public.event_spin_prizes FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.events WHERE id = event_id AND is_active = true
));

CREATE POLICY "Admins can manage spin prizes"
ON public.event_spin_prizes FOR ALL
USING (is_admin(auth.uid()));

-- User event points policies
CREATE POLICY "Users can view own points"
ON public.user_event_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Points can be created/updated"
ON public.user_event_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Points can be updated"
ON public.user_event_points FOR UPDATE
USING (true);

CREATE POLICY "Admins can manage all points"
ON public.user_event_points FOR ALL
USING (is_admin(auth.uid()));

-- Point transactions policies
CREATE POLICY "Users can view own transactions"
ON public.event_point_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Transactions can be inserted"
ON public.event_point_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
ON public.event_point_transactions FOR SELECT
USING (is_admin(auth.uid()));

-- Spin history policies
CREATE POLICY "Users can view own spin history"
ON public.event_spin_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Spin history can be inserted"
ON public.event_spin_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "Spin history can be updated"
ON public.event_spin_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all spin history"
ON public.event_spin_history FOR SELECT
USING (is_admin(auth.uid()));

-- Create function to add points when order is paid during event
CREATE OR REPLACE FUNCTION public.add_event_points_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_event RECORD;
  v_points INTEGER;
BEGIN
  -- Only trigger when status changes to PAID
  IF OLD.status = NEW.status OR NEW.status != 'PAID' THEN
    RETURN NEW;
  END IF;

  -- Get user_id from profiles
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE email = NEW.customer_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check for active event
  SELECT * INTO v_event
  FROM events
  WHERE is_active = true
    AND start_date <= now()
    AND end_date >= now()
  LIMIT 1;

  IF v_event IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate points based on event config
  IF v_event.points_type = 'fixed' THEN
    v_points := v_event.points_value;
  ELSE
    v_points := FLOOR(NEW.total_amount / v_event.points_per_amount) * v_event.points_value;
  END IF;

  IF v_points <= 0 THEN
    RETURN NEW;
  END IF;

  -- Insert or update user points
  INSERT INTO user_event_points (user_id, event_id, total_earned, current_balance)
  VALUES (v_user_id, v_event.id, v_points, v_points)
  ON CONFLICT (user_id, event_id)
  DO UPDATE SET
    total_earned = user_event_points.total_earned + v_points,
    current_balance = user_event_points.current_balance + v_points,
    updated_at = now();

  -- Record transaction
  INSERT INTO event_point_transactions (user_id, event_id, points, transaction_type, reference_id, note)
  VALUES (v_user_id, v_event.id, v_points, 'order', NEW.id, 'Điểm từ đơn hàng ' || NEW.order_number);

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_order_paid_add_event_points
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_event_points_on_order();

-- Create function to spin wheel
CREATE OR REPLACE FUNCTION public.spin_event_wheel(p_event_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  spin_id UUID,
  prize_type TEXT,
  prize_name TEXT,
  prize_data JSONB
)
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
        CASE WHEN v_prize.prize_type IN ('points', 'nothing') THEN true ELSE false END
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

-- Add updated_at trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_spin_prizes_updated_at
  BEFORE UPDATE ON public.event_spin_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_event_points_updated_at
  BEFORE UPDATE ON public.user_event_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();