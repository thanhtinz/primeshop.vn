
-- Add new columns to user_api_keys table for API type, method, callback, IP whitelist, and approval status
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS api_type text NOT NULL DEFAULT 'premium',
ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'GET',
ADD COLUMN IF NOT EXISTS callback_url text,
ADD COLUMN IF NOT EXISTS ip_whitelist text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Add constraint for api_type
ALTER TABLE public.user_api_keys 
ADD CONSTRAINT user_api_keys_api_type_check 
CHECK (api_type IN ('premium', 'game_account', 'game_topup'));

-- Add constraint for method
ALTER TABLE public.user_api_keys 
ADD CONSTRAINT user_api_keys_method_check 
CHECK (method IN ('GET', 'POST'));

-- Add constraint for status
ALTER TABLE public.user_api_keys 
ADD CONSTRAINT user_api_keys_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.user_api_keys;

-- Create new RLS policies
CREATE POLICY "Users can view their own API keys" 
ON public.user_api_keys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
ON public.user_api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.user_api_keys FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.user_api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all API keys" 
ON public.user_api_keys FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all API keys" 
ON public.user_api_keys FOR UPDATE 
USING (is_admin(auth.uid()));
