-- Update background_music table to support YouTube/Spotify
ALTER TABLE public.background_music 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'direct' CHECK (source_type IN ('direct', 'youtube', 'spotify')),
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS embed_url TEXT;

-- Add comment
COMMENT ON COLUMN public.background_music.source_type IS 'Type of music source: direct (mp3 url), youtube, spotify';
COMMENT ON COLUMN public.background_music.source_id IS 'Video/track ID from YouTube or Spotify';
COMMENT ON COLUMN public.background_music.embed_url IS 'Embed URL for iframe player';