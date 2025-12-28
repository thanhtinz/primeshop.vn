-- Enable RLS on group_invitations if not already enabled
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view invitations they created" ON public.group_invitations;
DROP POLICY IF EXISTS "Group members can create invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can view group invitations" ON public.group_invitations;

-- Policies for group_invitations using correct column names
CREATE POLICY "Users can view group invitations"
  ON public.group_invitations FOR SELECT
  USING (invited_by = auth.uid() OR invited_user_id = auth.uid());

CREATE POLICY "Group members can create invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invitations.group_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

CREATE POLICY "Invitees can update invitation status"
  ON public.group_invitations FOR UPDATE
  USING (invited_user_id = auth.uid());

-- Create index for faster searches on groups
CREATE INDEX IF NOT EXISTS idx_groups_name_search ON public.groups USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(visibility) WHERE visibility = 'public';