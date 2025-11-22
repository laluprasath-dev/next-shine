
-- Create wishlist table to store user's wishlist items
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'vehicle')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own wishlist items
CREATE POLICY "Users can view their own wishlist items" 
  ON public.wishlist 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to add items to their wishlist
CREATE POLICY "Users can add items to their wishlist" 
  ON public.wishlist 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to remove items from their wishlist
CREATE POLICY "Users can remove items from their wishlist" 
  ON public.wishlist 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_item ON public.wishlist(item_id, item_type);
