-- Enhanced trigger that handles OAuth users and email edge cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Try to get email from multiple sources
  DECLARE
    user_email text;
    user_full_name text;
  BEGIN
    -- First try direct email field
    user_email := new.email;
    
    -- If email is null, try to get it from raw_user_meta_data (OAuth users)
    IF user_email IS NULL OR user_email = '' THEN
      user_email := new.raw_user_meta_data->>'email';
    END IF;
    
    -- If still no email, try email_verified field (some providers use this)
    IF user_email IS NULL OR user_email = '' THEN
      user_email := new.raw_user_meta_data->>'email_verified';
    END IF;
    
    -- Get full name from various sources
    user_full_name := COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      -- If we have an email, use the part before @
      CASE 
        WHEN user_email IS NOT NULL AND user_email != '' 
        THEN split_part(user_email, '@', 1)
        ELSE 'User'
      END
    );
    
    -- Insert the profile
    INSERT INTO public.profiles (id, user_id, email, full_name, created_at, updated_at)
    VALUES (
      new.id,
      new.id,
      user_email,
      user_full_name,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
    
    RETURN new;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing profiles with NULL emails
UPDATE public.profiles p
SET 
  email = COALESCE(
    u.email,
    u.raw_user_meta_data->>'email',
    u.raw_user_meta_data->>'email_verified'
  ),
  updated_at = now()
FROM auth.users u
WHERE p.user_id = u.id
AND p.email IS NULL
AND (
  u.email IS NOT NULL 
  OR u.raw_user_meta_data->>'email' IS NOT NULL
  OR u.raw_user_meta_data->>'email_verified' IS NOT NULL
);

-- Verify the fix
SELECT 
  'Profiles still without emails after fix' as check_type,
  COUNT(*) as count,
  array_agg(p.id) as user_ids
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.email IS NULL
GROUP BY check_type;