-- Drop old constraint and add new one with 'buyer' included
ALTER TABLE seller_ticket_messages 
DROP CONSTRAINT seller_ticket_messages_sender_type_check;

ALTER TABLE seller_ticket_messages 
ADD CONSTRAINT seller_ticket_messages_sender_type_check 
CHECK (sender_type = ANY (ARRAY['seller'::text, 'admin'::text, 'buyer'::text]));