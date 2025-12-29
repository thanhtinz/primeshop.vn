-- Create crypto_payments table for USDT and other crypto payments
CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_original DECIMAL(20, 2) NOT NULL,
  currency_original VARCHAR(10) NOT NULL DEFAULT 'VND',
  amount_usdt DECIMAL(20, 8) NOT NULL,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'order')),
  reference_id UUID,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  provider VARCHAR(50) NOT NULL DEFAULT 'fpayment',
  provider_payment_id VARCHAR(255),
  wallet_address VARCHAR(255),
  network VARCHAR(50) DEFAULT 'TRC20',
  qr_code TEXT,
  transaction_hash VARCHAR(255),
  error_message TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id ON crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_reference_id ON crypto_payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_provider_payment_id ON crypto_payments(provider_payment_id);

-- Add RLS
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own crypto payments" ON crypto_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update
CREATE POLICY "Service role can manage crypto payments" ON crypto_payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add FPayment settings to site_settings if not exists
INSERT INTO site_settings (key, value, category, description)
VALUES 
  ('fpayment_enabled', 'false', 'payment', 'Enable FPayment USDT payments'),
  ('fpayment_api_key', '', 'payment', 'FPayment API Key'),
  ('fpayment_merchant_id', '', 'payment', 'FPayment Merchant ID')
ON CONFLICT (key) DO NOTHING;

-- Create function to add user balance
CREATE OR REPLACE FUNCTION add_user_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_note TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Update user balance
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Create balance history record
  INSERT INTO balance_history (user_id, amount, type, note)
  VALUES (p_user_id, p_amount, 'deposit', COALESCE(p_note, 'Nạp tiền'));

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
