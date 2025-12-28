-- Create money split sessions table
CREATE TABLE public.money_split_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Phiên chia tiền',
  total_amount DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  split_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed, equal
  platform_fee_percent DECIMAL(10, 4) DEFAULT 0,
  platform_fee_amount DECIMAL(20, 2) DEFAULT 0,
  intermediary_fee_percent DECIMAL(10, 4) DEFAULT 0,
  intermediary_fee_amount DECIMAL(20, 2) DEFAULT 0,
  total_expense DECIMAL(20, 2) DEFAULT 0,
  total_income DECIMAL(20, 2) DEFAULT 0,
  profit_loss DECIMAL(20, 2) DEFAULT 0,
  notes TEXT,
  share_token TEXT UNIQUE,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.money_split_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.money_split_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  percentage DECIMAL(10, 4) DEFAULT 0,
  fixed_amount DECIMAL(20, 2) DEFAULT 0,
  calculated_amount DECIMAL(20, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.money_split_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_split_participants ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions" 
ON public.money_split_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR share_token IS NOT NULL);

CREATE POLICY "Users can create their own sessions" 
ON public.money_split_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked sessions" 
ON public.money_split_sessions 
FOR UPDATE 
USING (auth.uid() = user_id AND is_locked = false);

CREATE POLICY "Users can delete their own sessions" 
ON public.money_split_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Participants policies
CREATE POLICY "Users can view participants of their sessions" 
ON public.money_split_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.money_split_sessions 
    WHERE id = session_id AND (user_id = auth.uid() OR share_token IS NOT NULL)
  )
);

CREATE POLICY "Users can manage participants of their sessions" 
ON public.money_split_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.money_split_sessions 
    WHERE id = session_id AND user_id = auth.uid() AND is_locked = false
  )
);

-- Create indexes
CREATE INDEX idx_money_split_sessions_user_id ON public.money_split_sessions(user_id);
CREATE INDEX idx_money_split_sessions_share_token ON public.money_split_sessions(share_token);
CREATE INDEX idx_money_split_participants_session_id ON public.money_split_participants(session_id);