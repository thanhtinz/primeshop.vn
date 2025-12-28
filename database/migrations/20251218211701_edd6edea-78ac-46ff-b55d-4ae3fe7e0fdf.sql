-- Fix get_user_role function to handle new enum value safely
DROP FUNCTION IF EXISTS public.get_user_role(_user_id uuid);

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role::text 
      WHEN 'admin' THEN 1 
      WHEN 'staff' THEN 2 
      WHEN 'user' THEN 3 
      ELSE 4
    END
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'user');
END;
$$;