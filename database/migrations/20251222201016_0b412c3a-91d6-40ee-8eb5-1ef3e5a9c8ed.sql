-- Create marketplace settings table for withdrawal fees
CREATE TABLE public.marketplace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read marketplace settings" 
ON public.marketplace_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify marketplace settings" 
ON public.marketplace_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Insert default withdrawal fee settings
INSERT INTO public.marketplace_settings (setting_key, setting_value, description) VALUES
('withdrawal_normal_fee', '{"rate": 0.01}', 'Phí rút tiền thường (1%)'),
('withdrawal_fast_fee', '{"rate": 0.02}', 'Phí rút tiền nhanh (2%)'),
('min_withdrawal_amount', '{"amount": 50000}', 'Số tiền rút tối thiểu');

-- Create trigger for updated_at
CREATE TRIGGER update_marketplace_settings_updated_at
BEFORE UPDATE ON public.marketplace_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();