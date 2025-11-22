-- Fix the trigger function by removing the problematic JWT claims extraction
CREATE OR REPLACE FUNCTION public.handle_purchase_notification()
RETURNS trigger AS $$
DECLARE
  product_name TEXT;
  user_email TEXT;
  user_phone TEXT;
  notification_data JSONB;
  request_id uuid;
BEGIN
  -- Get product name
  SELECT name INTO product_name 
  FROM public.products 
  WHERE id = NEW.product_id;
  
  -- Get user email and phone from profiles
  SELECT 
    COALESCE(
      (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = NEW.user_id),
      profiles.username || '@example.com'
    ) as email,
    profiles.mobile_phone
  INTO user_email, user_phone
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Create notification data
  notification_data := jsonb_build_object(
    'product_id', NEW.product_id,
    'order_id', NEW.order_id,
    'product_name', COALESCE(product_name, 'Unknown Product')
  );
  
  -- Call the send-notification edge function using the correct method
  SELECT net.http_post(
    'https://rzrroghnzintpxspwauf.supabase.co/functions/v1/send-notification',
    jsonb_build_object(
      'user_id', NEW.user_id,
      'notification_id', gen_random_uuid(),
      'email', COALESCE(user_email, 'noreply@shiningmotors.com'),
      'phone', user_phone,
      'type', 'product_purchase',
      'title', 'Purchase Confirmed',
      'message', 'Your purchase of "' || COALESCE(product_name, 'Unknown Product') || '" has been confirmed!',
      'data', notification_data
    )::text,
    'application/json'
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;