-- Apply vendor storage bucket migration
-- Run this in your Supabase SQL editor

-- Add vendor storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor', 'vendor', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the vendor bucket
CREATE POLICY "Anyone can view vendor images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor');

CREATE POLICY "Authenticated users can upload vendor images"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor'
);

CREATE POLICY "Users can update their own vendor images"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own vendor images"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'vendor' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);
