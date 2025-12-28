-- Add event_type column to events table
ALTER TABLE public.events
ADD COLUMN event_type text NOT NULL DEFAULT 'spin_wheel';

-- Add comment for clarity
COMMENT ON COLUMN public.events.event_type IS 'Type of event: spin_wheel or reward_exchange';