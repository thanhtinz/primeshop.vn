-- Add missing columns to seller_tickets
ALTER TABLE seller_tickets 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES seller_orders(id),
ADD COLUMN IF NOT EXISTS admin_joined BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_joined_at TIMESTAMPTZ;

-- Drop existing policies
DROP POLICY IF EXISTS "Sellers can create tickets" ON seller_tickets;
DROP POLICY IF EXISTS "Sellers can view their tickets" ON seller_tickets;
DROP POLICY IF EXISTS "Sellers can update their tickets" ON seller_tickets;
DROP POLICY IF EXISTS "Sellers can send messages" ON seller_ticket_messages;
DROP POLICY IF EXISTS "Ticket participants can view messages" ON seller_ticket_messages;

-- Create new policies for seller_tickets

-- SELECT: Buyers and sellers can view tickets they're part of
CREATE POLICY "Participants can view tickets" ON seller_tickets
FOR SELECT USING (
  buyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM sellers 
    WHERE sellers.id = seller_tickets.seller_id 
    AND sellers.user_id = auth.uid()
  )
);

-- INSERT: Buyers can create tickets to sellers
CREATE POLICY "Buyers can create tickets" ON seller_tickets
FOR INSERT WITH CHECK (
  buyer_id = auth.uid()
);

-- UPDATE: Participants can update tickets
CREATE POLICY "Participants can update tickets" ON seller_tickets
FOR UPDATE USING (
  buyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM sellers 
    WHERE sellers.id = seller_tickets.seller_id 
    AND sellers.user_id = auth.uid()
  )
);

-- Create new policies for seller_ticket_messages

-- SELECT: Ticket participants can view messages
CREATE POLICY "Participants can view messages" ON seller_ticket_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM seller_tickets t
    WHERE t.id = seller_ticket_messages.ticket_id
    AND (
      t.buyer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM sellers s 
        WHERE s.id = t.seller_id 
        AND s.user_id = auth.uid()
      )
    )
  )
);

-- INSERT: Buyers and sellers can send messages
CREATE POLICY "Participants can send messages" ON seller_ticket_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM seller_tickets t
    WHERE t.id = seller_ticket_messages.ticket_id
    AND (
      t.buyer_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM sellers s 
        WHERE s.id = t.seller_id 
        AND s.user_id = auth.uid()
      )
    )
  )
);