-- Fix function search path
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key TEXT;
BEGIN
  key := 'lv_' || encode(gen_random_bytes(32), 'hex');
  RETURN key;
END;
$$;