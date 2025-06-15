-- Fix meal count trigger to use correct column mapping
-- The trigger was using WHERE id = NEW.user_id instead of WHERE user_id = NEW.user_id

-- Drop and recreate the meal count trigger with correct column mapping
DROP TRIGGER IF EXISTS tr_update_meal_count ON public.meals;
DROP FUNCTION IF EXISTS public.update_profile_meal_count();

-- Create corrected function
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

-- Recreate trigger
CREATE TRIGGER tr_update_meal_count
AFTER INSERT OR DELETE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_meal_count();

-- Fix existing meal counts by recalculating them
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

-- Verify the fix
SELECT 'Meal count trigger fixed and synced' as status;