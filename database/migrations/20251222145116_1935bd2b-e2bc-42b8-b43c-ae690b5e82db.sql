-- Design Service Categories
CREATE TABLE public.design_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_en TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_categories ENABLE ROW LEVEL SECURITY;

-- Public read for design categories
CREATE POLICY "Design categories are viewable by everyone" 
ON public.design_categories FOR SELECT USING (true);

-- Admin can manage
CREATE POLICY "Admins can manage design categories" 
ON public.design_categories FOR ALL 
USING (public.is_admin(auth.uid()));

-- Design Services (packages from sellers)
CREATE TABLE public.design_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.design_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_days INTEGER NOT NULL DEFAULT 3,
  revision_count INTEGER NOT NULL DEFAULT 2,
  delivery_formats TEXT[] DEFAULT ARRAY['PNG', 'JPG'],
  portfolio_images TEXT[],
  is_active BOOLEAN DEFAULT true,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  on_time_rate NUMERIC(5,2) DEFAULT 100,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_services ENABLE ROW LEVEL SECURITY;

-- Public read for active services
CREATE POLICY "Active design services are viewable by everyone" 
ON public.design_services FOR SELECT USING (is_active = true);

-- Seller can manage their own services
CREATE POLICY "Sellers can manage their own design services" 
ON public.design_services FOR ALL 
USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Design Orders
CREATE TABLE public.design_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('DS' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')),
  service_id UUID NOT NULL REFERENCES public.design_services(id),
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  buyer_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  platform_fee_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  seller_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_accept',
  escrow_status TEXT NOT NULL DEFAULT 'held',
  escrow_release_at TIMESTAMP WITH TIME ZONE,
  deadline TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  disputed_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  dispute_resolution TEXT,
  buyer_confirmed BOOLEAN DEFAULT false,
  seller_confirmed BOOLEAN DEFAULT false,
  -- Form data
  requirement_text TEXT,
  requirement_colors TEXT,
  requirement_style TEXT,
  requirement_size TEXT,
  requirement_purpose TEXT,
  requirement_notes TEXT,
  reference_files TEXT[],
  -- Delivery
  final_files TEXT[],
  delivery_notes TEXT,
  revision_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own design orders" 
ON public.design_orders FOR SELECT 
USING (buyer_id = auth.uid());

-- Sellers can view their orders
CREATE POLICY "Sellers can view their design orders" 
ON public.design_orders FOR SELECT 
USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Buyers can create orders
CREATE POLICY "Buyers can create design orders" 
ON public.design_orders FOR INSERT 
WITH CHECK (buyer_id = auth.uid());

-- Sellers can update their orders
CREATE POLICY "Sellers can update their design orders" 
ON public.design_orders FOR UPDATE 
USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Admins can view and manage all orders
CREATE POLICY "Admins can manage all design orders" 
ON public.design_orders FOR ALL 
USING (public.is_admin(auth.uid()));

-- Design Tickets (per order)
CREATE TABLE public.design_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('DT' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')),
  order_id UUID NOT NULL UNIQUE REFERENCES public.design_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting_seller',
  revision_requested INTEGER DEFAULT 0,
  admin_involved BOOLEAN DEFAULT false,
  admin_id UUID,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view tickets for their orders
CREATE POLICY "Users can view their design tickets" 
ON public.design_tickets FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.design_orders WHERE buyer_id = auth.uid()
    UNION
    SELECT id FROM public.design_orders WHERE seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  )
);

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all design tickets" 
ON public.design_tickets FOR ALL 
USING (public.is_admin(auth.uid()));

-- Design Ticket Messages
CREATE TABLE public.design_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.design_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'buyer',
  message TEXT NOT NULL,
  attachments JSONB,
  is_delivery BOOLEAN DEFAULT false,
  is_revision_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their tickets
CREATE POLICY "Users can view their ticket messages" 
ON public.design_ticket_messages FOR SELECT 
USING (
  ticket_id IN (
    SELECT t.id FROM public.design_tickets t
    JOIN public.design_orders o ON o.id = t.order_id
    WHERE o.buyer_id = auth.uid()
    OR o.seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  )
);

-- Users can send messages to their tickets
CREATE POLICY "Users can send ticket messages" 
ON public.design_ticket_messages FOR INSERT 
WITH CHECK (
  ticket_id IN (
    SELECT t.id FROM public.design_tickets t
    JOIN public.design_orders o ON o.id = t.order_id
    WHERE o.buyer_id = auth.uid()
    OR o.seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  )
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all ticket messages" 
ON public.design_ticket_messages FOR ALL 
USING (public.is_admin(auth.uid()));

-- Design Service Reviews
CREATE TABLE public.design_service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.design_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.design_services(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  on_time BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_service_reviews ENABLE ROW LEVEL SECURITY;

-- Public read for reviews
CREATE POLICY "Design reviews are viewable by everyone" 
ON public.design_service_reviews FOR SELECT USING (true);

-- Buyers can create reviews for their completed orders
CREATE POLICY "Buyers can create design reviews" 
ON public.design_service_reviews FOR INSERT 
WITH CHECK (buyer_id = auth.uid());

-- Design Managers (users who can manage design style)
CREATE TABLE public.design_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  permissions JSONB DEFAULT '{"can_view_orders": true, "can_manage_orders": true, "can_view_services": true, "can_manage_sellers": false, "can_resolve_disputes": false}',
  is_active BOOLEAN DEFAULT true,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_managers ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage design managers" 
ON public.design_managers FOR ALL 
USING (public.is_admin(auth.uid()));

-- Managers can view themselves
CREATE POLICY "Managers can view themselves" 
ON public.design_managers FOR SELECT 
USING (user_id = auth.uid());

-- Create function to check if user is design manager
CREATE OR REPLACE FUNCTION public.is_design_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.design_managers
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Design managers can view all orders
CREATE POLICY "Design managers can view all orders" 
ON public.design_orders FOR SELECT 
USING (public.is_design_manager(auth.uid()));

-- Design managers can update orders
CREATE POLICY "Design managers can update orders" 
ON public.design_orders FOR UPDATE 
USING (public.is_design_manager(auth.uid()));

-- Design managers can view all tickets
CREATE POLICY "Design managers can view all tickets" 
ON public.design_tickets FOR SELECT 
USING (public.is_design_manager(auth.uid()));

-- Design managers can update tickets
CREATE POLICY "Design managers can update tickets" 
ON public.design_tickets FOR UPDATE 
USING (public.is_design_manager(auth.uid()));

-- Design managers can view all messages
CREATE POLICY "Design managers can view all messages" 
ON public.design_ticket_messages FOR SELECT 
USING (public.is_design_manager(auth.uid()));

-- Design managers can send messages
CREATE POLICY "Design managers can send messages" 
ON public.design_ticket_messages FOR INSERT 
WITH CHECK (public.is_design_manager(auth.uid()));

-- Trigger to create ticket when order is created
CREATE OR REPLACE FUNCTION public.create_design_ticket_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.design_tickets (order_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_design_ticket_trigger
AFTER INSERT ON public.design_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_design_ticket_on_order();

-- Trigger to update service stats on review
CREATE OR REPLACE FUNCTION public.update_design_service_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  avg_rating NUMERIC;
  total_count INTEGER;
  on_time_count INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*), COUNT(*) FILTER (WHERE on_time = true)
  INTO avg_rating, total_count, on_time_count
  FROM public.design_service_reviews
  WHERE service_id = NEW.service_id;
  
  UPDATE public.design_services
  SET 
    average_rating = COALESCE(avg_rating, 0),
    rating_count = total_count,
    on_time_rate = CASE WHEN total_count > 0 THEN (on_time_count::NUMERIC / total_count) * 100 ELSE 100 END,
    updated_at = now()
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_design_service_stats_trigger
AFTER INSERT ON public.design_service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_design_service_stats();

-- Enable realtime for tickets and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_ticket_messages;

-- Insert default categories
INSERT INTO public.design_categories (name, name_en, slug, sort_order) VALUES
('Avatar', 'Avatar', 'avatar', 1),
('Banner', 'Banner', 'banner', 2),
('Thumbnail', 'Thumbnail', 'thumbnail', 3),
('Logo', 'Logo', 'logo', 4),
('Ảnh Quảng Cáo', 'Advertising Image', 'advertising', 5),
('Khác', 'Other', 'other', 6);