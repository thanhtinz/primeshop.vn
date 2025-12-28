-- Fix Security Definer Views - change to SECURITY INVOKER
-- This ensures RLS policies are applied based on the querying user

ALTER VIEW public.profiles_public SET (security_invoker = on);
ALTER VIEW public.orders_leaderboard SET (security_invoker = on);
ALTER VIEW public.smm_orders_leaderboard SET (security_invoker = on);
ALTER VIEW public.reviews_masked SET (security_invoker = on);
ALTER VIEW public.site_settings_public SET (security_invoker = on);
ALTER VIEW public.sellers_public SET (security_invoker = on);