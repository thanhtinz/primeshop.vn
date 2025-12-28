-- =============================================
-- PHASE 1: ENUMS & CORE TABLES
-- =============================================

-- Group visibility types
CREATE TYPE public.group_visibility AS ENUM ('public', 'private', 'hidden');

-- Group join types
CREATE TYPE public.group_join_type AS ENUM ('open', 'link', 'code', 'approval', 'conditional');

-- Group member roles
CREATE TYPE public.group_member_role AS ENUM ('owner', 'manager', 'seller', 'member', 'viewer');

-- Post types in groups
CREATE TYPE public.group_post_type AS ENUM ('announcement', 'discussion', 'deal', 'task', 'profit_share', 'report');

-- Task status
CREATE TYPE public.group_task_status AS ENUM ('pending', 'doing', 'done', 'cancelled');

-- Deal status
CREATE TYPE public.group_deal_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'disputed');

-- =============================================
-- GROUPS TABLE (Core)
-- =============================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  visibility group_visibility NOT NULL DEFAULT 'public',
  join_type group_join_type NOT NULL DEFAULT 'open',
  join_code TEXT UNIQUE,
  min_reputation_to_join INTEGER DEFAULT 0,
  min_level_to_join INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  
  -- Monetization settings
  entry_fee NUMERIC(10,2) DEFAULT 0,
  monthly_fee NUMERIC(10,2) DEFAULT 0,
  seller_role_price NUMERIC(10,2) DEFAULT 0,
  vip_role_price NUMERIC(10,2) DEFAULT 0,
  deal_commission_percent NUMERIC(5,2) DEFAULT 0,
  
  -- Stats (denormalized for performance)
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  rules JSONB DEFAULT '[]',
  
  owner_id UUID NOT NULL,
  chat_room_id UUID REFERENCES public.chat_rooms(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP MEMBERS
-- =============================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role group_member_role NOT NULL DEFAULT 'member',
  
  -- Custom permissions override (JSONB for flexibility)
  custom_permissions JSONB DEFAULT '{}',
  
  -- Group-specific points
  contribution_points INTEGER DEFAULT 0,
  
  -- Membership status
  is_active BOOLEAN DEFAULT true,
  muted_until TIMESTAMPTZ,
  
  -- Subscription/payment
  paid_until TIMESTAMPTZ,
  role_expires_at TIMESTAMPTZ,
  
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

-- =============================================
-- GROUP PERMISSIONS (per role per group)
-- =============================================
CREATE TABLE public.group_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role group_member_role NOT NULL,
  
  -- Permissions
  can_post BOOLEAN DEFAULT true,
  can_comment BOOLEAN DEFAULT true,
  can_create_deal BOOLEAN DEFAULT false,
  can_create_task BOOLEAN DEFAULT false,
  can_create_poll BOOLEAN DEFAULT false,
  can_view_insights BOOLEAN DEFAULT false,
  can_invite BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_posts BOOLEAN DEFAULT false,
  can_manage_wallet BOOLEAN DEFAULT false,
  can_manage_rules BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(group_id, role)
);

-- =============================================
-- GROUP WALLET
-- =============================================
CREATE TABLE public.group_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_income NUMERIC(12,2) DEFAULT 0,
  total_expense NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP WALLET TRANSACTIONS
-- =============================================
CREATE TABLE public.group_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense', 'transfer'
  category TEXT NOT NULL, -- 'entry_fee', 'monthly_fee', 'role_purchase', 'deal_commission', 'reward', 'project_expense', etc.
  description TEXT,
  
  -- Related entities
  user_id UUID, -- member involved
  reference_type TEXT, -- 'deal', 'task', 'membership', etc.
  reference_id UUID,
  
  -- Balance after transaction
  balance_after NUMERIC(12,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP POSTS (Multiple Types)
-- =============================================
CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  
  post_type group_post_type NOT NULL DEFAULT 'discussion',
  
  -- Content
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[],
  
  -- Type-specific data (flexible JSONB)
  type_data JSONB DEFAULT '{}',
  
  -- Stats
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP POST COMMENTS
-- =============================================
CREATE TABLE public.group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  parent_id UUID REFERENCES public.group_post_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  media_urls TEXT[],
  
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP POST LIKES
-- =============================================
CREATE TABLE public.group_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- GROUP TASKS
-- =============================================
CREATE TABLE public.group_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.group_posts(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  created_by UUID NOT NULL,
  assigned_to UUID[],
  
  -- Timing
  deadline TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  status group_task_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  
  -- Rewards/Penalties
  reward_points INTEGER DEFAULT 0,
  reward_amount NUMERIC(10,2) DEFAULT 0,
  penalty_points INTEGER DEFAULT 0,
  penalty_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Proof
  proof_required BOOLEAN DEFAULT false,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP DEALS (Kèo nội bộ)
-- =============================================
CREATE TABLE public.group_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.group_posts(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Conditions
  conditions JSONB DEFAULT '{}',
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  
  -- Rewards
  total_pool NUMERIC(10,2) DEFAULT 0,
  winner_reward NUMERIC(10,2) DEFAULT 0,
  
  -- Participants
  max_participants INTEGER,
  
  status group_deal_status NOT NULL DEFAULT 'open',
  
  -- Results
  result JSONB,
  result_notes TEXT,
  
  created_by UUID NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP DEAL PARTICIPANTS
-- =============================================
CREATE TABLE public.group_deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.group_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  contribution_amount NUMERIC(10,2) DEFAULT 0,
  role TEXT, -- 'participant', 'winner', 'loser'
  
  result JSONB,
  
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(deal_id, user_id)
);

-- =============================================
-- GROUP PROOFS (Evidence Logging)
-- =============================================
CREATE TABLE public.group_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  
  -- What this proof is for
  reference_type TEXT NOT NULL, -- 'task', 'deal', 'general'
  reference_id UUID,
  
  -- Evidence
  description TEXT,
  media_urls TEXT[],
  
  -- Metadata (auto-captured)
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  
  submitted_by UUID NOT NULL,
  
  -- Immutability
  hash TEXT, -- SHA256 hash for verification
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP CONTRIBUTION HISTORY
-- =============================================
CREATE TABLE public.group_contribution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  
  reference_type TEXT, -- 'task', 'deal', 'report', 'manual'
  reference_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP JOIN REQUESTS
-- =============================================
CREATE TABLE public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

-- =============================================
-- GROUP INVITATIONS
-- =============================================
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  
  invited_by UUID NOT NULL,
  invited_user_id UUID,
  invite_code TEXT UNIQUE,
  
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP RULE ACTIONS (Auto-moderation log)
-- =============================================
CREATE TABLE public.group_rule_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  
  rule_type TEXT NOT NULL, -- 'spam_delete', 'post_limit', 'auto_mute', 'auto_kick'
  target_user_id UUID,
  target_post_id UUID,
  
  action_taken TEXT NOT NULL,
  details JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP SELLER PRODUCTS (Seller groups)
-- =============================================
CREATE TABLE public.group_seller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  images TEXT[],
  
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROUP SELLER REVIEWS
-- =============================================
CREATE TABLE public.group_seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.group_seller_products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(product_id, buyer_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_groups_visibility ON public.groups(visibility);
CREATE INDEX idx_groups_owner ON public.groups(owner_id);
CREATE INDEX idx_groups_slug ON public.groups(slug);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_role ON public.group_members(role);

CREATE INDEX idx_group_posts_group ON public.group_posts(group_id);
CREATE INDEX idx_group_posts_author ON public.group_posts(author_id);
CREATE INDEX idx_group_posts_type ON public.group_posts(post_type);
CREATE INDEX idx_group_posts_created ON public.group_posts(created_at DESC);

CREATE INDEX idx_group_tasks_group ON public.group_tasks(group_id);
CREATE INDEX idx_group_tasks_assigned ON public.group_tasks USING GIN (assigned_to);
CREATE INDEX idx_group_tasks_status ON public.group_tasks(status);

CREATE INDEX idx_group_deals_group ON public.group_deals(group_id);
CREATE INDEX idx_group_deals_status ON public.group_deals(status);

CREATE INDEX idx_group_wallet_transactions_group ON public.group_wallet_transactions(group_id);
CREATE INDEX idx_group_contribution_user ON public.group_contribution_history(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_contribution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_rule_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_seller_reviews ENABLE ROW LEVEL SECURITY;

-- Helper function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id 
    AND user_id = _user_id 
    AND is_active = true
  )
$$;

-- Helper function to check group role
CREATE OR REPLACE FUNCTION public.get_group_role(_group_id UUID, _user_id UUID)
RETURNS group_member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.group_members
  WHERE group_id = _group_id 
  AND user_id = _user_id 
  AND is_active = true
  LIMIT 1
$$;

-- Helper function to check if user can manage group
CREATE OR REPLACE FUNCTION public.can_manage_group(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id 
    AND user_id = _user_id 
    AND is_active = true
    AND role IN ('owner', 'manager')
  )
$$;

-- GROUPS: Anyone can view public groups, members can view private/hidden
CREATE POLICY "Public groups visible to all"
ON public.groups FOR SELECT
USING (
  visibility = 'public'
  OR public.is_group_member(id, auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner/Manager can update group"
ON public.groups FOR UPDATE
TO authenticated
USING (public.can_manage_group(id, auth.uid()));

CREATE POLICY "Only owner can delete group"
ON public.groups FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- GROUP MEMBERS
CREATE POLICY "Members visible to group members"
ON public.group_members FOR SELECT
USING (
  public.is_group_member(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND visibility = 'public')
);

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can update own membership"
ON public.group_members FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.can_manage_group(group_id, auth.uid())
);

CREATE POLICY "Manager can remove members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

-- GROUP ROLE PERMISSIONS
CREATE POLICY "Permissions visible to members"
ON public.group_role_permissions FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Manager can manage permissions"
ON public.group_role_permissions FOR ALL
TO authenticated
USING (public.can_manage_group(group_id, auth.uid()));

-- GROUP WALLETS
CREATE POLICY "Wallet visible to members with permission"
ON public.group_wallets FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Only managers can modify wallet"
ON public.group_wallets FOR ALL
TO authenticated
USING (public.can_manage_group(group_id, auth.uid()));

-- GROUP WALLET TRANSACTIONS
CREATE POLICY "Transactions visible to members"
ON public.group_wallet_transactions FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Only managers can add transactions"
ON public.group_wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

-- GROUP POSTS
CREATE POLICY "Posts visible to members"
ON public.group_posts FOR SELECT
USING (
  public.is_group_member(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND visibility = 'public')
);

CREATE POLICY "Members can create posts"
ON public.group_posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Authors can update own posts"
ON public.group_posts FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

CREATE POLICY "Authors/managers can delete posts"
ON public.group_posts FOR DELETE
TO authenticated
USING (
  author_id = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

-- GROUP POST COMMENTS
CREATE POLICY "Comments visible with posts"
ON public.group_post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts p
    WHERE p.id = post_id
    AND (
      public.is_group_member(p.group_id, auth.uid())
      OR EXISTS (SELECT 1 FROM public.groups WHERE id = p.group_id AND visibility = 'public')
    )
  )
);

CREATE POLICY "Members can comment"
ON public.group_post_comments FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_posts p
    WHERE p.id = post_id
    AND public.is_group_member(p.group_id, auth.uid())
  )
);

CREATE POLICY "Authors can update/delete comments"
ON public.group_post_comments FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Authors can delete comments"
ON public.group_post_comments FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- GROUP POST LIKES
CREATE POLICY "Likes visible to all"
ON public.group_post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like"
ON public.group_post_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike"
ON public.group_post_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- GROUP TASKS
CREATE POLICY "Tasks visible to members"
ON public.group_tasks FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members with permission can create tasks"
ON public.group_tasks FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Creators/managers can update tasks"
ON public.group_tasks FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
  OR auth.uid() = ANY(assigned_to)
);

CREATE POLICY "Creators/managers can delete tasks"
ON public.group_tasks FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

-- GROUP DEALS
CREATE POLICY "Deals visible to members"
ON public.group_deals FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create deals"
ON public.group_deals FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Creators/managers can update deals"
ON public.group_deals FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

CREATE POLICY "Creators/managers can delete deals"
ON public.group_deals FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

-- GROUP DEAL PARTICIPANTS
CREATE POLICY "Participants visible to members"
ON public.group_deal_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_deals d
    WHERE d.id = deal_id
    AND public.is_group_member(d.group_id, auth.uid())
  )
);

CREATE POLICY "Users can join deals"
ON public.group_deal_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation"
ON public.group_deal_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- GROUP PROOFS
CREATE POLICY "Proofs visible to members"
ON public.group_proofs FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can submit proofs"
ON public.group_proofs FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

-- GROUP CONTRIBUTION HISTORY
CREATE POLICY "Contribution history visible to members"
ON public.group_contribution_history FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "System can add contribution"
ON public.group_contribution_history FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

-- GROUP JOIN REQUESTS
CREATE POLICY "Requests visible to user and managers"
ON public.group_join_requests FOR SELECT
USING (
  user_id = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

CREATE POLICY "Users can create requests"
ON public.group_join_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can update requests"
ON public.group_join_requests FOR UPDATE
TO authenticated
USING (public.can_manage_group(group_id, auth.uid()));

-- GROUP INVITATIONS
CREATE POLICY "Invitations visible to inviter and managers"
ON public.group_invitations FOR SELECT
USING (
  invited_by = auth.uid()
  OR invited_user_id = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

CREATE POLICY "Members with permission can invite"
ON public.group_invitations FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Inviters can delete invitations"
ON public.group_invitations FOR DELETE
TO authenticated
USING (
  invited_by = auth.uid()
  OR public.can_manage_group(group_id, auth.uid())
);

-- GROUP RULE ACTIONS
CREATE POLICY "Rule actions visible to managers"
ON public.group_rule_actions FOR SELECT
USING (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "System can log actions"
ON public.group_rule_actions FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

-- GROUP SELLER PRODUCTS
CREATE POLICY "Products visible to members"
ON public.group_seller_products FOR SELECT
USING (
  public.is_group_member(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND visibility = 'public')
);

CREATE POLICY "Sellers can create products"
ON public.group_seller_products FOR INSERT
TO authenticated
WITH CHECK (
  seller_id = auth.uid()
  AND public.is_group_member(group_id, auth.uid())
);

CREATE POLICY "Sellers can update own products"
ON public.group_seller_products FOR UPDATE
TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own products"
ON public.group_seller_products FOR DELETE
TO authenticated
USING (seller_id = auth.uid());

-- GROUP SELLER REVIEWS
CREATE POLICY "Reviews visible to all"
ON public.group_seller_reviews FOR SELECT
USING (true);

CREATE POLICY "Buyers can review"
ON public.group_seller_reviews FOR INSERT
TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update reviews"
ON public.group_seller_reviews FOR UPDATE
TO authenticated
USING (buyer_id = auth.uid());

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto create wallet when group is created
CREATE OR REPLACE FUNCTION public.create_group_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_wallets (group_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_group_wallet
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.create_group_wallet();

-- Auto add owner as member when group is created
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  -- Update member count
  UPDATE public.groups SET member_count = 1 WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_owner_as_member
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_owner_as_member();

-- Auto create default role permissions when group is created
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Owner permissions (all true)
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'owner', true, true, true, true, true, true, true, true, true, true, true);
  
  -- Manager permissions
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'manager', true, true, true, true, true, true, true, true, true, false, false);
  
  -- Seller permissions
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'seller', true, true, true, false, true, false, true, false, false, false, false);
  
  -- Member permissions
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'member', true, true, false, false, false, false, false, false, false, false, false);
  
  -- Viewer permissions (limited)
  INSERT INTO public.group_role_permissions (group_id, role, can_post, can_comment, can_create_deal, can_create_task, can_create_poll, can_view_insights, can_invite, can_manage_members, can_manage_posts, can_manage_wallet, can_manage_rules)
  VALUES (NEW.id, 'viewer', false, true, false, false, false, false, false, false, false, false, false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_default_permissions
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_permissions();

-- Update member count on membership changes
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Update post count on post changes
CREATE OR REPLACE FUNCTION public.update_group_post_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_post_count
  AFTER INSERT OR DELETE ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_post_count();

-- Update wallet balance on transactions
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_wallet_balance
  BEFORE INSERT ON public.group_wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_balance();

-- Update contribution points
CREATE OR REPLACE FUNCTION public.update_contribution_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_members 
  SET contribution_points = contribution_points + NEW.points_change,
      updated_at = now()
  WHERE group_id = NEW.group_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_contribution_points
  AFTER INSERT ON public.group_contribution_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contribution_points();

-- Generate join code for groups
CREATE OR REPLACE FUNCTION public.generate_group_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_type IN ('code', 'link') AND NEW.join_code IS NULL THEN
    NEW.join_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_join_code
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_group_join_code();

-- Updated at trigger for groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for group_members
CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for group_posts
CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for group_tasks
CREATE TRIGGER update_group_tasks_updated_at
  BEFORE UPDATE ON public.group_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for group_deals
CREATE TRIGGER update_group_deals_updated_at
  BEFORE UPDATE ON public.group_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();