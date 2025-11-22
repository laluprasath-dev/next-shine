
-- Add device_info column to event_registrations table to capture device information
ALTER TABLE public.event_registrations 
ADD COLUMN device_info JSONB DEFAULT NULL;

-- Update the column comment for clarity
COMMENT ON COLUMN public.event_registrations.device_info IS 'Stores device information including type, platform, browser, screen resolution, etc.';
