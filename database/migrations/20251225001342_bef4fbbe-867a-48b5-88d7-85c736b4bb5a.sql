-- Insert default marketplace settings if not exists
INSERT INTO marketplace_settings (setting_key, setting_value, description)
VALUES 
  ('withdrawal_normal_fee', '{"rate": 0.01}', 'Phí rút tiền thường (1%)'),
  ('withdrawal_fast_fee', '{"rate": 0.02}', 'Phí rút tiền nhanh (2%)'),
  ('min_withdrawal_amount', '{"amount": 50000}', 'Số tiền rút tối thiểu')
ON CONFLICT (setting_key) DO NOTHING;