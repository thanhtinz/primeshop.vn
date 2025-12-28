-- Update trust score calculation - lower points from reviews for gradual growth
CREATE OR REPLACE FUNCTION public.calculate_seller_trust_score(seller_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  total_reviews integer;
  seller_total_sales integer;
  dispute_count integer;
  score integer := 0;
BEGIN
  -- Get average rating and review count
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM seller_reviews
  WHERE seller_id = seller_uuid;
  
  -- Get total sales
  SELECT COALESCE(s.total_sales, 0) INTO seller_total_sales
  FROM sellers s WHERE s.id = seller_uuid;
  
  -- Get dispute count (disputes where seller lost)
  SELECT COUNT(*) INTO dispute_count
  FROM seller_orders
  WHERE seller_id = seller_uuid AND dispute_status = 'resolved_buyer';
  
  -- Calculate score (max 100) - more gradual growth
  -- Base score from rating (max 40 points): rating * 8
  score := LEAST(ROUND(avg_rating * 8), 40);
  
  -- Bonus from reviews (max 30 points): 1 point per review up to 30
  score := score + LEAST(total_reviews, 30);
  
  -- Bonus from sales (max 30 points): 1 point per 2 sales up to 30
  score := score + LEAST(FLOOR(seller_total_sales / 2), 30);
  
  -- Penalty for disputes: -15 per dispute
  score := score - (dispute_count * 15);
  
  -- Ensure score is between 0 and 100
  score := GREATEST(0, LEAST(100, score));
  
  RETURN score;
END;
$$;