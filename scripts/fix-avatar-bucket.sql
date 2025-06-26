-- Check if user-avatars bucket exists and create if missing
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-avatars') THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
    
    RAISE NOTICE 'Created user-avatars bucket';
  ELSE
    RAISE NOTICE 'user-avatars bucket already exists';
  END IF;
END $$;

-- Verify the bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'user-avatars';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND qual::text LIKE '%user-avatars%'
ORDER BY policyname;