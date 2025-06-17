-- Read-only test script for share_reset_date issue
-- This script ONLY reads data and makes no changes to the database
-- Safe to run in production for diagnostics

-- ============================================
-- DIAGNOSTIC QUERIES (READ-ONLY)
-- ============================================

-- 1. Create temporary view for analysis (exists only for this session)
CREATE TEMP VIEW IF NOT EXISTS share_date_analysis AS
SELECT 
  id,
  email,
  share_reset_date,
  created_at,
  updated_at,
  CURRENT_DATE as today,
  CASE 
    WHEN share_reset_date IS NULL THEN 'NULL - No date set'
    WHEN share_reset_date > CURRENT_DATE THEN 'FUTURE - Needs fix'
    WHEN share_reset_date = CURRENT_DATE THEN 'TODAY - Correct'
    WHEN share_reset_date < CURRENT_DATE THEN 'PAST - OK'
  END as status,
  CASE 
    WHEN share_reset_date > CURRENT_DATE 
    THEN share_reset_date - CURRENT_DATE 
    ELSE 0 
  END as days_in_future
FROM profiles;

-- 2. Summary statistics
SELECT 
  '📊 SHARE_RESET_DATE ANALYSIS' as report_title,
  CURRENT_DATE as analysis_date;

SELECT 
  status,
  COUNT(*) as profile_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM share_date_analysis
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'FUTURE - Needs fix' THEN 1
    WHEN 'NULL - No date set' THEN 2
    WHEN 'TODAY - Correct' THEN 3
    WHEN 'PAST - OK' THEN 4
  END;

-- 3. Show sample of problematic entries (limit to 10 for safety)
SELECT 
  '🚨 SAMPLE OF PROFILES WITH FUTURE DATES' as section;

SELECT 
  email,
  share_reset_date,
  days_in_future || ' days in future' as issue,
  created_at::date as registered_date
FROM share_date_analysis
WHERE status = 'FUTURE - Needs fix'
ORDER BY days_in_future DESC
LIMIT 10;

-- 4. Check column definition
SELECT 
  '🔧 COLUMN DEFINITION CHECK' as section;

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  CASE 
    WHEN column_default LIKE '%interval%' THEN '⚠️  HAS INTERVAL IN DEFAULT'
    WHEN column_default IS NOT NULL THEN '✓ Has default'
    ELSE '✗ No default'
  END as default_check
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'share_reset_date';

-- 5. Check for triggers affecting this column
SELECT 
  '🔍 TRIGGER CHECK' as section;

SELECT 
  trigger_name,
  event_manipulation as trigger_event,
  action_timing as when_fired,
  action_statement as trigger_function
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles'
  AND (
    action_statement LIKE '%share_reset_date%'
    OR trigger_name LIKE '%share%'
    OR trigger_name LIKE '%reset%'
  );

-- 6. Analyze pattern of future dates
SELECT 
  '📈 FUTURE DATE PATTERN ANALYSIS' as section;

SELECT 
  share_reset_date,
  COUNT(*) as affected_profiles,
  MIN(created_at)::date as earliest_registration,
  MAX(created_at)::date as latest_registration
FROM profiles
WHERE share_reset_date > CURRENT_DATE
GROUP BY share_reset_date
ORDER BY share_reset_date;

-- 7. Test what the fix would do (without executing)
SELECT 
  '🔮 FIX PREVIEW' as section;

SELECT 
  'Would update ' || COUNT(*) || ' profiles' as fix_summary,
  'From future dates to: ' || CURRENT_DATE as new_value
FROM profiles
WHERE share_reset_date > CURRENT_DATE;

-- 8. Check if new registrations are still getting future dates
SELECT 
  '🆕 RECENT REGISTRATIONS CHECK' as section;

SELECT 
  email,
  created_at,
  share_reset_date,
  CASE 
    WHEN share_reset_date > created_at::date THEN '⚠️  Future date on registration!'
    ELSE '✓ OK'
  END as status
FROM profiles
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- 9. Generate fix verification query
SELECT 
  '📝 VERIFICATION QUERY FOR AFTER FIX' as section;

SELECT 
  'After running the fix, this count should be 0:' as instruction,
  COUNT(*) as profiles_with_future_dates
FROM profiles
WHERE share_reset_date > CURRENT_DATE;

-- 10. Summary and recommendations
SELECT 
  '💡 RECOMMENDATIONS' as section;

WITH issue_summary AS (
  SELECT 
    COUNT(CASE WHEN share_reset_date > CURRENT_DATE THEN 1 END) as future_count,
    COUNT(CASE WHEN share_reset_date IS NULL THEN 1 END) as null_count,
    COUNT(*) as total_count
  FROM profiles
)
SELECT 
  CASE 
    WHEN future_count > 0 THEN 
      '1. Run UPDATE to fix ' || future_count || ' profiles with future dates'
    ELSE 
      '1. No future dates found - no fix needed'
  END as recommendation_1,
  CASE 
    WHEN null_count > 0 THEN 
      '2. Consider setting default for ' || null_count || ' NULL values'
    ELSE 
      '2. No NULL values found'
  END as recommendation_2,
  '3. Check/fix column default in table definition' as recommendation_3,
  '4. Add constraint or trigger to prevent future dates' as recommendation_4
FROM issue_summary;

-- End of read-only diagnostic script