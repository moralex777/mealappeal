-- Fix the handle_new_user trigger to properly extract emails for ALL users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Get email from various possible sources
  DECLARE
    user_email text;
    user_full_name text;
  BEGIN
    -- Try to get email from different sources
    user_email := COALESCE(
      new.email,  -- Direct email field
      new.raw_user_meta_data->>'email',  -- OAuth providers often store here
      new.raw_user_meta_data->>'email_verified',  -- Some providers use this
      new.raw_app_meta_data->>'email'  -- Fallback
    );
    
    -- Get full name with fallbacks
    user_full_name := COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(COALESCE(user_email, 'user@unknown.com'), '@', 1)
    );
    
    -- Log for debugging (can be removed later)
    RAISE NOTICE 'Creating profile for user %, email: %, full_name: %', new.id, user_email, user_full_name;
    
    -- Insert the profile
    INSERT INTO public.profiles (
      id, 
      user_id, 
      email, 
      full_name, 
      created_at, 
      updated_at,
      subscription_tier,
      meal_count
    )
    VALUES (
      new.id,
      new.id,
      user_email,
      user_full_name,
      now(),
      now(),
      'free',
      0
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      updated_at = now();
    
    RETURN new;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing profiles with NULL emails
UPDATE public.profiles p
SET email = COALESCE(
  u.email,
  u.raw_user_meta_data->>'email',
  u.raw_user_meta_data->>'email_verified',
  u.raw_app_meta_data->>'email'
)
FROM auth.users u
WHERE p.id = u.id 
  AND p.email IS NULL;

-- Verify the fix
SELECT 
  p.id,
  p.email as profile_email,
  p.full_name,
  u.email as auth_email,
  u.raw_user_meta_data->>'email' as meta_email,
  u.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY u.created_at DESC;

-- Check for any remaining NULL emails
SELECT COUNT(*) as null_email_count
FROM public.profiles
WHERE email IS NULL;