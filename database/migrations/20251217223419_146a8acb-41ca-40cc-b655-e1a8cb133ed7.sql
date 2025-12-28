-- Fix the translations policy - drop first if exists
DROP POLICY IF EXISTS "Translations are publicly readable" ON public.translations;

CREATE POLICY "Translations are publicly readable" 
ON public.translations 
FOR SELECT 
USING (true);