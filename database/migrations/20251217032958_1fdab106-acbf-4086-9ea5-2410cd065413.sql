-- Create flash_sales table
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flash_sale_items table
CREATE TABLE public.flash_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flash_sale_id UUID NOT NULL REFERENCES public.flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.product_packages(id) ON DELETE CASCADE,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  quantity_limit INTEGER DEFAULT NULL,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sale_items ENABLE ROW LEVEL SECURITY;

-- Flash sales policies
CREATE POLICY "Flash sales are publicly readable when active"
ON public.flash_sales FOR SELECT
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can manage flash sales"
ON public.flash_sales FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Flash sale items policies
CREATE POLICY "Flash sale items are publicly readable for active sales"
ON public.flash_sale_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.flash_sales
  WHERE flash_sales.id = flash_sale_items.flash_sale_id
    AND flash_sales.is_active = true
    AND flash_sales.start_date <= now()
    AND flash_sales.end_date >= now()
));

CREATE POLICY "Admins can manage flash sale items"
ON public.flash_sale_items FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_flash_sales_active ON public.flash_sales(is_active, start_date, end_date);
CREATE INDEX idx_flash_sale_items_sale_id ON public.flash_sale_items(flash_sale_id);
CREATE INDEX idx_flash_sale_items_product_id ON public.flash_sale_items(product_id);

-- Trigger for updated_at
CREATE TRIGGER update_flash_sales_updated_at
BEFORE UPDATE ON public.flash_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flash_sale_items_updated_at
BEFORE UPDATE ON public.flash_sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();