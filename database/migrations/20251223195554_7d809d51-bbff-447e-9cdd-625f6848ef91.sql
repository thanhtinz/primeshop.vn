-- Create atomic RPC function for confirming design order completion
CREATE OR REPLACE FUNCTION public.confirm_design_order_completion(
  p_order_id UUID,
  p_confirm_type TEXT -- 'buyer' or 'seller'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_is_buyer BOOLEAN;
  v_is_seller BOOLEAN;
  v_ticket_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng đăng nhập');
  END IF;
  
  -- Get order with lock to prevent race condition
  SELECT * INTO v_order
  FROM design_orders
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn hàng');
  END IF;
  
  -- Check status - can only confirm delivered orders
  IF v_order.status NOT IN ('delivered', 'pending_confirm') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đơn hàng chưa được giao sản phẩm');
  END IF;
  
  -- Verify user is buyer or seller
  v_is_buyer := v_order.buyer_id = v_user_id;
  v_is_seller := EXISTS (SELECT 1 FROM sellers WHERE id = v_order.seller_id AND user_id = v_user_id);
  
  IF NOT v_is_buyer AND NOT v_is_seller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền xác nhận đơn này');
  END IF;
  
  -- Validate confirm_type matches user role
  IF p_confirm_type = 'buyer' AND NOT v_is_buyer THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không phải buyer');
  END IF;
  
  IF p_confirm_type = 'seller' AND NOT v_is_seller THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không phải seller');
  END IF;
  
  -- Update confirmation status
  IF p_confirm_type = 'buyer' THEN
    IF v_order.buyer_confirmed THEN
      RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'both_confirmed', v_order.seller_confirmed);
    END IF;
    
    UPDATE design_orders
    SET 
      buyer_confirmed = true,
      status = CASE 
        WHEN seller_confirmed = true THEN 'completed'
        ELSE 'pending_confirm'
      END,
      completed_at = CASE 
        WHEN seller_confirmed = true THEN NOW()
        ELSE NULL
      END,
      escrow_status = CASE 
        WHEN seller_confirmed = true THEN 'holding'
        ELSE escrow_status
      END,
      escrow_release_at = CASE 
        WHEN seller_confirmed = true THEN NOW() + interval '3 days'
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;
    
  ELSIF p_confirm_type = 'seller' THEN
    IF v_order.seller_confirmed THEN
      RETURN jsonb_build_object('success', true, 'already_confirmed', true, 'both_confirmed', v_order.buyer_confirmed);
    END IF;
    
    UPDATE design_orders
    SET 
      seller_confirmed = true,
      status = CASE 
        WHEN buyer_confirmed = true THEN 'completed'
        ELSE 'pending_confirm'
      END,
      completed_at = CASE 
        WHEN buyer_confirmed = true THEN NOW()
        ELSE NULL
      END,
      escrow_status = CASE 
        WHEN buyer_confirmed = true THEN 'holding'
        ELSE escrow_status
      END,
      escrow_release_at = CASE 
        WHEN buyer_confirmed = true THEN NOW() + interval '3 days'
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;
  END IF;
  
  -- If both confirmed, close the ticket
  IF v_order.buyer_confirmed AND v_order.seller_confirmed THEN
    SELECT id INTO v_ticket_id FROM design_tickets WHERE order_id = p_order_id;
    
    IF v_ticket_id IS NOT NULL THEN
      UPDATE design_tickets
      SET status = 'closed', closed_at = NOW()
      WHERE id = v_ticket_id;
    END IF;
    
    -- Log audit
    INSERT INTO design_audit_logs (order_id, ticket_id, action, action_category, user_id, metadata)
    VALUES (
      p_order_id,
      v_ticket_id,
      'order_completed',
      'order',
      v_user_id,
      jsonb_build_object(
        'confirmed_by', p_confirm_type,
        'completed_at', NOW(),
        'escrow_release_at', v_order.escrow_release_at
      )
    );
    
    RETURN jsonb_build_object(
      'success', true, 
      'both_confirmed', true, 
      'status', 'completed',
      'escrow_release_at', v_order.escrow_release_at
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'both_confirmed', false,
    'buyer_confirmed', v_order.buyer_confirmed,
    'seller_confirmed', v_order.seller_confirmed
  );
END;
$$;