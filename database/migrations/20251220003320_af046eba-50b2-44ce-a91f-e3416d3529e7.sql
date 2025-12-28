-- Add RLS policies for admin to manage prime_boost_plans
CREATE POLICY "Admins can manage prime plans" 
ON public.prime_boost_plans 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add RLS policies for admin to manage name_colors  
CREATE POLICY "Admins can manage name colors" 
ON public.name_colors 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add RLS policies for admin to manage prime_effects
CREATE POLICY "Admins can manage prime effects" 
ON public.prime_effects 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add RLS policies for admin to manage prime_boost_benefits
CREATE POLICY "Admins can manage prime benefits" 
ON public.prime_boost_benefits 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Update SELECT policies to allow admins to see all records (not just active ones)
DROP POLICY IF EXISTS "Anyone can view active prime boost plans" ON public.prime_boost_plans;
CREATE POLICY "Anyone can view prime boost plans" 
ON public.prime_boost_plans 
FOR SELECT 
USING (is_active = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active name colors" ON public.name_colors;
CREATE POLICY "Anyone can view name colors" 
ON public.name_colors 
FOR SELECT 
USING (is_active = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active prime effects" ON public.prime_effects;
CREATE POLICY "Anyone can view prime effects" 
ON public.prime_effects 
FOR SELECT 
USING (is_active = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view enabled benefits" ON public.prime_boost_benefits;
CREATE POLICY "Anyone can view prime benefits" 
ON public.prime_boost_benefits 
FOR SELECT 
USING (is_enabled = true OR public.is_admin(auth.uid()));