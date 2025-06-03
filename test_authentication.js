const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dxuabbcppncshcparsqd.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthentication() {
  console.log('🔐 Testing Authentication System')
  console.log('================================')

  try {
    // Test 1: Try to sign in with the provided credentials
    console.log('\n1. Testing Login with your credentials...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ LOGIN FAILED:', loginError.message)

      // Test 2: Try to check if user exists
      console.log('\n2. Checking if user account exists...')
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        'alex@propertytalents.com'
      )

      if (resetError) {
        console.log('❌ USER NOT FOUND:', resetError.message)
        console.log(
          '\n📝 RECOMMENDATION: User account does not exist. Need to create account first.'
        )
      } else {
        console.log('✅ USER EXISTS: Account found, but password may be incorrect')
      }
    } else {
      console.log('✅ LOGIN SUCCESSFUL!')
      console.log('User ID:', loginData.user?.id)
      console.log('Email:', loginData.user?.email)

      // Test 3: Check user profile
      console.log('\n3. Testing profile retrieval...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      if (profileError) {
        console.log('❌ PROFILE ERROR:', profileError.message)
      } else {
        console.log('✅ PROFILE FOUND:')
        console.log('  - Subscription:', profile.subscription_tier)
        console.log('  - Meal Count:', profile.meal_count)
        console.log('  - Monthly Shares:', profile.monthly_shares_used)
      }
    }

    // Test 4: Check database connection
    console.log('\n4. Testing database connection...')
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (dbError) {
      console.log('❌ DATABASE ERROR:', dbError.message)
    } else {
      console.log('✅ DATABASE CONNECTED: Found', dbTest, 'total profiles')
    }
  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error.message)
  }

  console.log('\n================================')
  console.log('🏁 Authentication Test Complete')
}

testAuthentication()
