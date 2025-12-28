-- Create function to auto-create ticket when design order is created
CREATE OR REPLACE FUNCTION public.create_design_ticket_on_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.design_tickets (
    order_id,
    ticket_number,
    status
  ) VALUES (
    NEW.id,
    'TK-' || SUBSTRING(NEW.order_number FROM 4),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating ticket
DROP TRIGGER IF EXISTS create_design_ticket_trigger ON public.design_orders;
CREATE TRIGGER create_design_ticket_trigger
  AFTER INSERT ON public.design_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_design_ticket_on_order();

-- Create function to release escrow after 3 days
CREATE OR REPLACE FUNCTION public.release_design_escrow()
RETURNS void AS $$
BEGIN
  UPDATE public.design_orders
  SET 
    escrow_status = 'released',
    updated_at = now()
  WHERE 
    escrow_status = 'holding'
    AND escrow_release_at IS NOT NULL
    AND escrow_release_at <= now()
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to set escrow release date when order is completed
CREATE OR REPLACE FUNCTION public.set_design_escrow_release_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.buyer_confirmed = true AND NEW.seller_confirmed = true THEN
    NEW.escrow_status := 'holding';
    NEW.escrow_release_at := now() + interval '3 days';
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for setting escrow release date
DROP TRIGGER IF EXISTS set_design_escrow_trigger ON public.design_orders;
CREATE TRIGGER set_design_escrow_trigger
  BEFORE UPDATE ON public.design_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_design_escrow_release_date();