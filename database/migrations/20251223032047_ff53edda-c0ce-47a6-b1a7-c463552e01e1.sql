
-- Drop the old trigger function that's causing the issue
DROP FUNCTION IF EXISTS public.trigger_update_design_service_stats() CASCADE;

-- Create a proper function that takes service_id as parameter
CREATE OR REPLACE FUNCTION public.do_update_design_service_stats(p_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  avg_rating NUMERIC;
  total_count INTEGER;
  on_time_count INTEGER;
  completed_count INTEGER;
  total_orders INTEGER;
BEGIN
  -- Get review stats
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*), COUNT(*) FILTER (WHERE on_time = true)
  INTO avg_rating, total_count, on_time_count
  FROM public.design_service_reviews
  WHERE service_id = p_service_id;
  
  -- Get order stats
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_orders, completed_count
  FROM public.design_orders
  WHERE service_id = p_service_id;
  
  UPDATE public.design_services
  SET 
    average_rating = COALESCE(avg_rating, 0),
    rating_count = COALESCE(total_count, 0),
    total_orders = COALESCE(total_orders, 0),
    completed_orders = COALESCE(completed_count, 0),
    on_time_rate = CASE WHEN total_count > 0 THEN (on_time_count::NUMERIC / total_count) * 100 ELSE 100 END,
    updated_at = now()
  WHERE id = p_service_id;
END;
$$;

-- Recreate the trigger function to call the new function
CREATE OR REPLACE FUNCTION public.trigger_update_design_service_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM do_update_design_service_stats(NEW.service_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_design_order_status_change
AFTER UPDATE ON public.design_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_design_service_stats();
