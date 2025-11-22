-- Create notifications table for product purchase related notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product_purchase', 'product_update', 'order_status')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for system to insert notifications
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create user_purchases table to track user purchases for notifications
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, order_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for user_purchases
CREATE POLICY "Users can view their own purchases" 
ON public.user_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases" 
ON public.user_purchases 
FOR INSERT 
WITH CHECK (true);

-- Function to send notification via edge function
CREATE OR REPLACE FUNCTION send_notification_to_user(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_email TEXT;
  user_phone TEXT;
BEGIN
  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data
  ) RETURNING id INTO notification_id;
  
  -- Get user email and phone from profiles
  SELECT 
    (auth.users.raw_user_meta_data->>'email'),
    (profiles.tag->>0) -- assuming phone is stored in tag array
  INTO user_email, user_phone
  FROM auth.users
  LEFT JOIN public.profiles ON profiles.id = auth.users.id
  WHERE auth.users.id = p_user_id;
  
  -- Call edge function to send email and SMS
  PERFORM net.http_post(
    'https://rzrroghnzintpxspwauf.supabase.co/functions/v1/send-notification',
    jsonb_build_object(
      'user_id', p_user_id,
      'notification_id', notification_id,
      'email', user_email,
      'phone', user_phone,
      'type', p_type,
      'title', p_title,
      'message', p_message,
      'data', p_data
    )::text,
    'application/json'
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create purchase notification with SMS and Email
CREATE OR REPLACE FUNCTION create_purchase_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  user_email TEXT;
BEGIN
  -- Get product name
  SELECT name INTO product_name 
  FROM public.products 
  WHERE id = NEW.product_id;
  
  -- Send notification
  PERFORM send_notification_to_user(
    NEW.user_id,
    'product_purchase',
    'Purchase Confirmed',
    'Your purchase of "' || product_name || '" has been confirmed!',
    jsonb_build_object(
      'product_id', NEW.product_id,
      'order_id', NEW.order_id,
      'product_name', product_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create product update notification with SMS and Email
CREATE OR REPLACE FUNCTION create_product_update_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Only notify if product details changed (not just inventory)
  IF OLD.name IS DISTINCT FROM NEW.name OR 
     OLD.description IS DISTINCT FROM NEW.description OR 
     OLD.price IS DISTINCT FROM NEW.price OR
     OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Notify all users who purchased this product
    FOR user_record IN 
      SELECT DISTINCT user_id 
      FROM public.user_purchases 
      WHERE product_id = NEW.id
    LOOP
      PERFORM send_notification_to_user(
        user_record.user_id,
        'product_update',
        'Product Update',
        'A product you purchased ("' || NEW.name || '") has been updated.',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'changes', jsonb_build_object(
            'name_changed', OLD.name IS DISTINCT FROM NEW.name,
            'description_changed', OLD.description IS DISTINCT FROM NEW.description,
            'price_changed', OLD.price IS DISTINCT FROM NEW.price,
            'status_changed', OLD.status IS DISTINCT FROM NEW.status
          )
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_purchase_notification ON public.user_purchases;
DROP TRIGGER IF EXISTS trigger_product_update_notification ON public.products;

-- Create trigger for purchase notifications
CREATE TRIGGER trigger_purchase_notification
  AFTER INSERT ON public.user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION create_purchase_notification();

-- Create trigger for product update notifications
CREATE TRIGGER trigger_product_update_notification
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_update_notification();