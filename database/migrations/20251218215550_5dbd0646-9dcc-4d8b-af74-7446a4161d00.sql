-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to generate username from email
CREATE OR REPLACE FUNCTION public.generate_username_from_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from email (before @)
  base_username := lower(regexp_replace(split_part(p_email, '@', 1), '[^a-z0-9]', '', 'g'));
  
  -- If empty, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  -- Truncate to 20 chars
  base_username := substring(base_username, 1, 20);
  
  final_username := base_username;
  
  -- Check for uniqueness and add number if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  
  RETURN final_username;
END;
$$;

-- Update existing profiles with generated usernames
UPDATE public.profiles 
SET username = generate_username_from_email(email)
WHERE username IS NULL;

-- Update handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    generate_username_from_email(NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;