-- Create table for Bio Pro plan pricing configuration
CREATE TABLE public.bio_pro_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  days INTEGER NOT NULL DEFAULT 30,
  savings_percent INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_pro_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans
CREATE POLICY "Anyone can read active bio pro plans"
ON public.bio_pro_plans
FOR SELECT
USING (is_active = true);

-- Only admins can manage plans (via service role)
CREATE POLICY "Admins can manage bio pro plans"
ON public.bio_pro_plans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Insert default plans
INSERT INTO public.bio_pro_plans (plan_id, name, name_en, price, days, savings_percent, sort_order) VALUES
('monthly', '1 Tháng', '1 Month', 49000, 30, NULL, 1),
('quarterly', '3 Tháng', '3 Months', 129000, 90, 12, 2),
('yearly', '1 Năm', '1 Year', 399000, 365, 32, 3);

-- Create trigger for updated_at
CREATE TRIGGER update_bio_pro_plans_updated_at
BEFORE UPDATE ON public.bio_pro_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();