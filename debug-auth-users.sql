-- Debug query to see what's in auth.users table
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for gmail users
SELECT 
  id,
  email,
  raw_user_meta_data->>'email' as meta_email,
  raw_user_meta_data->>'full_name' as meta_name,
  created_at
FROM auth.users
WHERE email LIKE '%gmail.com%' 
   OR raw_user_meta_data->>'email' LIKE '%gmail.com%'
ORDER BY created_at DESC;

-- See if there are any constraints or triggers preventing email storage
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- Check if there's a policy blocking email updates
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';