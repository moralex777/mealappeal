-- Complete fix for user-avatars bucket including RLS policies

-- 1. Check if user-avatars bucket exists and create if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
    RAISE NOTICE 'Created user-avatars bucket';
  ELSE
    RAISE NOTICE 'user-avatars bucket already exists';
  END IF;
END $$;

-- 2. Drop existing policies for user-avatars bucket (if any)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;

-- 3. Create new RLS policies for user-avatars bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access for avatars (so anyone can see avatars)
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'user-avatars');

-- 4. Verify the setup
SELECT 'Bucket Info:' as info;
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'user-avatars';

SELECT '' as spacer;
SELECT 'RLS Policies:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND qual::text LIKE '%user-avatars%'
ORDER BY policyname;

-- 5. Test if bucket is accessible
SELECT '' as spacer;
SELECT 'Testing bucket accessibility...' as info;
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'user-avatars' AND public = true
) as bucket_is_public;