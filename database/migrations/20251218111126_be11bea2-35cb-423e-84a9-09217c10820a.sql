
-- Create sellers table (store/shop registration)
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  shop_name TEXT NOT NULL,
  shop_slug TEXT NOT NULL UNIQUE,
  shop_description TEXT,
  shop_avatar_url TEXT,
  shop_banner_url TEXT,
  phone TEXT,
  facebook_url TEXT,
  zalo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  rating_average NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  trust_score NUMERIC DEFAULT 100,
  balance NUMERIC DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller products table
CREATE TABLE public.seller_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  game_type TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  images TEXT[] DEFAULT '{}',
  account_data TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending_review', 'sold', 'hidden', 'rejected')),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  account_info JSONB,
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_id UUID,
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller reviews table
CREATE TABLE public.seller_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewer_name TEXT,
  reviewer_avatar TEXT,
  product_id UUID REFERENCES public.seller_products(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  seller_reply TEXT,
  seller_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller orders table (P2P transactions)
CREATE TABLE public.seller_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.seller_products(id),
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  buyer_id UUID NOT NULL,
  buyer_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC DEFAULT 0,
  seller_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
  delivery_content TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace categories
CREATE TABLE public.marketplace_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sellers
CREATE POLICY "Anyone can view approved sellers" ON public.sellers
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own seller profile" ON public.sellers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update their own profile" ON public.sellers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for seller_products
CREATE POLICY "Anyone can view available products" ON public.seller_products
  FOR SELECT USING (status = 'available' OR EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sellers can manage their products" ON public.seller_products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

-- RLS Policies for seller_reviews
CREATE POLICY "Anyone can view reviews" ON public.seller_reviews
  FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON public.seller_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Sellers can reply to reviews" ON public.seller_reviews
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

-- RLS Policies for withdrawal_requests
CREATE POLICY "Sellers can view their withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sellers can create withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

-- RLS Policies for seller_orders
CREATE POLICY "Users can view their orders" ON public.seller_orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
  );

CREATE POLICY "Buyers can create orders" ON public.seller_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Order parties can update" ON public.seller_orders
  FOR UPDATE USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid())
  );

-- RLS Policies for marketplace_categories
CREATE POLICY "Anyone can view categories" ON public.marketplace_categories
  FOR SELECT USING (is_active = true);

-- Function to generate seller order number
CREATE OR REPLACE FUNCTION public.generate_seller_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'MP' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
END;
$$;

-- Function to update seller stats after order
CREATE OR REPLACE FUNCTION public.update_seller_stats_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update seller stats
    UPDATE public.sellers
    SET 
      total_sales = total_sales + 1,
      total_revenue = total_revenue + NEW.amount,
      balance = balance + NEW.seller_amount,
      updated_at = now()
    WHERE id = NEW.seller_id;
    
    -- Mark product as sold
    UPDATE public.seller_products
    SET 
      status = 'sold',
      sold_at = now(),
      buyer_id = NEW.buyer_id,
      order_id = NEW.id
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for seller stats
CREATE TRIGGER trigger_update_seller_stats
  AFTER UPDATE ON public.seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_stats_on_order();

-- Function to update seller rating
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  total_count INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO avg_rating, total_count
  FROM public.seller_reviews
  WHERE seller_id = NEW.seller_id;
  
  UPDATE public.sellers
  SET 
    rating_average = COALESCE(avg_rating, 0),
    rating_count = total_count,
    updated_at = now()
  WHERE id = NEW.seller_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for rating update
CREATE TRIGGER trigger_update_seller_rating
  AFTER INSERT ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_rating();

-- Insert default categories
INSERT INTO public.marketplace_categories (name, slug, sort_order) VALUES
  ('Roblox', 'roblox', 1),
  ('Blox Fruits', 'blox-fruits', 2),
  ('Free Fire', 'free-fire', 3),
  ('PUBG Mobile', 'pubg-mobile', 4),
  ('Liên Quân', 'lien-quan', 5),
  ('Genshin Impact', 'genshin-impact', 6),
  ('Honkai Star Rail', 'honkai-star-rail', 7),
  ('Khác', 'khac', 99);
