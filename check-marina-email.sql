-- Check if marina.morari03@gmail.com exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'marina.morari03@gmail.com'
   OR email ILIKE '%marina.morari%';

-- Check if there's a profile for this email
SELECT 
  id,
  user_id,
  email,
  full_name,
  created_at,
  updated_at
FROM public.profiles
WHERE email = 'marina.morari03@gmail.com'
   OR email ILIKE '%marina.morari%'
   OR full_name ILIKE '%marina%';

-- Check if there might be a typo or case sensitivity issue
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE LOWER(email) = LOWER('marina.morari03@gmail.com');

-- See all recent signup attempts (last 24 hours)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Check for any auth logs or errors (if available)
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT email) as unique_emails,
  COUNT(CASE WHEN email LIKE '%gmail.com' THEN 1 END) as gmail_users,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
FROM auth.users;