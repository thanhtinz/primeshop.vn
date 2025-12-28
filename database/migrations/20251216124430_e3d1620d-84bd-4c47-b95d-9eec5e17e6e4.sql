-- Update style column to support game_topup
-- Note: The style column is already TEXT type, so we just need to ensure the application handles the new value

-- Add a comment to document the valid styles
COMMENT ON COLUMN categories.style IS 'Valid values: premium, game_account, game_topup';
COMMENT ON COLUMN products.style IS 'Valid values: premium, game_account, game_topup';