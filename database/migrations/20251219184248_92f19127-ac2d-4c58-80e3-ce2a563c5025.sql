-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;