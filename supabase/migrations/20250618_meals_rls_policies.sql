-- Row Level Security (RLS) Policies for meals table
-- This file documents the recommended RLS policies for the meals table
-- Run these commands in Supabase SQL Editor to set up proper security

-- 1. First, ensure RLS is enabled on the meals table
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (optional - be careful in production)
-- DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
-- DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
-- DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
-- DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;

-- 3. Create policy: Users can only view their own meals
CREATE POLICY "Users can view own meals" 
ON public.meals
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Create policy: Users can only insert meals for themselves
CREATE POLICY "Users can insert own meals" 
ON public.meals
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Create policy: Users can only update their own meals
CREATE POLICY "Users can update own meals" 
ON public.meals
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create policy: Users can only delete their own meals
CREATE POLICY "Users can delete own meals" 
ON public.meals
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Optional: Service role bypass (automatically works with service role key)
-- Service role key automatically bypasses RLS, no policy needed

-- 8. Verify policies are working
-- After running these commands, test with:
-- - npm run debug:login (should only see user's own meals)
-- - npm run scripts/db/diagnose-user-meals.js user@example.com

-- Query to check current policies:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'meals'
ORDER BY policyname;
*/

-- Query to check if RLS is enabled:
/*
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'meals';
*/