-- Add verification fields to sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Update trust_score default to 0
ALTER TABLE public.sellers ALTER COLUMN trust_score SET DEFAULT 0;

-- Create function to calculate trust score based on reviews
CREATE OR REPLACE FUNCTION public.calculate_seller_trust_score(seller_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating numeric;
  total_reviews integer;
  total_sales integer;
  dispute_count integer;
  score integer := 0;
BEGIN
  -- Get average rating and review count
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO avg_rating, total_reviews
  FROM seller_reviews
  WHERE seller_id = seller_uuid;
  
  -- Get total sales
  SELECT COALESCE(total_sales, 0) INTO total_sales
  FROM sellers WHERE id = seller_uuid;
  
  -- Get dispute count (disputes where seller lost)
  SELECT COUNT(*) INTO dispute_count
  FROM seller_orders
  WHERE seller_id = seller_uuid AND dispute_status = 'buyer_won';
  
  -- Calculate score (max 100)
  -- Base score from rating (max 50 points): rating * 10
  score := LEAST(ROUND(avg_rating * 10), 50);
  
  -- Bonus from reviews (max 20 points): 2 points per review up to 10
  score := score + LEAST(total_reviews * 2, 20);
  
  -- Bonus from sales (max 20 points): 1 point per sale up to 20
  score := score + LEAST(total_sales, 20);
  
  -- Penalty for disputes: -10 per dispute
  score := score - (dispute_count * 10);
  
  -- Ensure score is between 0 and 100
  score := GREATEST(0, LEAST(100, score));
  
  RETURN score;
END;
$$;

-- Create function to update seller stats after review
CREATE OR REPLACE FUNCTION public.update_seller_stats_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_avg numeric;
  new_count integer;
  new_trust integer;
BEGIN
  -- Calculate new average and count
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO new_avg, new_count
  FROM seller_reviews
  WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id);
  
  -- Calculate new trust score
  new_trust := calculate_seller_trust_score(COALESCE(NEW.seller_id, OLD.seller_id));
  
  -- Update seller stats
  UPDATE sellers SET
    rating_average = ROUND(new_avg, 1),
    rating_count = new_count,
    trust_score = new_trust,
    updated_at = now()
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for review changes
DROP TRIGGER IF EXISTS update_seller_stats_trigger ON seller_reviews;
CREATE TRIGGER update_seller_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_stats_on_review();

-- Add minimum trust score setting for verification
INSERT INTO site_settings (key, value)
VALUES ('marketplace_verification_min_score', '70')
ON CONFLICT (key) DO NOTHING;