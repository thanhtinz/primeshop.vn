-- Drop and recreate attachments column as jsonb for seller_ticket_messages
ALTER TABLE public.seller_ticket_messages 
  DROP COLUMN IF EXISTS attachments;

ALTER TABLE public.seller_ticket_messages 
  ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;

-- Do the same for ticket_messages if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ticket_messages'
  ) THEN
    ALTER TABLE public.ticket_messages 
      DROP COLUMN IF EXISTS attachments;
    
    ALTER TABLE public.ticket_messages 
      ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;