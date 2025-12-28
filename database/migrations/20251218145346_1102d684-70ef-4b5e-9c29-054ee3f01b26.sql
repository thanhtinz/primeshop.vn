-- Fix ambiguous column reference in calculate_seller_trust_score
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
  
  -- Calculate score (max 100)
  -- Base score from rating (max 50 points): rating * 10
  score := LEAST(ROUND(avg_rating * 10), 50);
  
  -- Bonus from reviews (max 20 points): 2 points per review up to 10
  score := score + LEAST(total_reviews * 2, 20);
  
  -- Bonus from sales (max 20 points): 1 point per sale up to 20
  score := score + LEAST(seller_total_sales, 20);
  
  -- Penalty for disputes: -10 per dispute
  score := score - (dispute_count * 10);
  
  -- Ensure score is between 0 and 100
  score := GREATEST(0, LEAST(100, score));
  
  RETURN score;
END;
$$;