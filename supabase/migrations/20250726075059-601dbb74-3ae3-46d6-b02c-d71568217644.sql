-- Create helper functions for notifications
CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.read,
    n.created_at
  FROM public.notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications 
  SET read = TRUE 
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications 
  SET read = TRUE 
  WHERE user_id = p_user_id AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;