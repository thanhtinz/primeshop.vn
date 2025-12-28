-- Notifications table for realtime notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'order', 'security', 'system', 'promo'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- optional link to navigate to
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "Notifications can be inserted" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Create trigger to notify on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status_label TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get user_id from profiles by email
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE email = NEW.customer_email
  LIMIT 1;
  
  -- Skip if no user found
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Map status to Vietnamese label
  CASE NEW.status
    WHEN 'PAID' THEN v_status_label := 'Đã thanh toán';
    WHEN 'PROCESSING' THEN v_status_label := 'Đang xử lý';
    WHEN 'WAITING_DELIVERY' THEN v_status_label := 'Chờ giao hàng';
    WHEN 'DELIVERED' THEN v_status_label := 'Đã giao hàng';
    WHEN 'COMPLETED' THEN v_status_label := 'Hoàn tất';
    WHEN 'CANCELLED' THEN v_status_label := 'Đã hủy';
    WHEN 'REFUNDED' THEN v_status_label := 'Đã hoàn tiền';
    ELSE v_status_label := NEW.status;
  END CASE;
  
  -- Create notification
  PERFORM create_notification(
    v_user_id,
    'order',
    'Cập nhật đơn hàng',
    'Đơn hàng ' || NEW.order_number || ' đã chuyển sang trạng thái: ' || v_status_label,
    '/order-lookup'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();