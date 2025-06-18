-- Fix Profile User ID Mismatch
-- This migration ensures all profiles have both id and user_id set to the same value
-- This fixes authentication issues where profile lookups fail

-- Update any profiles where user_id is NULL or different from id
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL OR user_id != id;

-- Add a check constraint to ensure they stay in sync (optional, for data integrity)
-- This prevents future mismatches
ALTER TABLE public.profiles 
ADD CONSTRAINT check_user_id_matches_id 
CHECK (user_id = id);

-- Verify the fix
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN user_id = id THEN 1 END) as matching_ids,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
  COUNT(CASE WHEN user_id != id THEN 1 END) as mismatched_ids
FROM public.profiles;

-- Update the profiles table structure to ensure user_id column exists
-- (in case some deployments are missing it)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Update RLS policies to work with both id and user_id
-- (These are safe to run multiple times)
DROP POLICY IF EXISTS "Users can view their own profile by user_id" ON public.profiles;
CREATE POLICY "Users can view their own profile by user_id" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Keep the original policy for backward compatibility
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Update policy for profile updates
DROP POLICY IF EXISTS "Users can update their own profile by user_id" ON public.profiles;
CREATE POLICY "Users can update their own profile by user_id" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Keep the original update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Recreate the profile creation function with the fix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    full_name,
    avatar_url,
    subscription_tier,
    subscription_expires_at,
    billing_cycle,
    meal_count,
    monthly_shares_used,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,  -- Ensure user_id matches id
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    NULL,
    'free',
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.id,  -- Ensure user_id is set even if profile already exists
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (safe to run multiple times)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'Profile user_id mismatch fix completed successfully';
END $$;