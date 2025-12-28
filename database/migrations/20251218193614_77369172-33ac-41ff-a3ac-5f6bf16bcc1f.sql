-- Add seller_id to user_posts for shop posts
ALTER TABLE public.user_posts ADD COLUMN seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE;

-- Create index for seller posts
CREATE INDEX idx_user_posts_seller_id ON public.user_posts(seller_id);

-- Update RLS policy to allow sellers to manage their shop posts
CREATE POLICY "Sellers can manage their shop posts"
ON public.user_posts
FOR ALL
USING (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  seller_id IN (
    SELECT id FROM public.sellers WHERE user_id = auth.uid()
  )
);

-- Allow everyone to view shop posts
CREATE POLICY "Anyone can view shop posts"
ON public.user_posts
FOR SELECT
USING (seller_id IS NOT NULL);