-- Check if user_purchases table exists and its constraints
SELECT table_name, constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_purchases';

-- Create user_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  order_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, order_id)
);

-- Enable RLS
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

-- Create or replace the trigger function to handle purchases and send notifications
CREATE OR REPLACE FUNCTION public.handle_purchase_notification()
RETURNS trigger AS $$
DECLARE
  product_name TEXT;
  notification_data JSONB;
BEGIN
  -- Get product name
  SELECT name INTO product_name 
  FROM public.products 
  WHERE id = NEW.product_id;
  
  -- Create notification data
  notification_data := jsonb_build_object(
    'product_id', NEW.product_id,
    'order_id', NEW.order_id,
    'product_name', COALESCE(product_name, 'Unknown Product')
  );
  
  -- Insert notification directly (this will trigger realtime)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  ) VALUES (
    NEW.user_id,
    'product_purchase',
    'Purchase Confirmed',
    'Your purchase of "' || COALESCE(product_name, 'Unknown Product') || '" has been confirmed!',
    notification_data,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_purchases table
DROP TRIGGER IF EXISTS trigger_purchase_notification ON public.user_purchases;
CREATE TRIGGER trigger_purchase_notification
  AFTER INSERT ON public.user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_notification();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;