
-- Drop and recreate the function with proper table aliases to avoid ambiguous column reference
DROP FUNCTION IF EXISTS public.do_update_design_service_stats(UUID);

CREATE OR REPLACE FUNCTION public.do_update_design_service_stats(p_service_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_orders INTEGER;
  v_completed_orders INTEGER;
BEGIN
  -- Calculate average rating from reviews
  SELECT COALESCE(AVG(r.rating), 0)
  INTO v_avg_rating
  FROM public.design_service_reviews r
  WHERE r.service_id = p_service_id;

  -- Count total and completed orders
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE o.status = 'completed')::INTEGER
  INTO v_total_orders, v_completed_orders
  FROM public.design_orders o
  WHERE o.service_id = p_service_id;

  -- Update the design service stats
  UPDATE public.design_services ds
  SET 
    average_rating = v_avg_rating,
    total_orders = v_total_orders,
    completed_orders = v_completed_orders,
    updated_at = now()
  WHERE ds.id = p_service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
