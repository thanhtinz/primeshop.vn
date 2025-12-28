-- Drop and recreate policies with correct role
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Product packages are publicly readable" ON public.product_packages;
CREATE POLICY "Product packages are publicly readable"
ON public.product_packages
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Product custom fields are publicly readable" ON public.product_custom_fields;
CREATE POLICY "Product custom fields are publicly readable"
ON public.product_custom_fields
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Vouchers are publicly readable" ON public.vouchers;
CREATE POLICY "Vouchers are publicly readable"
ON public.vouchers
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;
CREATE POLICY "Site settings are publicly readable"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);