-- 🔍 MEALAPPEAL DATABASE DEBUG & OPTIMIZATION TOOLKIT
-- Comprehensive SQL queries to diagnose and fix critical database issues

-- =============================================================================
-- 📊 SECTION 1: DATABASE HEALTH CHECK QUERIES
-- =============================================================================

-- 🔍 1.1: Check Current Database Schema
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('meals', 'profiles')
ORDER BY table_name, ordinal_position;

-- 🔍 1.2: Count Users by Subscription Tier
SELECT
    subscription_tier,
    COUNT(*) as user_count,
    COUNT(CASE WHEN meal_count > 0 THEN 1 END) as users_with_meals
FROM profiles
GROUP BY subscription_tier;

-- 🔍 1.3: Meals Data Completeness Analysis
SELECT
    COUNT(*) as total_meals,
    COUNT(CASE WHEN analysis IS NOT NULL THEN 1 END) as meals_with_analysis,
    COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as meals_with_images,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_meals,
    COUNT(CASE WHEN shared = true THEN 1 END) as shared_meals
FROM meals;

-- 🔍 1.4: User-Meal Relationship Integrity Check
SELECT
    p.id as profile_id,
    p.meal_count as recorded_count,
    COUNT(m.id) as actual_count,
    CASE
        WHEN p.meal_count = COUNT(m.id) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as integrity_status
FROM profiles p
LEFT JOIN meals m ON p.id = m.user_id AND m.deleted_at IS NULL
GROUP BY p.id, p.meal_count
HAVING p.meal_count != COUNT(m.id)
ORDER BY ABS(p.meal_count - COUNT(m.id)) DESC;

-- =============================================================================
-- 📝 SECTION 2: ROW LEVEL SECURITY (RLS) POLICY ANALYSIS
-- =============================================================================

-- 🔍 2.1: Check Current RLS Policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('meals', 'profiles');

-- 🔍 2.2: Test RLS Policy Effectiveness (Run as authenticated user)
-- This query will fail if RLS is working correctly when run without proper auth
SELECT COUNT(*) as accessible_meals FROM meals;
SELECT COUNT(*) as accessible_profiles FROM profiles;

-- =============================================================================
-- 🛠️ SECTION 3: CRITICAL SCHEMA FIXES
-- =============================================================================

-- 🚨 3.1: ADD MISSING COLUMNS TO MEALS TABLE
-- These columns are referenced in the code but don't exist in current schema

ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS scheduled_deletion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS basic_nutrition JSONB,
ADD COLUMN IF NOT EXISTS premium_nutrition JSONB,
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS meal_tags TEXT[],
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS protein NUMERIC,
ADD COLUMN IF NOT EXISTS carbs NUMERIC,
ADD COLUMN IF NOT EXISTS fat NUMERIC;

-- 🚨 3.2: UPDATE DATABASE TYPES COMPATIBILITY
-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_meals_user_id_created_at ON public.meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_scheduled_deletion ON public.meals(scheduled_deletion_date) WHERE scheduled_deletion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meals_is_public ON public.meals(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- 🚨 3.3: CREATE PROPER RLS POLICIES
-- Enable RLS on tables
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Meals table policies
DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
DROP POLICY IF EXISTS "Public meals are viewable by all" ON public.meals;

CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- =============================================================================
-- 🧪 SECTION 4: TEST DATA INSERTION
-- =============================================================================

-- 🧪 4.1: Test Meal Insertion with Full Schema
-- Replace 'your-user-id-here' with actual user ID for testing
/*
INSERT INTO public.meals (
    user_id,
    title,
    description,
    image_url,
    image_path,
    analysis,
    focus,
    shared,
    ai_confidence_score,
    processing_status,
    scheduled_deletion_date,
    is_public,
    basic_nutrition,
    premium_nutrition,
    health_score,
    meal_tags,
    name,
    calories,
    protein,
    carbs,
    fat
) VALUES (
    'your-user-id-here',
    'Test Healthy Bowl',
    'Health & Wellness Analysis: Amazing superfood bowl!',
    'data:image/jpeg;base64,test-image-data',
    'meals/test/test.jpg',
    '{"foodName": "Healthy Bowl", "confidence": 0.95}',
    'health_wellness',
    false,
    0.95,
    'completed',
    NOW() + INTERVAL '14 days',
    false,
    '{"energy_kcal": 350, "protein_g": 15, "carbs_g": 45, "fat_g": 12}',
    '{"fiber_g": 8, "sodium_mg": 320, "sugar_g": 6}',
    9,
    ARRAY['healthy', 'bowl', 'nutritious'],
    'Healthy Bowl',
    350,
    15,
    45,
    12
);
*/

-- =============================================================================
-- 🔧 SECTION 5: PERFORMANCE OPTIMIZATION QUERIES
-- =============================================================================

-- 🔧 5.1: Analyze Query Performance
EXPLAIN ANALYZE
SELECT
    id, user_id, created_at, image_url, name, calories, protein, carbs, fat, scheduled_deletion_date
FROM meals
WHERE user_id = 'test-user-id'
    AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 🔧 5.2: Check Index Usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('meals', 'profiles')
ORDER BY idx_scan DESC;

-- 🔧 5.3: Database Size Analysis
SELECT
    pg_size_pretty(pg_total_relation_size('public.meals')) as meals_table_size,
    pg_size_pretty(pg_total_relation_size('public.profiles')) as profiles_table_size,
    (SELECT COUNT(*) FROM meals) as total_meals,
    (SELECT COUNT(*) FROM profiles) as total_profiles;

-- =============================================================================
-- 🧹 SECTION 6: DATA CLEANUP AND MAINTENANCE
-- =============================================================================

-- 🧹 6.1: Clean Up Expired Meals (Free Tier)
-- Soft delete meals that have passed their scheduled deletion date
UPDATE public.meals
SET deleted_at = NOW()
WHERE scheduled_deletion_date < NOW()
    AND deleted_at IS NULL
    AND user_id IN (
        SELECT id FROM profiles WHERE subscription_tier = 'free'
    );

-- 🧹 6.2: Sync Meal Counts (Fix data integrity)
UPDATE public.profiles p
SET meal_count = (
    SELECT COUNT(*)
    FROM public.meals m
    WHERE m.user_id = p.id AND m.deleted_at IS NULL
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM public.meals m
    WHERE m.user_id = p.id
);

-- 🧹 6.3: Remove Orphaned Data
-- Find meals without corresponding users
SELECT m.id, m.user_id, m.created_at
FROM meals m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE p.id IS NULL;

-- =============================================================================
-- 📈 SECTION 7: ANALYTICS AND MONITORING QUERIES
-- =============================================================================

-- 📈 7.1: User Engagement Analytics
SELECT
    DATE(created_at) as date,
    COUNT(*) as meals_created,
    COUNT(DISTINCT user_id) as active_users,
    AVG(health_score) as avg_health_score
FROM meals
WHERE created_at >= NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 📈 7.2: Subscription Conversion Tracking
SELECT
    subscription_tier,
    COUNT(*) as users,
    AVG(meal_count) as avg_meals_per_user,
    AVG(monthly_shares_used) as avg_shares_used,
    COUNT(CASE WHEN meal_count > 10 THEN 1 END) as power_users
FROM profiles
GROUP BY subscription_tier;

-- 📈 7.3: Storage Usage Analytics
SELECT
    subscription_tier,
    COUNT(CASE WHEN scheduled_deletion_date IS NOT NULL THEN 1 END) as expiring_meals,
    COUNT(CASE WHEN scheduled_deletion_date < NOW() + INTERVAL '3 days' THEN 1 END) as expiring_soon,
    AVG(EXTRACT(EPOCH FROM (scheduled_deletion_date - created_at))/86400) as avg_storage_days
FROM meals m
JOIN profiles p ON m.user_id = p.id
WHERE m.deleted_at IS NULL
GROUP BY subscription_tier;

-- =============================================================================
-- 🎯 SECTION 8: DEBUGGING SPECIFIC ISSUES
-- =============================================================================

-- 🎯 8.1: Debug Analyze-Food API Insert Failures
-- Check what happens when we try to insert with the API's current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meals'
    AND column_name IN (
        'title', 'description', 'image_path', 'ai_confidence_score',
        'processing_status', 'basic_nutrition', 'premium_nutrition',
        'health_score', 'meal_tags', 'name', 'calories', 'protein', 'carbs', 'fat'
    );

-- 🎯 8.2: Debug Meals Page Query Issues
-- Check what columns are actually available for the meals page query
SELECT
    'Available Columns:' as info,
    string_agg(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns
WHERE table_name = 'meals';

-- 🎯 8.3: Test Authentication and RLS
-- This should return data only for the authenticated user
SELECT
    current_user as db_user,
    auth.uid() as auth_user_id,
    COUNT(*) as accessible_meals
FROM meals;
