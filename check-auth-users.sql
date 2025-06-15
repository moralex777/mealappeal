-- Check auth.users structure and data
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at,
    CASE 
        WHEN email IS NULL THEN 'NULL_EMAIL'
        WHEN email = '' THEN 'EMPTY_EMAIL'
        ELSE 'HAS_EMAIL'
    END as email_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- Check for any patterns in NULL emails
SELECT 
    COUNT(*) as total_users,
    COUNT(email) as users_with_email,
    COUNT(*) - COUNT(email) as users_without_email
FROM auth.users;

-- Check profiles table for comparison
SELECT 
    p.id,
    p.user_id,
    p.email,
    u.email as auth_email,
    CASE 
        WHEN p.email IS NULL AND u.email IS NOT NULL THEN 'MISSING_IN_PROFILE'
        WHEN p.email IS NULL AND u.email IS NULL THEN 'MISSING_IN_BOTH'
        WHEN p.email IS NOT NULL AND u.email IS NULL THEN 'ONLY_IN_PROFILE'
        ELSE 'SYNCED'
    END as sync_status
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;