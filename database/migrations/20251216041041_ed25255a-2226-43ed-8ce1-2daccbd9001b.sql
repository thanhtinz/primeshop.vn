-- Add INSERT, UPDATE, DELETE policies for admin users on categories table
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Also add policies for products table
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for product_packages table
CREATE POLICY "Admins can insert product packages"
ON public.product_packages
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product packages"
ON public.product_packages
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product packages"
ON public.product_packages
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for product_custom_fields table
CREATE POLICY "Admins can insert product custom fields"
ON public.product_custom_fields
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product custom fields"
ON public.product_custom_fields
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product custom fields"
ON public.product_custom_fields
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for vouchers table
CREATE POLICY "Admins can insert vouchers"
ON public.vouchers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update vouchers"
ON public.vouchers
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete vouchers"
ON public.vouchers
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for site_settings table
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for email_templates table
CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete email templates"
ON public.email_templates
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policies for email_logs table
CREATE POLICY "Admins can insert email logs"
ON public.email_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update email logs"
ON public.email_logs
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete email logs"
ON public.email_logs
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));