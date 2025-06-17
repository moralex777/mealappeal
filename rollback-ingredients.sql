-- Rollback script for ingredient saving feature
-- Use this ONLY if the ingredient saving causes issues in production

-- ============================================
-- ROLLBACK STEPS (Execute with caution)
-- ============================================

-- 1. First, backup any important data
-- This creates a temporary backup of meal_ingredients
CREATE TEMP TABLE meal_ingredients_backup AS 
SELECT * FROM meal_ingredients 
WHERE created_at > '2025-06-17';

-- 2. Show what would be affected
SELECT 
  'Data that would be removed:' as action,
  COUNT(*) as meal_ingredient_links,
  COUNT(DISTINCT meal_id) as affected_meals,
  COUNT(DISTINCT ingredient_id) as affected_ingredients,
  MIN(created_at) as earliest_entry,
  MAX(created_at) as latest_entry
FROM meal_ingredients
WHERE created_at > '2025-06-17';

-- 3. Remove recent meal_ingredient entries (uncomment to execute)
-- DELETE FROM meal_ingredients 
-- WHERE created_at > '2025-06-17'
-- AND meal_id IN (
--   SELECT id FROM meals 
--   WHERE created_at > '2025-06-17'
-- );

-- 4. Remove test ingredients (uncomment to execute)
-- DELETE FROM ingredients
-- WHERE name LIKE 'test-%'
-- OR created_at > '2025-06-17';

-- 5. If you need to restore the backup
-- INSERT INTO meal_ingredients 
-- SELECT * FROM meal_ingredients_backup;

-- 6. Verify rollback
SELECT 
  'Rollback verification:' as status,
  (SELECT COUNT(*) FROM meal_ingredients WHERE created_at > '2025-06-17') as remaining_links,
  (SELECT COUNT(*) FROM ingredients WHERE created_at > '2025-06-17') as remaining_ingredients;

-- ============================================
-- NOTES
-- ============================================
-- 1. This rollback does NOT remove the code changes
-- 2. To fully rollback, you would need to:
--    a) Run this SQL to clean data
--    b) Revert the code changes in analyze-food/route.ts
--    c) Redeploy the application
-- 3. Consider keeping the feature but fixing any issues instead