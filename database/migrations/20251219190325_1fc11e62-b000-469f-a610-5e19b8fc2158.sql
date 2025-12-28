-- Update RLS policies to allow staff to view and manage orders, tickets, and chats

-- 1. Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users and admins can update chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Message senders can update their messages" ON public.chat_messages;

-- 2. Create new policies that include staff role

-- Orders: Staff and Admin can view all orders
CREATE POLICY "Users and staff can view orders" 
ON public.orders 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND customer_email = (SELECT email FROM profiles WHERE user_id = auth.uid() LIMIT 1))
  OR is_admin(auth.uid())
  OR is_staff(auth.uid())
);

-- Orders: Staff and Admin can update orders
CREATE POLICY "Staff and admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (is_admin(auth.uid()) OR is_staff(auth.uid()));

-- Support Tickets: Staff and Admin can view all tickets
CREATE POLICY "Staff and admins can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_admin(auth.uid()) 
  OR is_staff(auth.uid())
);

-- Support Tickets: Staff and Admin can update tickets
CREATE POLICY "Staff and admins can update tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (is_admin(auth.uid()) OR is_staff(auth.uid()));

-- Chat Rooms: Staff and Admin can view all chat rooms
CREATE POLICY "Users and staff can view chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR auth.uid() = target_user_id 
  OR is_chat_room_member(auth.uid(), id) 
  OR is_admin(auth.uid())
  OR is_staff(auth.uid())
);

-- Chat Rooms: Staff and Admin can update chat rooms
CREATE POLICY "Users staff admins can update chat rooms" 
ON public.chat_rooms 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR is_admin(auth.uid()) 
  OR is_staff(auth.uid())
);

-- Chat Messages: Staff and Admin can view all messages
CREATE POLICY "Users and staff can view messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND (
      chat_rooms.user_id = auth.uid() 
      OR chat_rooms.target_user_id = auth.uid()
      OR is_chat_room_member(auth.uid(), chat_rooms.id)
      OR is_admin(auth.uid())
      OR is_staff(auth.uid())
    )
  )
);

-- Chat Messages: Staff and Admin can send messages
CREATE POLICY "Users and staff can send messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms 
    WHERE chat_rooms.id = chat_messages.room_id 
    AND (
      chat_rooms.user_id = auth.uid() 
      OR is_admin(auth.uid())
      OR is_staff(auth.uid())
    )
  )
);

-- Chat Messages: Staff and Admin can update messages
CREATE POLICY "Senders and staff can update messages" 
ON public.chat_messages 
FOR UPDATE 
USING (
  sender_id = auth.uid() 
  OR is_admin(auth.uid()) 
  OR is_staff(auth.uid())
);

-- Also need to check ticket_messages table
-- First check if it exists and add policies

-- Grant execute on is_staff function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;