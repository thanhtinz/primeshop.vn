-- Create group badges table
CREATE TABLE public.group_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'award',
  color TEXT DEFAULT '#3b82f6',
  criteria TEXT,
  is_auto BOOLEAN DEFAULT false,
  auto_criteria_type TEXT,
  auto_criteria_value INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group member badges junction table
CREATE TABLE public.group_member_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.group_badges(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE(badge_id, member_id)
);

-- Create indexes
CREATE INDEX idx_group_badges_group_id ON public.group_badges(group_id);
CREATE INDEX idx_group_member_badges_member_id ON public.group_member_badges(member_id);
CREATE INDEX idx_group_member_badges_badge_id ON public.group_member_badges(badge_id);

-- Enable RLS
ALTER TABLE public.group_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_badges ENABLE ROW LEVEL SECURITY;

-- Group badges policies
CREATE POLICY "Everyone can view group badges"
ON public.group_badges FOR SELECT
USING (true);

CREATE POLICY "Group owners and managers can create badges"
ON public.group_badges FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_badges.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'manager')
    AND gm.is_active = true
  )
);

CREATE POLICY "Group owners and managers can update badges"
ON public.group_badges FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_badges.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'manager')
    AND gm.is_active = true
  )
);

CREATE POLICY "Group owners and managers can delete badges"
ON public.group_badges FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_badges.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'manager')
    AND gm.is_active = true
  )
);

-- Group member badges policies
CREATE POLICY "Everyone can view member badges"
ON public.group_member_badges FOR SELECT
USING (true);

CREATE POLICY "Group owners and managers can assign badges"
ON public.group_member_badges FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_member_badges.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'manager')
    AND gm.is_active = true
  )
);

CREATE POLICY "Group owners and managers can remove badges"
ON public.group_member_badges FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_member_badges.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'manager')
    AND gm.is_active = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_group_badges_updated_at
BEFORE UPDATE ON public.group_badges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();