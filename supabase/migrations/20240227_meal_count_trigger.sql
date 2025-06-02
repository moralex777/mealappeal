-- Create function to update meal count
CREATE OR REPLACE FUNCTION public.update_profile_meal_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment meal count
    UPDATE public.profiles 
    SET meal_count = meal_count + 1,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement meal count
    UPDATE public.profiles 
    SET meal_count = GREATEST(0, meal_count - 1),
        updated_at = NOW()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tr_update_meal_count ON public.meals;

-- Create trigger for meal count updates
CREATE TRIGGER tr_update_meal_count
AFTER INSERT OR DELETE ON public.meals
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_meal_count();

-- Function to sync meal counts (one-time fix for existing data)
CREATE OR REPLACE FUNCTION public.sync_all_meal_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles p
  SET meal_count = (
    SELECT COUNT(*)
    FROM public.meals m
    WHERE m.user_id = p.id
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync function to fix existing data
SELECT public.sync_all_meal_counts(); 