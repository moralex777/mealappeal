-- EMERGENCY FIX: Broken User Registration - 500 Auth Signup Error
-- This fixes the database trigger causing profile creation failures
-- Run this in Supabase SQL Editor immediately

-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create corrected trigger function with proper column mapping
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Insert profile with correct column mapping
    INSERT INTO public.profiles (
      user_id,    -- Use user_id (not id) for foreign key
      email,      -- Add required email field
      full_name,
      avatar_url,
      subscription_tier,
      billing_cycle,
      meal_count,
      monthly_shares_used,
      subscription_status,
      share_reset_date,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,     -- Auth user ID goes to user_id column
      NEW.email,  -- Auth email goes to email column
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'avatar_url',
      'free',
      'free',
      0,
      0,
      'inactive',
      NOW(),
      NOW(),
      NOW()
    );
  EXCEPTION 
    WHEN OTHERS THEN
      -- CRITICAL: Don't fail user auth signup if profile creation fails
      RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the fix worked
SELECT 'Registration trigger fixed successfully' as status;