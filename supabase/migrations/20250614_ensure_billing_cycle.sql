-- Ensure billing_cycle column exists in profiles table
-- This is a safety migration in case the previous migration didn't run properly

-- Add billing_cycle column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'billing_cycle'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'free')) DEFAULT 'free';
        
        -- Set default values for existing records
        UPDATE public.profiles 
        SET billing_cycle = 'free' 
        WHERE billing_cycle IS NULL;
        
        RAISE NOTICE 'Added billing_cycle column to profiles table';
    ELSE
        RAISE NOTICE 'billing_cycle column already exists in profiles table';
    END IF;
END $$;

-- Ensure subscription_expires_at column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_expires_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_expires_at timestamptz;
        
        RAISE NOTICE 'Added subscription_expires_at column to profiles table';
    ELSE
        RAISE NOTICE 'subscription_expires_at column already exists in profiles table';
    END IF;
END $$;

-- Update billing_cycle based on subscription_tier for consistency
UPDATE public.profiles 
SET billing_cycle = CASE 
    WHEN subscription_tier = 'free' THEN 'free'
    WHEN subscription_tier = 'premium_monthly' THEN 'monthly' 
    WHEN subscription_tier = 'premium_yearly' THEN 'yearly'
    ELSE 'free'
END
WHERE billing_cycle IS NULL OR billing_cycle = '';