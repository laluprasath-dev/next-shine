-- Apply product-images bucket migration
-- This file creates the product-images storage bucket and necessary policies

-- Create product-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;

-- Create policies for the product-images bucket
-- Anyone can view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'product-images'
);

-- Users can update their own product images
CREATE POLICY "Users can update their own product images"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'product-images'
);

-- Users can delete their own product images
CREATE POLICY "Users can delete their own product images"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'product-images'
);

-- Also create/update the products bucket for compatibility (used in ProductCreate.tsx)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own products" ON storage.objects;

-- Create policies for the products bucket
CREATE POLICY "Anyone can view products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'products'
);

CREATE POLICY "Users can update their own products"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'products'
);

CREATE POLICY "Users can delete their own products"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'products'
);

