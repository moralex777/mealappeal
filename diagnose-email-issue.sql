-- First, let's check what columns are available in auth.users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name IN ('email', 'email_confirmed_at', 'raw_user_meta_data')
ORDER BY ordinal_position;

-- Check if there are any OAuth users (they might not have email in the usual place)
SELECT 
    id,
    email,
    raw_user_meta_data->>'email' as meta_email,
    raw_user_meta_data->>'provider' as provider,
    raw_user_meta_data->>'full_name' as full_name,
    created_at,
    CASE 
        WHEN email IS NOT NULL THEN 'HAS_EMAIL'
        WHEN raw_user_meta_data->>'email' IS NOT NULL THEN 'EMAIL_IN_META'
        ELSE 'NO_EMAIL'
    END as email_location
FROM auth.users
WHERE email IS NULL OR email = ''
LIMIT 20;

-- Check trigger permissions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as security_definer,
    pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- Check if the trigger might be failing silently
SELECT 
    'Profiles with NULL emails' as check_type,
    COUNT(*) as count
FROM profiles
WHERE email IS NULL

UNION ALL

SELECT 
    'Auth users with NULL emails' as check_type,
    COUNT(*) as count
FROM auth.users
WHERE email IS NULL

UNION ALL

SELECT 
    'Profiles with non-propertytalents emails that are NULL' as check_type,
    COUNT(*) as count
FROM profiles
WHERE email IS NULL 
AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email LIKE '%@propertytalents.com'
);