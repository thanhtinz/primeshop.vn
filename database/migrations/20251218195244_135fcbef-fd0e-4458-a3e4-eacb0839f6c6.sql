-- Add personal info fields to profiles table (like Facebook)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS workplace TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS relationship_status TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.bio IS 'User bio/about me';
COMMENT ON COLUMN public.profiles.location IS 'Current city/location';
COMMENT ON COLUMN public.profiles.workplace IS 'Current workplace';
COMMENT ON COLUMN public.profiles.school IS 'School/education';
COMMENT ON COLUMN public.profiles.relationship_status IS 'Relationship status';
COMMENT ON COLUMN public.profiles.website IS 'Personal website URL';