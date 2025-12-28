-- Add English version columns to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS subject_en TEXT,
ADD COLUMN IF NOT EXISTS body_en TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Update existing templates with categories
COMMENT ON COLUMN public.email_templates.subject_en IS 'English version of email subject';
COMMENT ON COLUMN public.email_templates.body_en IS 'English version of email body';
COMMENT ON COLUMN public.email_templates.description IS 'Description of what the template is for';
COMMENT ON COLUMN public.email_templates.category IS 'Template category: order, user, referral, ticket, auction, other';