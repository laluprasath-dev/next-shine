-- Remove any existing problematic triggers or functions
DROP FUNCTION IF EXISTS notify_purchase_via_http CASCADE;
DROP TRIGGER IF EXISTS trigger_purchase_notification ON public.user_purchases CASCADE;

-- Create a simple notification function that works with the existing system
CREATE OR REPLACE FUNCTION notify_purchase_insert()
RETURNS trigger AS $$
BEGIN
  -- Insert into notifications table instead of making HTTP calls
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    read
  ) VALUES (
    NEW.user_id,
    'purchase_confirmation',
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

-- Create trigger for purchase notifications
CREATE TRIGGER trigger_purchase_notification
  AFTER INSERT ON public.user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_purchase_insert();