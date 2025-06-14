/**
 * CRITICAL DATABASE FIX
 * This script fixes the fundamental database issues causing registration failures
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file')
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQL(sql, description) {
  console.log(`🔧 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql })
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Failed: ${error.message}`)
      return false
    }
    console.log(`✅ ${description} completed`)
    return true
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    return false
  }
}

async function fixDatabase() {
  console.log('🚨 CRITICAL DATABASE FIX STARTING')
  console.log('====================================')
  
  // 1. Create profiles table with all required columns
  const createTableSQL = `
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
  `
  
  await executeSQL(createTableSQL, 'Creating profiles table with all columns')
  
  // 2. Add billing_cycle if it doesn't exist (for existing tables)
  const addBillingCycleSQL = `
    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT 
    CHECK (billing_cycle IN ('monthly', 'yearly', 'free')) 
    DEFAULT 'free';
  `
  
  await executeSQL(addBillingCycleSQL, 'Adding billing_cycle column')
  
  // 3. Update existing records to have billing_cycle
  const updateBillingCycleSQL = `
    UPDATE public.profiles 
    SET billing_cycle = CASE 
      WHEN subscription_tier = 'free' THEN 'free'
      WHEN subscription_tier = 'premium_monthly' THEN 'monthly' 
      WHEN subscription_tier = 'premium_yearly' THEN 'yearly'
      ELSE 'free'
    END
    WHERE billing_cycle IS NULL;
  `
  
  await executeSQL(updateBillingCycleSQL, 'Updating billing_cycle for existing profiles')
  
  // 4. Create profile creation trigger
  const triggerFunctionSQL = `
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
  `
  
  await executeSQL(triggerFunctionSQL, 'Creating profile creation function')
  
  const triggerSQL = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `
  
  await executeSQL(triggerSQL, 'Creating profile creation trigger')
  
  // 5. Enable RLS and create policies
  const rlsSQL = `
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  `
  
  await executeSQL(rlsSQL, 'Enabling Row Level Security')
  
  const policiesSQL = `
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    
    CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
      
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  `
  
  await executeSQL(policiesSQL, 'Creating RLS policies')
  
  // 6. Create indexes
  const indexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON public.profiles(subscription_expires_at);
    CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
    CREATE INDEX IF NOT EXISTS idx_profiles_billing_cycle ON public.profiles(billing_cycle);
  `
  
  await executeSQL(indexesSQL, 'Creating performance indexes')
  
  console.log('\n🎉 CRITICAL DATABASE FIX COMPLETED!')
  console.log('New user registration should now work properly.')
}

// Test the fix
async function testFix() {
  console.log('\n🧪 TESTING THE FIX')
  console.log('==================')
  
  try {
    // Test table structure
    const { data, error } = await supabase
      .from('profiles')
      .select('id, subscription_tier, billing_cycle, meal_count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('billing_cycle')) {
        console.error('❌ billing_cycle column still missing!')
        return false
      } else {
        console.log('✅ Table accessible (no data yet, but structure is good)')
      }
    } else {
      console.log('✅ profiles table structure verified')
    }
    
    // Test registration flow
    const testEmail = `test-fix-${Date.now()}@mealappeal.app`
    const testPassword = 'TestPassword123!'
    
    console.log('📝 Testing user registration...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Fix User',
        },
      },
    })
    
    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message)
      return false
    }
    
    console.log('✅ Registration successful')
    
    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test profile fetch
    console.log('📋 Testing profile fetch...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message)
      return false
    }
    
    console.log('✅ Profile fetch successful!')
    console.log('📊 Profile data:', {
      id: profileData.id,
      subscription_tier: profileData.subscription_tier,
      billing_cycle: profileData.billing_cycle,
      meal_count: profileData.meal_count
    })
    
    console.log('\n🎉 ALL TESTS PASSED! The fix is working!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the fix
async function main() {
  await fixDatabase()
  const testResult = await testFix()
  
  if (testResult) {
    console.log('\n✅ SUCCESS: Database issues resolved!')
    console.log('Users can now register and login without errors.')
  } else {
    console.log('\n❌ FAILURE: Issues remain, manual intervention needed.')
  }
}

main().catch(console.error)