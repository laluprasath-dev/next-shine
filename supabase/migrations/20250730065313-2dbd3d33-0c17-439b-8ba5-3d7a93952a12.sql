-- Check current constraint and fix the notification type
-- First, let's see what values are allowed
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%notifications_type%';

-- Update the trigger to use an allowed notification type
CREATE OR REPLACE FUNCTION notify_purchase_insert()
RETURNS trigger AS $$
BEGIN
  -- Insert into notifications table with a valid type
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  ) VALUES (
    NEW.user_id,
    'product_purchase',  -- Using existing valid type instead
    'Purchase Confirmed',
    'Your purchase has been recorded successfully.',
    jsonb_build_object(
      'order_id', NEW.order_id,
      'product_id', NEW.product_id
    ),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;