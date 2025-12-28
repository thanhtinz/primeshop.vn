-- Trigger: Auto create ticket when order is created
CREATE OR REPLACE FUNCTION trigger_create_design_ticket()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_design_ticket_on_order(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_design_order_created ON design_orders;
CREATE TRIGGER on_design_order_created
  AFTER INSERT ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_design_ticket();

-- Trigger: Update service stats when order status changes
CREATE OR REPLACE FUNCTION trigger_update_design_service_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM update_design_service_stats(NEW.service_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_design_order_status_change ON design_orders;
CREATE TRIGGER on_design_order_status_change
  AFTER UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_design_service_stats();

-- Trigger: Set escrow release date when order is completed
CREATE OR REPLACE FUNCTION trigger_set_escrow_release()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM set_design_escrow_release_date(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_design_order_completed ON design_orders;
CREATE TRIGGER on_design_order_completed
  AFTER UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_escrow_release();

-- Function: Check and apply late penalty
CREATE OR REPLACE FUNCTION check_design_order_deadlines()
RETURNS void AS $$
DECLARE
  late_order RECORD;
BEGIN
  FOR late_order IN
    SELECT id, seller_id, deadline, late_count
    FROM design_orders
    WHERE status IN ('in_progress', 'revision')
    AND deadline < NOW()
    AND late_penalty_applied = false
  LOOP
    -- Update late count and apply penalty flag
    UPDATE design_orders
    SET late_count = COALESCE(late_count, 0) + 1,
        late_penalty_applied = true,
        updated_at = NOW()
    WHERE id = late_order.id;
    
    -- Update seller's late count
    UPDATE design_seller_profiles
    SET late_deliveries = COALESCE(late_deliveries, 0) + 1,
        updated_at = NOW()
    WHERE seller_id = late_order.seller_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-release escrow after 3 days
CREATE OR REPLACE FUNCTION auto_release_design_escrow()
RETURNS void AS $$
BEGIN
  UPDATE design_orders
  SET escrow_status = 'released',
      updated_at = NOW()
  WHERE status = 'completed'
  AND escrow_status = 'held'
  AND escrow_release_at IS NOT NULL
  AND escrow_release_at <= NOW();
  
  -- Log the releases
  INSERT INTO design_audit_logs (action, action_category, metadata)
  SELECT 'escrow_auto_released', 'escrow', jsonb_build_object('order_id', id)
  FROM design_orders
  WHERE status = 'completed'
  AND escrow_status = 'released'
  AND updated_at >= NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-match seller when order created (if enabled)
CREATE OR REPLACE FUNCTION trigger_auto_match_seller()
RETURNS TRIGGER AS $$
DECLARE
  matched_seller_id UUID;
  match_score INTEGER;
BEGIN
  -- Only if auto_matched is true and no seller assigned
  IF NEW.auto_matched = true AND NEW.seller_id IS NULL THEN
    -- Find best available seller based on category, rating, workload
    SELECT sp.seller_id, 
           (sp.avg_rating * 20 + (100 - COALESCE(sp.active_orders, 0) * 10)) AS score
    INTO matched_seller_id, match_score
    FROM design_seller_profiles sp
    JOIN design_services ds ON ds.seller_id = sp.seller_id
    WHERE ds.category_id = NEW.category_id
    AND sp.is_available = true
    AND sp.active_orders < sp.max_concurrent_orders
    ORDER BY score DESC
    LIMIT 1;
    
    IF matched_seller_id IS NOT NULL THEN
      NEW.seller_id := matched_seller_id;
      NEW.match_score := match_score;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_design_order_auto_match ON design_orders;
CREATE TRIGGER on_design_order_auto_match
  BEFORE INSERT ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_match_seller();

-- Trigger: Update ticket status when order status changes
CREATE OR REPLACE FUNCTION trigger_sync_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE design_tickets
    SET status = CASE 
      WHEN NEW.status = 'completed' THEN 'closed'
      WHEN NEW.status = 'cancelled' THEN 'closed'
      WHEN NEW.status = 'disputed' THEN 'escalated'
      ELSE status
    END,
    updated_at = NOW()
    WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_design_order_sync_ticket ON design_orders;
CREATE TRIGGER on_design_order_sync_ticket
  AFTER UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_ticket_status();