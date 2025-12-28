-- Create table to track when user last viewed a group
CREATE TABLE IF NOT EXISTS public.group_last_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.group_last_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own last views
CREATE POLICY "Users can view their own last views"
ON public.group_last_views
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own last views
CREATE POLICY "Users can insert their own last views"
ON public.group_last_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own last views
CREATE POLICY "Users can update their own last views"
ON public.group_last_views
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_group_last_views_user_group ON public.group_last_views(user_id, group_id);