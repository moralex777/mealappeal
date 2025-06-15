#!/usr/bin/env node

/**
 * Test free tier daily limits: 3 meals allowed, 4th should be blocked
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function testFreeTierLimits() {
  console.log('🧪 TESTING FREE TIER DAILY LIMITS')
  console.log('==================================')

  try {
    // Login as test user
    console.log('1️⃣ Logging in as free tier user...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'freetier-test@propertytalents.com',
      password: 'Test.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      return
    }

    console.log('✅ Logged in as:', loginData.user.email)
    const { data: { session } } = await supabase.auth.getSession()

    // Check profile tier
    console.log('\n2️⃣ Checking user profile...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, meal_count')
      .eq('user_id', loginData.user.id)
      .single()

    console.log('📊 Profile:', {
      tier: profile?.subscription_tier,
      total_meals: profile?.meal_count
    })

    // Check today's meal count
    const { data: todayMeals } = await supabase
      .from('meals')
      .select('id, title, created_at')
      .eq('user_id', loginData.user.id)
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    console.log('📅 Today\'s meals:', todayMeals?.length || 0)

    const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

    // Test up to 4 meals (3 should work, 4th should fail)
    for (let i = 1; i <= 4; i++) {
      console.log(`\n${i}️⃣ Testing meal #${i}...`)
      
      const response = await fetch('http://localhost:3002/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          imageDataUrl: testImageDataUrl,
          focusMode: 'health'
        })
      })

      console.log(`📋 Response status: ${response.status}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Meal #${i} ALLOWED:`, result.analysis?.foodName)
      } else {
        const error = await response.text()
        console.log(`❌ Meal #${i} BLOCKED:`, error.substring(0, 100))
        
        if (i === 4) {
          console.log('\n🎉 SUCCESS: 4th meal correctly blocked!')
          console.log('✅ Free tier limit (3/day) working properly')
        }
        break
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n📊 FINAL TEST RESULTS:')
    const { data: finalMeals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', loginData.user.id)
      .gte('created_at', new Date().toISOString().split('T')[0])

    console.log(`📅 Today's total meals: ${finalMeals?.length || 0}`)
    console.log(`🎯 Expected: 3 (free tier limit)`)
    console.log(`✅ Test result: ${finalMeals?.length === 3 ? 'PASSED' : 'FAILED'}`)

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testFreeTierLimits()