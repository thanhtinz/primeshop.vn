-- Add avatar expiration and last login IP fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Create trigger to update last_login_ip when login_history is inserted
CREATE OR REPLACE FUNCTION public.update_last_login_ip()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_ip = NEW.ip_address
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_login_history_insert ON public.login_history;
CREATE TRIGGER on_login_history_insert
  AFTER INSERT ON public.login_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_login_ip();

-- Backfill last_login_ip from existing login_history
UPDATE public.profiles p
SET last_login_ip = (
  SELECT ip_address 
  FROM public.login_history lh 
  WHERE lh.user_id = p.user_id 
  ORDER BY login_at DESC 
  LIMIT 1
)
WHERE p.last_login_ip IS NULL;