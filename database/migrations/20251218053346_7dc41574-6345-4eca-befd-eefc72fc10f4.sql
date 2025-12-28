
-- Add new columns for gift card features
ALTER TABLE public.gift_cards 
ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
ADD COLUMN IF NOT EXISTS is_bulk boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bulk_group_id uuid,
ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount numeric;

-- Create gift card templates table
CREATE TABLE IF NOT EXISTS public.gift_card_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_en text,
  image_url text NOT NULL,
  background_color text DEFAULT '#1e40af',
  text_color text DEFAULT '#ffffff',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gift card promotions table
CREATE TABLE IF NOT EXISTS public.gift_card_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  min_amount numeric DEFAULT 0,
  max_amount numeric,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default templates
INSERT INTO public.gift_card_templates (id, name, name_en, image_url, background_color, text_color, sort_order) VALUES
('default', 'Mặc định', 'Default', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', '#1e40af', '#ffffff', 0),
('birthday', 'Sinh nhật', 'Birthday', 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400', '#ec4899', '#ffffff', 1),
('christmas', 'Giáng sinh', 'Christmas', 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=400', '#16a34a', '#ffffff', 2),
('newyear', 'Năm mới', 'New Year', 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400', '#eab308', '#000000', 3),
('valentine', 'Valentine', 'Valentine', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400', '#dc2626', '#ffffff', 4),
('thankyou', 'Cảm ơn', 'Thank You', 'https://images.unsplash.com/photo-1606567595334-d39972c85dfd?w=400', '#8b5cf6', '#ffffff', 5)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.gift_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_promotions ENABLE ROW LEVEL SECURITY;

-- Policies for templates (public read)
CREATE POLICY "Anyone can view active templates" ON public.gift_card_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.gift_card_templates
FOR ALL USING (public.is_admin(auth.uid()));

-- Policies for promotions (public read active)
CREATE POLICY "Anyone can view active promotions" ON public.gift_card_promotions
FOR SELECT USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can manage promotions" ON public.gift_card_promotions
FOR ALL USING (public.is_admin(auth.uid()));

-- Function to generate share token
CREATE OR REPLACE FUNCTION public.generate_gift_card_share_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Trigger to auto-generate share token
CREATE OR REPLACE FUNCTION public.set_gift_card_share_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.share_token IS NULL THEN
    NEW.share_token := generate_gift_card_share_token();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_gift_card_share_token_trigger ON public.gift_cards;
CREATE TRIGGER set_gift_card_share_token_trigger
BEFORE INSERT ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.set_gift_card_share_token();
