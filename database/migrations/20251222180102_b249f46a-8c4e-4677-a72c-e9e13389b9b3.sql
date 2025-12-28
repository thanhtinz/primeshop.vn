-- Add seller_id column to chat_rooms for seller-specific chats
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_rooms_seller_id ON chat_rooms(seller_id);

-- Update RLS policies to include seller_id check for shop chats
DROP POLICY IF EXISTS "Sellers can view their shop chats" ON chat_rooms;
CREATE POLICY "Sellers can view their shop chats" ON chat_rooms
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sellers can update their shop chats" ON chat_rooms;
CREATE POLICY "Sellers can update their shop chats" ON chat_rooms
  FOR UPDATE USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

-- Update chat_messages policies for seller access
DROP POLICY IF EXISTS "Sellers can view shop messages" ON chat_messages;
CREATE POLICY "Sellers can view shop messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_messages.room_id
      AND cr.seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can send shop messages" ON chat_messages;
CREATE POLICY "Sellers can send shop messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_messages.room_id
      AND cr.seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can update shop messages" ON chat_messages;
CREATE POLICY "Sellers can update shop messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_messages.room_id
      AND cr.seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );