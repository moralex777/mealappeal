-- Investigation and fix for share_reset_date showing future dates
-- Issue: share_reset_date shows July 16, 2025 when today is June 17, 2025

-- 1. First, let's check the current state
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN share_reset_date > CURRENT_DATE THEN 1 END) as future_dates,
  MIN(share_reset_date) as earliest_date,
  MAX(share_reset_date) as latest_date,
  CURRENT_DATE as today
FROM profiles;

-- 2. Show sample of profiles with future dates
SELECT 
  id, 
  email, 
  share_reset_date,
  created_at,
  CURRENT_DATE as today,
  share_reset_date - CURRENT_DATE as days_in_future
FROM profiles
WHERE share_reset_date > CURRENT_DATE
LIMIT 10;

-- 3. Check if there's a default value on the column
SELECT 
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'share_reset_date';

-- 4. Check for any triggers that might be setting this date
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 5. FIX: Update all future share_reset_dates to current date
UPDATE profiles 
SET 
  share_reset_date = CURRENT_DATE,
  updated_at = NOW()
WHERE share_reset_date > CURRENT_DATE;

-- 6. If the column has a bad default, fix it (run in Supabase dashboard)
-- ALTER TABLE profiles 
-- ALTER COLUMN share_reset_date 
-- SET DEFAULT CURRENT_DATE;

-- 7. Verify the fix
SELECT 
  COUNT(*) as profiles_fixed
FROM profiles
WHERE share_reset_date = CURRENT_DATE;

-- 8. Create a function to ensure share_reset_date is never in the future
CREATE OR REPLACE FUNCTION check_share_reset_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If share_reset_date is in the future, set it to current date
  IF NEW.share_reset_date > CURRENT_DATE THEN
    NEW.share_reset_date = CURRENT_DATE;
  END IF;
  
  -- If share_reset_date is null, set it to current date
  IF NEW.share_reset_date IS NULL THEN
    NEW.share_reset_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS enforce_share_reset_date ON profiles;
CREATE TRIGGER enforce_share_reset_date
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_share_reset_date();

-- 10. Test the trigger works
-- This should set share_reset_date to CURRENT_DATE, not the future date
UPDATE profiles 
SET share_reset_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Check it was corrected
SELECT id, share_reset_date, CURRENT_DATE 
FROM profiles 
WHERE id = (SELECT id FROM profiles LIMIT 1);