-- Create checklists table
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'personal', -- personal, group
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  progress_percent DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist tasks table
CREATE TABLE public.checklist_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, done
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  deadline TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task assignees table
CREATE TABLE public.checklist_task_assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.checklist_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Create task comments table
CREATE TABLE public.checklist_task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.checklist_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_task_comments ENABLE ROW LEVEL SECURITY;

-- Checklists policies
CREATE POLICY "Users can view their own checklists" 
ON public.checklists FOR SELECT 
USING (auth.uid() = user_id OR (scope = 'group' AND group_id IN (
  SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
)));

CREATE POLICY "Users can create checklists" 
ON public.checklists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists" 
ON public.checklists FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists" 
ON public.checklists FOR DELETE 
USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view tasks of their checklists" 
ON public.checklist_tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.checklists 
  WHERE id = checklist_id AND (user_id = auth.uid() OR (scope = 'group' AND group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )))
));

CREATE POLICY "Users can manage tasks of their checklists" 
ON public.checklist_tasks FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.checklists 
  WHERE id = checklist_id AND user_id = auth.uid()
));

-- Assignees policies
CREATE POLICY "Users can view assignees" 
ON public.checklist_task_assignees FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.checklist_tasks t
  JOIN public.checklists c ON c.id = t.checklist_id
  WHERE t.id = task_id AND (c.user_id = auth.uid() OR (c.scope = 'group' AND c.group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )))
));

CREATE POLICY "Users can manage assignees of their tasks" 
ON public.checklist_task_assignees FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.checklist_tasks t
  JOIN public.checklists c ON c.id = t.checklist_id
  WHERE t.id = task_id AND c.user_id = auth.uid()
));

-- Comments policies
CREATE POLICY "Users can view comments" 
ON public.checklist_task_comments FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.checklist_tasks t
  JOIN public.checklists c ON c.id = t.checklist_id
  WHERE t.id = task_id AND (c.user_id = auth.uid() OR (c.scope = 'group' AND c.group_id IN (
    SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
  )))
));

CREATE POLICY "Users can create comments" 
ON public.checklist_task_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.checklist_task_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_checklists_user_id ON public.checklists(user_id);
CREATE INDEX idx_checklists_group_id ON public.checklists(group_id);
CREATE INDEX idx_checklist_tasks_checklist_id ON public.checklist_tasks(checklist_id);
CREATE INDEX idx_checklist_task_assignees_task_id ON public.checklist_task_assignees(task_id);
CREATE INDEX idx_checklist_task_comments_task_id ON public.checklist_task_comments(task_id);