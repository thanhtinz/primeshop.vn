
-- Fix missing function for design order trigger
CREATE OR REPLACE FUNCTION public.create_design_ticket_on_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM design_orders WHERE id = p_order_id;
  
  IF v_order IS NOT NULL THEN
    INSERT INTO design_tickets (order_id, ticket_number, status)
    VALUES (p_order_id, 'TK-' || SUBSTRING(v_order.order_number FROM 4), 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;
