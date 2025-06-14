-- Create profile trigger to automatically create profile when user signs up
-- This is essential for the app to work with new user registrations

-- Function to create profile for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    subscription_tier,
    subscription_expires_at,
    billing_cycle,
    meal_count,
    monthly_shares_used,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'free',
    NULL,
    'free',
    0,
    0,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create the basic profiles table structure if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'premium_monthly', 'premium_yearly')) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'free')) DEFAULT 'free',
  meal_count INTEGER DEFAULT 0,
  monthly_shares_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON public.profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_billing_cycle ON public.profiles(billing_cycle);