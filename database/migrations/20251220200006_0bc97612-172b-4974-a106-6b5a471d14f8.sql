-- Fix function search paths for security

CREATE OR REPLACE FUNCTION public.create_group_wallet()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_wallets (group_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  UPDATE public.groups SET member_count = 1 WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'owner', true, true, true, true, true, true, true, true, true, true, true);
  
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'manager', true, true, true, true, true, true, true, true, true, false, false);
  
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'seller', true, true, true, false, true, false, true, false, false, false, false);
  
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'member', true, true, false, false, false, false, false, false, false, false, false);
  
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'viewer', false, true, false, false, false, false, false, false, false, false, false);
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_group_post_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance NUMERIC(12,2);
BEGIN
  IF NEW.type = 'income' THEN
    UPDATE public.group_wallets 
    SET balance = balance + NEW.amount,
        total_income = total_income + NEW.amount,
        updated_at = now()
    WHERE group_id = NEW.group_id
    RETURNING balance INTO new_balance;
  ELSE
    UPDATE public.group_wallets 
    SET balance = balance - NEW.amount,
        total_expense = total_expense + NEW.amount,
        updated_at = now()
    WHERE group_id = NEW.group_id
    RETURNING balance INTO new_balance;
  END IF;
  
  NEW.balance_after := new_balance;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contribution_points()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.group_members 
  SET contribution_points = contribution_points + NEW.points_change,
      updated_at = now()
  WHERE group_id = NEW.group_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_group_join_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.join_type IN ('code', 'link') AND NEW.join_code IS NULL THEN
    NEW.join_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$;