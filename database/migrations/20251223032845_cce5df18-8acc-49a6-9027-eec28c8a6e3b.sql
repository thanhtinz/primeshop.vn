
-- Add missing columns to design_revision_packages if table exists
ALTER TABLE public.design_revision_packages
ADD COLUMN IF NOT EXISTS buyer_id UUID,
ADD COLUMN IF NOT EXISTS seller_id UUID;

-- Update policies for design_revision_packages
DROP POLICY IF EXISTS "Buyers can view their revision packages" ON public.design_revision_packages;
DROP POLICY IF EXISTS "Sellers can view their revision packages" ON public.design_revision_packages;
DROP POLICY IF EXISTS "Buyers can create revision packages" ON public.design_revision_packages;
DROP POLICY IF EXISTS "Buyers can update their revision packages" ON public.design_revision_packages;

CREATE POLICY "Buyers can view their revision packages" ON public.design_revision_packages
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view their revision packages" ON public.design_revision_packages
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Buyers can create revision packages" ON public.design_revision_packages
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their revision packages" ON public.design_revision_packages
  FOR UPDATE USING (buyer_id = auth.uid());

-- =====================================================
-- 4. MILESTONE-BASED ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.design_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.design_orders(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  amount NUMERIC(15,2) DEFAULT 0,
  escrow_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 2,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.design_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order participants can view milestones" ON public.design_milestones;
DROP POLICY IF EXISTS "Sellers can update milestones" ON public.design_milestones;

CREATE POLICY "Order participants can view milestones" ON public.design_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_orders o 
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Sellers can update milestones" ON public.design_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.design_orders o 
      WHERE o.id = order_id AND o.seller_id = auth.uid()
    )
  );

-- Add milestone mode to orders
ALTER TABLE public.design_orders
ADD COLUMN IF NOT EXISTS is_milestone_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_milestone_id UUID;

-- =====================================================
-- 5. TEAM PERMISSIONS IN TICKET
-- =====================================================

CREATE TABLE IF NOT EXISTS public.design_ticket_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.design_orders(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID NOT NULL,
  collaborator_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  permissions TEXT[] DEFAULT ARRAY['view', 'message'],
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ
);

ALTER TABLE public.design_ticket_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view their collaborators" ON public.design_ticket_collaborators;
DROP POLICY IF EXISTS "Sellers can add collaborators" ON public.design_ticket_collaborators;
DROP POLICY IF EXISTS "Sellers can update collaborators" ON public.design_ticket_collaborators;
DROP POLICY IF EXISTS "Sellers can delete collaborators" ON public.design_ticket_collaborators;

CREATE POLICY "Sellers can view their collaborators" ON public.design_ticket_collaborators
  FOR SELECT USING (seller_id = auth.uid() OR collaborator_id = auth.uid());

CREATE POLICY "Sellers can add collaborators" ON public.design_ticket_collaborators
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update collaborators" ON public.design_ticket_collaborators
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete collaborators" ON public.design_ticket_collaborators
  FOR DELETE USING (seller_id = auth.uid());

-- Internal team notes
CREATE TABLE IF NOT EXISTS public.design_ticket_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.design_orders(id) ON DELETE CASCADE NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  mentioned_user_ids UUID[],
  attachments JSONB,
  is_task BOOLEAN DEFAULT false,
  task_status TEXT,
  task_assignee_id UUID,
  task_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.design_ticket_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team can view internal notes" ON public.design_ticket_internal_notes;
DROP POLICY IF EXISTS "Team can create internal notes" ON public.design_ticket_internal_notes;
DROP POLICY IF EXISTS "Authors can update their notes" ON public.design_ticket_internal_notes;

CREATE POLICY "Team can view internal notes" ON public.design_ticket_internal_notes
  FOR SELECT USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.design_ticket_collaborators c 
      WHERE c.ticket_id = design_ticket_internal_notes.ticket_id 
      AND (c.seller_id = auth.uid() OR c.collaborator_id = auth.uid())
      AND c.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.design_orders o 
      WHERE o.id = order_id AND o.seller_id = auth.uid()
    )
  );

CREATE POLICY "Team can create internal notes" ON public.design_ticket_internal_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_ticket_collaborators c 
      WHERE c.ticket_id = design_ticket_internal_notes.ticket_id 
      AND (c.seller_id = auth.uid() OR c.collaborator_id = auth.uid())
      AND c.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.design_orders o 
      WHERE o.id = order_id AND o.seller_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their notes" ON public.design_ticket_internal_notes
  FOR UPDATE USING (author_id = auth.uid());

-- Add revision pricing to design_services
ALTER TABLE public.design_services
ADD COLUMN IF NOT EXISTS extra_revision_price NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supports_milestone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milestone_config JSONB;
