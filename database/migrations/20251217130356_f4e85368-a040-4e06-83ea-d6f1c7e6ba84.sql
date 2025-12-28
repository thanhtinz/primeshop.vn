-- Add request_count to user_api_keys
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS request_count integer DEFAULT 0;

-- Create API usage logs table for detailed tracking
CREATE TABLE public.api_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id uuid NOT NULL REFERENCES public.user_api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all API logs" ON public.api_usage_logs
FOR SELECT USING (is_admin(auth.uid()));

-- Users can view their own API logs
CREATE POLICY "Users can view own API logs" ON public.api_usage_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_api_keys 
    WHERE user_api_keys.id = api_usage_logs.api_key_id 
    AND user_api_keys.user_id = auth.uid()
  )
);

-- Allow inserts (for edge function)
CREATE POLICY "API logs can be inserted" ON public.api_usage_logs
FOR INSERT WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at DESC);

-- Create API changelog table
CREATE TABLE public.api_changelog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  description text,
  changes jsonb NOT NULL DEFAULT '[]',
  is_breaking boolean DEFAULT false,
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_changelog ENABLE ROW LEVEL SECURITY;

-- Public can read changelog
CREATE POLICY "API changelog is publicly readable" ON public.api_changelog
FOR SELECT USING (true);

-- Admins can manage changelog
CREATE POLICY "Admins can manage API changelog" ON public.api_changelog
FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Insert initial changelog entry
INSERT INTO public.api_changelog (version, title, description, changes, is_breaking) VALUES
('1.0.0', 'Initial Release', 'First public API release with core endpoints', 
'[{"type": "added", "description": "Products endpoint - Get all products with filtering"}, {"type": "added", "description": "Categories endpoint - Get all categories"}, {"type": "added", "description": "Flash sales endpoint - Get active flash sales"}, {"type": "added", "description": "Account inventory endpoint for game_account API type"}]', 
false);