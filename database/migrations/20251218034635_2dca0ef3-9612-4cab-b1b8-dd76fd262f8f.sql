-- Add completed_at field to track order completion time
ALTER TABLE public.smm_orders 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create index for faster queries on completed orders
CREATE INDEX IF NOT EXISTS idx_smm_orders_service_completed 
ON public.smm_orders (service_id, completed_at DESC) 
WHERE status = 'Completed';

-- Create function to calculate average processing time per 1000 for a service
CREATE OR REPLACE FUNCTION public.calculate_smm_avg_time(p_service_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_seconds numeric;
  avg_per_1000 numeric;
  result text;
BEGIN
  -- Get average time per 1000 quantity from last 10 completed orders
  SELECT 
    AVG(
      EXTRACT(EPOCH FROM (completed_at - created_at)) / NULLIF(quantity, 0) * 1000
    )
  INTO avg_seconds
  FROM (
    SELECT created_at, completed_at, quantity
    FROM smm_orders
    WHERE service_id = p_service_id 
      AND status = 'Completed' 
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 10
  ) recent_orders;

  IF avg_seconds IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convert to human readable format
  IF avg_seconds < 60 THEN
    result := round(avg_seconds) || ' giây';
  ELSIF avg_seconds < 3600 THEN
    result := round(avg_seconds / 60) || ' phút';
  ELSIF avg_seconds < 86400 THEN
    result := round(avg_seconds / 3600, 1) || ' giờ';
  ELSE
    result := round(avg_seconds / 86400, 1) || ' ngày';
  END IF;

  RETURN result;
END;
$$;