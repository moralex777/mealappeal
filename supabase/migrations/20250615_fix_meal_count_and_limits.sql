-- Fix meal count tracking and enforce free tier limits for MealAppeal
-- This addresses the meal count trigger and daily limits for free users

-- Step 1: Fix the meal count trigger to use correct column mapping
DROP TRIGGER IF EXISTS tr_update_meal_count ON public.meals;
DROP FUNCTION IF EXISTS public.update_profile_meal_count();

-- Create corrected meal count trigger function
CREATE OR REPLACE FUNCTION public.update_profile_meal_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment meal count using correct column
    UPDATE public.profiles 
    SET meal_count = meal_count + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;  -- Fixed: use user_id = NEW.user_id
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement meal count using correct column
    UPDATE public.profiles 
    SET meal_count = GREATEST(0, meal_count - 1),
        updated_at = NOW()
    WHERE user_id = OLD.user_id;  -- Fixed: use user_id = OLD.user_id
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger with corrected function
CREATE TRIGGER tr_update_meal_count
AFTER INSERT OR DELETE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_meal_count();

-- Step 2: Create daily meal count function for free tier limits
CREATE OR REPLACE FUNCTION public.get_daily_meal_count(user_id UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.meals
    WHERE meals.user_id = $1
      AND DATE(meals.created_at) = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add performance index for daily queries
CREATE INDEX IF NOT EXISTS idx_meals_user_date_created 
ON public.meals(user_id, created_at);

-- Step 4: Create function to check if user can create meal (respects 3/day limit)
CREATE OR REPLACE FUNCTION public.can_user_create_meal(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER;
BEGIN
  -- Get user subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles 
  WHERE profiles.user_id = $1;
  
  -- Premium users have unlimited meals
  IF user_tier IN ('premium_monthly', 'premium_yearly') THEN
    RETURN TRUE;
  END IF;
  
  -- Free users limited to 3 meals per day
  SELECT public.get_daily_meal_count($1, CURRENT_DATE) INTO daily_count;
  
  RETURN daily_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Fix existing meal counts by recalculating them
CREATE OR REPLACE FUNCTION public.sync_all_meal_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles p
  SET meal_count = (
    SELECT COUNT(*)
    FROM public.meals m
    WHERE m.user_id = p.user_id  -- Fixed: use user_id = p.user_id
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync to fix current counts
SELECT public.sync_all_meal_counts();

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_daily_meal_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_create_meal TO authenticated;

-- Verify the fix
SELECT 'Meal count and limits fixed successfully' as status,
       COUNT(*) as profiles_synced
FROM public.profiles;