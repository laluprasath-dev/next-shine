-- Create user_purchases table for tracking purchase notifications
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  order_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" 
ON public.user_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases" 
ON public.user_purchases 
FOR INSERT 
WITH CHECK (true);

-- Add index for better performance
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases(user_id);
CREATE INDEX idx_user_purchases_product_id ON public.user_purchases(product_id);