-- Bảng ban thành viên khỏi group
CREATE TABLE IF NOT EXISTS public.group_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT,
  ban_type TEXT NOT NULL DEFAULT 'permanent', -- 'permanent', 'temporary', 'shadow'
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Bảng lịch sử vi phạm của thành viên
CREATE TABLE IF NOT EXISTS public.group_member_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  violation_type TEXT NOT NULL, -- 'spam', 'harassment', 'scam', 'rule_break', 'other'
  description TEXT,
  reported_by UUID,
  action_taken TEXT, -- 'warning', 'mute', 'kick', 'ban'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng custom roles cho group (ngoài 5 roles mặc định)
CREATE TABLE IF NOT EXISTS public.group_custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  max_count INTEGER, -- giới hạn số người có role này
  current_count INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng gán custom role cho thành viên
CREATE TABLE IF NOT EXISTS public.group_member_custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  custom_role_id UUID NOT NULL REFERENCES public.group_custom_roles(id) ON DELETE CASCADE,
  assigned_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, custom_role_id)
);

-- Bảng nhật ký hoạt động group
CREATE TABLE IF NOT EXISTS public.group_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL, -- 'member_join', 'member_leave', 'member_ban', 'post_delete', 'settings_change', etc
  target_id UUID, -- ID của đối tượng bị tác động (member, post, etc)
  target_type TEXT, -- 'member', 'post', 'task', 'deal', 'settings'
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng rules tự động cho group
CREATE TABLE IF NOT EXISTS public.group_auto_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'post_limit', 'spam_filter', 'auto_mute', 'auto_kick', 'word_filter'
  conditions JSONB NOT NULL DEFAULT '{}', -- điều kiện kích hoạt
  actions JSONB NOT NULL DEFAULT '{}', -- hành động thực hiện
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng yêu cầu mua role trong group
CREATE TABLE IF NOT EXISTS public.group_role_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_type TEXT NOT NULL, -- 'seller', 'vip', 'custom'
  custom_role_id UUID REFERENCES public.group_custom_roles(id),
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  payment_method TEXT, -- 'wallet', 'group_wallet'
  expires_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_member_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_auto_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_role_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_bans
CREATE POLICY "Group managers can manage bans" ON public.group_bans
  FOR ALL USING (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Users can view if banned" ON public.group_bans
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for group_member_violations
CREATE POLICY "Group managers can manage violations" ON public.group_member_violations
  FOR ALL USING (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Users can view their violations" ON public.group_member_violations
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for group_custom_roles
CREATE POLICY "Group members can view custom roles" ON public.group_custom_roles
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group managers can manage custom roles" ON public.group_custom_roles
  FOR ALL USING (public.can_manage_group(group_id, auth.uid()));

-- RLS Policies for group_member_custom_roles
CREATE POLICY "Group members can view role assignments" ON public.group_member_custom_roles
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group managers can manage role assignments" ON public.group_member_custom_roles
  FOR ALL USING (public.can_manage_group(group_id, auth.uid()));

-- RLS Policies for group_activity_logs
CREATE POLICY "Group managers can view activity logs" ON public.group_activity_logs
  FOR SELECT USING (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "System can insert activity logs" ON public.group_activity_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for group_auto_rules
CREATE POLICY "Group members can view rules" ON public.group_auto_rules
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group owners can manage rules" ON public.group_auto_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid())
  );

-- RLS Policies for group_role_purchases
CREATE POLICY "Users can view their purchases" ON public.group_role_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Group managers can view all purchases" ON public.group_role_purchases
  FOR SELECT USING (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Users can create purchase requests" ON public.group_role_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group managers can update purchases" ON public.group_role_purchases
  FOR UPDATE USING (public.can_manage_group(group_id, auth.uid()));

-- Thêm cột mới vào group_members cho shadow ban
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT false;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS shadow_banned_at TIMESTAMPTZ;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS shadow_banned_by UUID;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS label TEXT; -- 'trusted', 'warning', 'new'

-- Function log activity
CREATE OR REPLACE FUNCTION public.log_group_activity(
  p_group_id UUID,
  p_action TEXT,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.group_activity_logs (group_id, user_id, action, target_id, target_type, details)
  VALUES (p_group_id, auth.uid(), p_action, p_target_id, p_target_type, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function transfer ownership
CREATE OR REPLACE FUNCTION public.transfer_group_ownership(p_group_id UUID, p_new_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_owner_id UUID;
BEGIN
  -- Check current user is owner
  SELECT owner_id INTO v_old_owner_id FROM public.groups WHERE id = p_group_id;
  
  IF v_old_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only owner can transfer ownership';
  END IF;
  
  -- Check new owner is member
  IF NOT public.is_group_member(p_group_id, p_new_owner_id) THEN
    RAISE EXCEPTION 'New owner must be a member';
  END IF;
  
  -- Update group owner
  UPDATE public.groups SET owner_id = p_new_owner_id, updated_at = now() WHERE id = p_group_id;
  
  -- Update member roles
  UPDATE public.group_members SET role = 'manager' WHERE group_id = p_group_id AND user_id = v_old_owner_id;
  UPDATE public.group_members SET role = 'owner' WHERE group_id = p_group_id AND user_id = p_new_owner_id;
  
  -- Log activity
  PERFORM log_group_activity(p_group_id, 'ownership_transfer', p_new_owner_id, 'member', 
    jsonb_build_object('old_owner', v_old_owner_id, 'new_owner', p_new_owner_id));
  
  RETURN TRUE;
END;
$$;