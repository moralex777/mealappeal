-- Database Verification Queries for Ingredient Tracking
-- Run these in Supabase SQL Editor to verify the feature is working

-- ============================================
-- 1. CHECK RECENT INGREDIENT ACTIVITY
-- ============================================
SELECT 
  '📊 INGREDIENT TRACKING VERIFICATION' as report_title,
  NOW() as report_time;

-- Check if any ingredients were saved recently
SELECT 
  COUNT(*) as ingredients_last_hour,
  COUNT(DISTINCT name) as unique_ingredients,
  MAX(created_at) as most_recent_ingredient
FROM ingredients
WHERE created_at > NOW() - INTERVAL '1 hour';

-- ============================================
-- 2. RECENT INGREDIENTS LIST
-- ============================================
SELECT 
  '🥗 Recent Ingredients (Last 24h)' as section;

SELECT 
  i.id,
  i.name,
  i.created_at,
  COUNT(mi.meal_id) as used_in_meals
FROM ingredients i
LEFT JOIN meal_ingredients mi ON i.id = mi.ingredient_id
WHERE i.created_at > NOW() - INTERVAL '24 hours'
GROUP BY i.id, i.name, i.created_at
ORDER BY i.created_at DESC
LIMIT 20;

-- ============================================
-- 3. MEALS WITH INGREDIENTS
-- ============================================
SELECT 
  '🍽️ Recent Meals with Ingredients' as section;

SELECT 
  m.id,
  m.title,
  m.created_at,
  COUNT(mi.ingredient_id) as ingredient_count,
  STRING_AGG(i.name, ', ' ORDER BY i.name) as ingredients_list
FROM meals m
LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.created_at > NOW() - INTERVAL '24 hours'
GROUP BY m.id, m.title, m.created_at
ORDER BY m.created_at DESC
LIMIT 10;

-- ============================================
-- 4. INGREDIENT NORMALIZATION CHECK
-- ============================================
SELECT 
  '🔍 Ingredient Normalization Check' as section;

-- Check if ingredients are properly normalized (lowercase)
SELECT 
  name,
  CASE 
    WHEN name = LOWER(name) THEN '✅ Normalized'
    ELSE '❌ Not normalized - contains uppercase'
  END as normalization_status
FROM ingredients
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND name != LOWER(name)
LIMIT 10;

-- ============================================
-- 5. DUPLICATE DETECTION
-- ============================================
SELECT 
  '🔄 Duplicate Ingredient Check' as section;

-- Find potential duplicates (similar names)
SELECT 
  name,
  COUNT(*) as occurrence_count
FROM ingredients
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================
-- 6. ORPHANED INGREDIENTS
-- ============================================
SELECT 
  '⚠️ Orphaned Ingredients (not linked to any meal)' as section;

SELECT 
  i.id,
  i.name,
  i.created_at,
  'No meals linked' as status
FROM ingredients i
LEFT JOIN meal_ingredients mi ON i.id = mi.ingredient_id
WHERE mi.meal_id IS NULL
  AND i.created_at < NOW() - INTERVAL '1 hour'
ORDER BY i.created_at DESC
LIMIT 10;

-- ============================================
-- 7. MEAL-INGREDIENT RELATIONSHIP INTEGRITY
-- ============================================
SELECT 
  '🔗 Relationship Integrity Check' as section;

-- Check for broken relationships
SELECT 
  COUNT(*) as total_relationships,
  COUNT(CASE WHEN m.id IS NULL THEN 1 END) as missing_meals,
  COUNT(CASE WHEN i.id IS NULL THEN 1 END) as missing_ingredients
FROM meal_ingredients mi
LEFT JOIN meals m ON mi.meal_id = m.id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id;

-- ============================================
-- 8. PERFORMANCE METRICS
-- ============================================
SELECT 
  '⚡ Performance Metrics' as section;

-- Average ingredients per meal
SELECT 
  AVG(ingredient_count)::numeric(10,2) as avg_ingredients_per_meal,
  MIN(ingredient_count) as min_ingredients,
  MAX(ingredient_count) as max_ingredients
FROM (
  SELECT 
    m.id,
    COUNT(mi.ingredient_id) as ingredient_count
  FROM meals m
  LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id
  WHERE m.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY m.id
) as meal_stats;

-- ============================================
-- 9. SHARE_RESET_DATE VERIFICATION
-- ============================================
SELECT 
  '📅 Share Reset Date Check' as section;

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN share_reset_date > CURRENT_DATE THEN 1 END) as future_dates,
  COUNT(CASE WHEN share_reset_date = CURRENT_DATE THEN 1 END) as today_dates,
  COUNT(CASE WHEN share_reset_date IS NULL THEN 1 END) as null_dates
FROM profiles;

-- ============================================
-- 10. SUMMARY REPORT
-- ============================================
SELECT 
  '📈 Summary Report' as section;

WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM ingredients WHERE created_at > NOW() - INTERVAL '24 hours') as new_ingredients_24h,
    (SELECT COUNT(*) FROM meal_ingredients WHERE created_at > NOW() - INTERVAL '24 hours') as new_relationships_24h,
    (SELECT COUNT(*) FROM meals WHERE created_at > NOW() - INTERVAL '24 hours') as new_meals_24h,
    (SELECT COUNT(*) FROM profiles WHERE share_reset_date > CURRENT_DATE) as profiles_need_date_fix
)
SELECT 
  CASE 
    WHEN new_ingredients_24h > 0 THEN '✅ Ingredients are being saved'
    ELSE '❌ No ingredients saved in last 24h'
  END as ingredient_status,
  CASE 
    WHEN new_relationships_24h > 0 THEN '✅ Meal-ingredient links working'
    ELSE '❌ No relationships created in last 24h'
  END as relationship_status,
  CASE 
    WHEN profiles_need_date_fix = 0 THEN '✅ No date issues found'
    ELSE '⚠️ ' || profiles_need_date_fix || ' profiles need date fix'
  END as date_fix_status,
  new_meals_24h || ' new meals in last 24h' as meal_activity
FROM stats;