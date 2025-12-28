-- Create function to update flash sale quantity sold when order is paid
CREATE OR REPLACE FUNCTION public.update_flash_sale_quantity_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product_snapshot JSONB;
  v_product_id UUID;
  v_package_id UUID;
  v_flash_sale_item_id UUID;
BEGIN
  -- Only trigger when status changes to PAID
  IF OLD.status = NEW.status OR NEW.status != 'PAID' THEN
    RETURN NEW;
  END IF;

  -- Get product info from snapshot
  v_product_snapshot := NEW.product_snapshot;
  v_product_id := (v_product_snapshot->'product'->>'id')::UUID;
  v_package_id := (v_product_snapshot->'selectedPackage'->>'id')::UUID;

  -- Check if this product/package is in an active flash sale
  SELECT fsi.id INTO v_flash_sale_item_id
  FROM flash_sale_items fsi
  JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
  WHERE fsi.product_id = v_product_id
    AND (fsi.package_id = v_package_id OR (fsi.package_id IS NULL AND v_package_id IS NULL))
    AND fs.is_active = true
    AND fs.start_date <= now()
    AND fs.end_date >= now()
  LIMIT 1;

  -- Update quantity sold if found
  IF v_flash_sale_item_id IS NOT NULL THEN
    UPDATE flash_sale_items
    SET quantity_sold = quantity_sold + 1,
        updated_at = now()
    WHERE id = v_flash_sale_item_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS update_flash_sale_on_order_paid ON orders;
CREATE TRIGGER update_flash_sale_on_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_sale_quantity_on_order();