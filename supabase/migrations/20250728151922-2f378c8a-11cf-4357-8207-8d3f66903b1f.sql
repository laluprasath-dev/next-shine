-- Add mobile phone number field to profiles table
ALTER TABLE public.profiles ADD COLUMN mobile_phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.mobile_phone IS 'User mobile phone number for SMS notifications';

-- Update the notifications dropdown to show only recent 5 notifications
-- This will be handled in the frontend component, no database changes needed for this