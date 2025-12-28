-- Create atomic function for P2P transfer (create + process in one transaction)
CREATE OR REPLACE FUNCTION public.create_p2p_transfer(
  p_sender_id UUID,
  p_recipient_identifier TEXT,
  p_amount NUMERIC,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient RECORD;
  v_sender_balance NUMERIC;
  v_recipient_balance NUMERIC;
  v_transfer_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số tiền không hợp lệ');
  END IF;

  -- Find recipient by username or email
  SELECT user_id, full_name, username, email 
  INTO v_recipient 
  FROM public.profiles 
  WHERE username = p_recipient_identifier OR email = p_recipient_identifier
  LIMIT 1;
  
  IF v_recipient IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy người nhận');
  END IF;
  
  -- Cannot transfer to self
  IF v_recipient.user_id = p_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không thể chuyển tiền cho chính mình');
  END IF;
  
  -- Check sender balance
  SELECT balance INTO v_sender_balance FROM public.profiles WHERE user_id = p_sender_id FOR UPDATE;
  
  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản người gửi');
  END IF;
  
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;
  
  -- Get recipient balance
  SELECT balance INTO v_recipient_balance FROM public.profiles WHERE user_id = v_recipient.user_id FOR UPDATE;
  
  -- Create transfer record
  INSERT INTO public.p2p_transfers (sender_id, recipient_id, amount, message, status, completed_at)
  VALUES (p_sender_id, v_recipient.user_id, p_amount, p_message, 'completed', now())
  RETURNING id INTO v_transfer_id;
  
  -- Deduct from sender
  UPDATE public.profiles 
  SET balance = balance - p_amount 
  WHERE user_id = p_sender_id;
  
  -- Add to recipient
  UPDATE public.profiles 
  SET balance = balance + p_amount 
  WHERE user_id = v_recipient.user_id;
  
  -- Record sender transaction
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_before, balance_after, 
    reference_type, reference_id, recipient_id, note, status
  )
  VALUES (
    p_sender_id, 'transfer_out', -p_amount, v_sender_balance, v_sender_balance - p_amount,
    'transfer', v_transfer_id, v_recipient.user_id, p_message, 'completed'
  );
  
  -- Record recipient transaction
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, sender_id, note, status
  )
  VALUES (
    v_recipient.user_id, 'transfer_in', p_amount, v_recipient_balance, v_recipient_balance + p_amount,
    'transfer', v_transfer_id, p_sender_id, p_message, 'completed'
  );
  
  -- Create notification for recipient
  PERFORM create_notification(
    v_recipient.user_id,
    'wallet',
    'Nhận tiền chuyển khoản',
    'Bạn đã nhận được ' || p_amount || 'đ từ chuyển khoản',
    '/profile?tab=wallet'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'recipient_id', v_recipient.user_id,
    'recipient_name', COALESCE(v_recipient.full_name, v_recipient.username),
    'amount', p_amount,
    'new_balance', v_sender_balance - p_amount
  );
END;
$$;

-- Also fix the old process_p2p_transfer to include balance_before/after for recipient
CREATE OR REPLACE FUNCTION public.process_p2p_transfer(p_transfer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_sender_balance NUMERIC;
  v_recipient_balance NUMERIC;
BEGIN
  -- Get transfer
  SELECT * INTO v_transfer FROM public.p2p_transfers WHERE id = p_transfer_id AND status = 'pending';
  
  IF v_transfer IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check sender balance
  SELECT balance INTO v_sender_balance FROM public.profiles WHERE user_id = v_transfer.sender_id FOR UPDATE;
  
  IF v_sender_balance < v_transfer.amount THEN
    UPDATE public.p2p_transfers SET status = 'failed' WHERE id = p_transfer_id;
    RETURN FALSE;
  END IF;
  
  -- Get recipient balance
  SELECT balance INTO v_recipient_balance FROM public.profiles WHERE user_id = v_transfer.recipient_id FOR UPDATE;
  
  -- Deduct from sender
  UPDATE public.profiles SET balance = balance - v_transfer.amount WHERE user_id = v_transfer.sender_id;
  
  -- Add to recipient
  UPDATE public.profiles SET balance = balance + v_transfer.amount WHERE user_id = v_transfer.recipient_id;
  
  -- Record sender transaction with balance_before/after
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_before, balance_after, 
    reference_type, reference_id, recipient_id, note, status
  )
  VALUES (
    v_transfer.sender_id, 'transfer_out', -v_transfer.amount, v_sender_balance, v_sender_balance - v_transfer.amount, 
    'transfer', p_transfer_id, v_transfer.recipient_id, v_transfer.message, 'completed'
  );
  
  -- Record recipient transaction with balance_before/after
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, sender_id, note, status
  )
  VALUES (
    v_transfer.recipient_id, 'transfer_in', v_transfer.amount, v_recipient_balance, v_recipient_balance + v_transfer.amount,
    'transfer', p_transfer_id, v_transfer.sender_id, v_transfer.message, 'completed'
  );
  
  -- Mark as completed
  UPDATE public.p2p_transfers SET status = 'completed', completed_at = now() WHERE id = p_transfer_id;
  
  -- Create notification for recipient
  PERFORM create_notification(
    v_transfer.recipient_id,
    'wallet',
    'Nhận tiền chuyển khoản',
    'Bạn đã nhận được ' || v_transfer.amount || 'đ từ chuyển khoản',
    '/profile?tab=wallet'
  );
  
  RETURN TRUE;
END;
$$;