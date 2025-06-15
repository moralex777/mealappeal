-- Fix existing profiles that have id but missing user_id
-- This updates old profiles to work with the new column structure

-- Update profiles where user_id is null but id exists
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL AND id IS NOT NULL;

-- Update profiles where email is null but we can get it from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.user_id = au.id AND (p.email IS NULL OR p.email = '');

-- Verify the fix
SELECT 'Profile fix completed' as status, COUNT(*) as profiles_updated
FROM public.profiles 
WHERE user_id IS NOT NULL;