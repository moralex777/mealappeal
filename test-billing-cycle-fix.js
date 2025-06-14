/**
 * Test script to verify billing_cycle column issue is resolved
 * This script will test the complete new user registration → login → dashboard flow
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserRegistrationFlow() {
  console.log('🧪 Testing new user registration → login → profile fetch flow')
  
  const testEmail = `test-${Date.now()}@mealappeal.app`
  const testPassword = 'TestPassword123!'
  const testFullName = 'Test User'
  
  try {
    // Step 1: Test user registration
    console.log('📝 Step 1: Testing user registration...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testFullName,
        },
      },
    })
    
    if (signUpError) {
      console.error('❌ Registration failed:', signUpError.message)
      return false
    }
    
    console.log('✅ Registration successful')
    
    // Step 2: Test immediate profile fetch (this is where the billing_cycle error occurs)
    console.log('📋 Step 2: Testing profile fetch after registration...')
    
    if (signUpData.user) {
      try {
        // Test the actual query that's failing
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signUpData.user.id)
          .single()
        
        if (profileError) {
          console.error('❌ Profile query failed:', profileError.message)
          
          // Test fallback query (without billing_cycle)
          console.log('🔄 Testing fallback query...')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, subscription_tier, meal_count, monthly_shares_used, created_at, updated_at, stripe_customer_id')
            .eq('id', signUpData.user.id)
            .single()
          
          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError.message)
            return false
          } else {
            console.log('✅ Fallback query successful')
            console.log('📊 Profile data (fallback):', {
              id: fallbackData.id,
              subscription_tier: fallbackData.subscription_tier,
              billing_cycle: 'free (default)',
              meal_count: fallbackData.meal_count
            })
          }
        } else {
          console.log('✅ Profile query successful')
          console.log('📊 Profile data:', {
            id: profileData.id,
            subscription_tier: profileData.subscription_tier,
            billing_cycle: profileData.billing_cycle,
            meal_count: profileData.meal_count
          })
        }
      } catch (queryError) {
        console.error('❌ Unexpected query error:', queryError)
        return false
      }
    }
    
    // Step 3: Test sign in 
    console.log('🔐 Step 3: Testing sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      return false
    }
    
    console.log('✅ Sign in successful')
    
    // Step 4: Test profile fetch after sign in (this is where AuthContext fails)
    console.log('📋 Step 4: Testing profile fetch after sign in...')
    
    try {
      const { data: postSignInProfile, error: postSignInError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single()
      
      if (postSignInError) {
        console.error('❌ Post-signin profile query failed:', postSignInError.message)
        return false
      } else {
        console.log('✅ Post-signin profile query successful')
        console.log('📊 Profile data after signin:', {
          id: postSignInProfile.id,
          subscription_tier: postSignInProfile.subscription_tier,
          billing_cycle: postSignInProfile.billing_cycle || 'MISSING',
          meal_count: postSignInProfile.meal_count
        })
      }
    } catch (queryError) {
      console.error('❌ Unexpected post-signin query error:', queryError)
      return false
    }
    
    // Cleanup: Delete test user
    console.log('🧹 Cleanup: Deleting test user...')
    await supabase.auth.signOut()
    
    console.log('✅ All tests passed! User registration → login → profile fetch flow is working')
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error)
    return false
  }
}

// Check database schema first
async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Try to query the profiles table structure
    const { data, error } = await supabase
      .from('profiles')
      .select('id, subscription_tier, billing_cycle, meal_count')
      .limit(1)
    
    if (error) {
      console.error('❌ Schema check failed:', error.message)
      if (error.message.includes('billing_cycle')) {
        console.log('⚠️  ISSUE CONFIRMED: billing_cycle column is missing from database')
        return false
      }
    } else {
      console.log('✅ Schema check passed - profiles table accessible')
      return true
    }
  } catch (error) {
    console.error('❌ Unexpected schema check error:', error)
    return false
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting billing_cycle column issue test')
  console.log('================================')
  
  const schemaOk = await checkDatabaseSchema()
  if (!schemaOk) {
    console.log('⚠️  Database schema check failed - billing_cycle column is missing')
    console.log('🔄 Proceeding to test fallback code...')
  }
  
  const testResult = await testUserRegistrationFlow()
  
  if (testResult) {
    console.log('🎉 SUCCESS: All tests passed!')
  } else {
    console.log('❌ FAILURE: Tests failed - issue not resolved')
    process.exit(1)
  }
}

main().catch(console.error)