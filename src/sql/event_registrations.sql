
-- Create a table for event registrations
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Add Row Level Security
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own registrations"
  ON public.event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register themselves for events"
  ON public.event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for admins to manage registrations
CREATE POLICY "Admins can manage all registrations"
  ON public.event_registrations
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );
