-- Migrate old item_shop_purchases to wallet_transactions
INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, note, status, created_at)
SELECT 
  isp.user_id,
  'payment',
  -isp.price,
  0,
  0,
  isp.item_type,
  isp.item_id,
  CASE 
    WHEN isp.item_type = 'avatar_frame' THEN 'Mua khung avatar: ' || isp.item_name
    WHEN isp.item_type = 'name_color' THEN 'Mua màu tên: ' || isp.item_name
    WHEN isp.item_type = 'prime_effect' THEN 'Mua hiệu ứng: ' || isp.item_name
    WHEN isp.item_type = 'prime_boost' THEN 'Mua ' || isp.item_name
    ELSE 'Mua ' || isp.item_name
  END,
  'completed',
  isp.created_at
FROM item_shop_purchases isp
LEFT JOIN wallet_transactions wt ON wt.user_id = isp.user_id 
  AND wt.reference_id = isp.item_id
  AND wt.reference_type = isp.item_type
WHERE wt.id IS NULL;