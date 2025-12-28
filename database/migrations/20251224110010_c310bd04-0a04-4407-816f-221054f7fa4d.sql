-- Create table for milestone rewards that admins can configure
CREATE TABLE public.checkin_milestone_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_milestone INTEGER NOT NULL,
  reward_name TEXT NOT NULL,
  reward_name_en TEXT,
  reward_description TEXT,
  reward_description_en TEXT,
  reward_type TEXT NOT NULL DEFAULT 'voucher', -- voucher, points, badge, item
  reward_value TEXT, -- could be voucher code, points amount, badge id, etc.
  reward_image_url TEXT,
  bonus_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkin_milestone_rewards ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rewards
CREATE POLICY "Anyone can view active milestone rewards"
ON public.checkin_milestone_rewards
FOR SELECT
USING (is_active = true);

-- Only admins can manage rewards (via service role in admin panel)
CREATE POLICY "Admins can manage milestone rewards"
ON public.checkin_milestone_rewards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create table to track which rewards users have claimed
CREATE TABLE public.user_milestone_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_reward_id UUID NOT NULL REFERENCES public.checkin_milestone_rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_data JSONB, -- Store any reward-specific data (e.g., generated voucher code)
  UNIQUE(user_id, milestone_reward_id)
);

-- Enable RLS
ALTER TABLE public.user_milestone_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own milestone claims"
ON public.user_milestone_claims
FOR SELECT
USING (auth.uid() = user_id);

-- Users can claim rewards
CREATE POLICY "Users can claim milestone rewards"
ON public.user_milestone_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_checkin_milestone_rewards_updated_at
BEFORE UPDATE ON public.checkin_milestone_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();