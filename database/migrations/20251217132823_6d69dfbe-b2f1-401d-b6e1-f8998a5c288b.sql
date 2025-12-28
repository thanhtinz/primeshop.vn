-- Create translations cache table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  source_lang VARCHAR(10) NOT NULL DEFAULT 'vi',
  target_lang VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_text, source_lang, target_lang)
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read translations (public cache)
CREATE POLICY "Translations are publicly readable" 
ON public.translations 
FOR SELECT 
USING (true);

-- Allow service role to insert/update translations
CREATE POLICY "Service role can manage translations" 
ON public.translations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_translations_lookup ON public.translations(source_text, source_lang, target_lang);

-- Create trigger for updated_at
CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON public.translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();