-- Update subscription tier enum to support three tiers
-- Add missing subscription fields for billing cycle and expiration

-- First, add the new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly', 'free'));

-- Update the subscription_tier check constraint to include the three required tiers
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check
CHECK (subscription_tier IN ('free', 'premium_monthly', 'premium_yearly'));

-- Set default values for existing records
UPDATE public.profiles
SET
  billing_cycle = 'free',
  subscription_expires_at = NULL
WHERE subscription_tier = 'free';

UPDATE public.profiles
SET
  billing_cycle = 'monthly',
  subscription_expires_at = NOW() + INTERVAL '1 month'
WHERE subscription_tier = 'premium';

-- Update existing premium users to premium_monthly (we can adjust this manually later if needed)
UPDATE public.profiles
SET subscription_tier = 'premium_monthly'
WHERE subscription_tier = 'premium';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON public.profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Function to check if user has active premium subscription
CREATE OR REPLACE FUNCTION public.has_active_premium(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND subscription_tier IN ('premium_monthly', 'premium_yearly')
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(user_id uuid)
RETURNS text AS $$
DECLARE
  tier text;
  expires_at timestamptz;
BEGIN
  SELECT subscription_tier, subscription_expires_at
  INTO tier, expires_at
  FROM public.profiles
  WHERE id = user_id;

  -- If subscription has expired, downgrade to free
  IF tier IN ('premium_monthly', 'premium_yearly') AND expires_at IS NOT NULL AND expires_at < NOW() THEN
    UPDATE public.profiles
    SET subscription_tier = 'free', billing_cycle = 'free'
    WHERE id = user_id;
    RETURN 'free';
  END IF;

  RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
