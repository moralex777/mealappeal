-- Fix any existing users who don't have profiles
INSERT INTO public.profiles (id, user_id, email, full_name, created_at, updated_at)
SELECT 
  u.id,  -- Use the user's ID as the profile ID (due to foreign key constraint)
  u.id,  -- Also use it as user_id
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Verify the fix
SELECT 
  'Users without profiles:' as check_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL

UNION ALL

SELECT 
  'Total users:' as check_type,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
  'Total profiles:' as check_type,
  COUNT(*) as count
FROM public.profiles;