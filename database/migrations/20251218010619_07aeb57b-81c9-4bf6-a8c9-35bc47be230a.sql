-- SMM Configuration table (store API domain and key)
CREATE TABLE public.smm_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_domain text NOT NULL,
  api_key text NOT NULL,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SMM Categories table (synced from API)
CREATE TABLE public.smm_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- SMM Services table (synced from API)
CREATE TABLE public.smm_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.smm_categories(id) ON DELETE CASCADE,
  external_service_id integer NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'Default',
  rate numeric NOT NULL,
  min_quantity integer NOT NULL,
  max_quantity integer NOT NULL,
  has_refill boolean DEFAULT false,
  description text,
  markup_percent numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Function to generate SMM order number
CREATE OR REPLACE FUNCTION public.generate_smm_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'SMM' || to_char(now(), 'YYMMDD') || lpad(floor(random() * 100000)::text, 5, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- SMM Orders table
CREATE TABLE public.smm_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  service_id uuid REFERENCES public.smm_services(id),
  external_order_id integer,
  order_number text NOT NULL UNIQUE DEFAULT generate_smm_order_number(),
  link text NOT NULL,
  quantity integer NOT NULL,
  charge numeric NOT NULL,
  start_count integer,
  remains integer,
  status text DEFAULT 'Pending',
  refill_id integer,
  refill_status text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smm_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smm_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smm_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smm_config (admin only)
CREATE POLICY "Only admins can manage SMM config" ON public.smm_config
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for smm_categories
CREATE POLICY "SMM categories are publicly readable" ON public.smm_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage SMM categories" ON public.smm_categories
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for smm_services
CREATE POLICY "SMM services are publicly readable" ON public.smm_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage SMM services" ON public.smm_services
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for smm_orders
CREATE POLICY "Users can view own SMM orders" ON public.smm_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create SMM orders" ON public.smm_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all SMM orders" ON public.smm_orders
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update SMM orders" ON public.smm_orders
  FOR UPDATE USING (is_admin(auth.uid()));