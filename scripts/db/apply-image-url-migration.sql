-- Migration to fix image truncation issue
-- Run this in Supabase SQL Editor

-- Step 1: Check current column type
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'meals'
    AND column_name = 'image_url';

-- Step 2: Alter the column to TEXT type (removes 50000 char limit)
ALTER TABLE public.meals 
ALTER COLUMN image_url TYPE TEXT;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.meals.image_url IS 'Base64-encoded image data or URL. Changed from VARCHAR(50000) to TEXT to support full image storage.';

-- Step 4: Verify the change
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'meals'
    AND column_name = 'image_url';

-- Step 5: Check how many meals are affected by truncation
SELECT 
    COUNT(*) as total_meals,
    COUNT(CASE WHEN LENGTH(image_url) = 50000 THEN 1 END) as truncated_meals,
    COUNT(CASE WHEN LENGTH(image_url) < 50000 THEN 1 END) as normal_meals
FROM public.meals
WHERE image_url IS NOT NULL;