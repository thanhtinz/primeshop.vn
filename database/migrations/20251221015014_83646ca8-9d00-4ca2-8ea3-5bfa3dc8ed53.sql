-- Create enum for report reasons
CREATE TYPE public.report_reason AS ENUM (
  'spam',
  'harassment',
  'hate_speech', 
  'violence',
  'nudity',
  'false_info',
  'scam',
  'other'
);

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM (
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
);

-- Post reports table
CREATE TABLE public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('user_post', 'group_post', 'shop_post')),
  reason report_reason NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hidden posts table (user hides specific posts)
CREATE TABLE public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('user_post', 'group_post', 'shop_post')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, post_type)
);

-- Hidden users table (user hides all posts from specific user for a time period)
CREATE TABLE public.hidden_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_until TIMESTAMPTZ, -- null means permanent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hidden_user_id)
);

-- Enable RLS
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_reports
CREATE POLICY "Users can create their own reports"
ON public.post_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.post_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

-- RLS policies for hidden_posts
CREATE POLICY "Users can manage their own hidden posts"
ON public.hidden_posts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for hidden_users
CREATE POLICY "Users can manage their own hidden users"
ON public.hidden_users FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_post_reports_status ON public.post_reports(status);
CREATE INDEX idx_post_reports_post ON public.post_reports(post_id, post_type);
CREATE INDEX idx_hidden_posts_user ON public.hidden_posts(user_id);
CREATE INDEX idx_hidden_users_user ON public.hidden_users(user_id);
CREATE INDEX idx_hidden_users_until ON public.hidden_users(hidden_until) WHERE hidden_until IS NOT NULL;