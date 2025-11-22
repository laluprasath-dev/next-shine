
-- Create storage buckets for profiles and posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor', 'vendor', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the profiles bucket
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Create policies for the posts bucket
CREATE POLICY "Anyone can view post images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'posts'
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'posts' AND
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.user_id = auth.uid() AND
    posts.media_urls @> ARRAY[storage.url_path(bucket_id, name)]
  )
);

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
