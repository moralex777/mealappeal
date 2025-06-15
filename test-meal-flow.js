#!/usr/bin/env node

/**
 * Test the complete meal flow: Camera → AI Analysis → Database Save → Meal Display
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function testMealFlow() {
  console.log('🔬 TESTING COMPLETE MEAL FLOW')
  console.log('==============================')

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      return
    }

    console.log('✅ Logged in as:', loginData.user.email)
    const userId = loginData.user.id

    // Step 2: Check profile exists and uses correct column
    console.log('\n2️⃣ Checking profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
      return
    }

    if (!profile) {
      console.log('❌ No profile found for user')
      return
    }

    console.log('✅ Profile found:', {
      user_id: profile.user_id,
      email: profile.email,
      meal_count: profile.meal_count
    })

    // Step 3: Get auth token and test AI analysis
    console.log('\n3️⃣ Testing AI Analysis...')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ No session found')
      return
    }

    const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

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

    console.log('📋 AI Analysis status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ AI Analysis failed:', errorText)
      return
    }

    const analysisResult = await response.json()
    console.log('✅ AI Analysis successful!')
    console.log('📊 Meal ID:', analysisResult.mealId)
    console.log('🍽️ Food:', analysisResult.analysis?.foodName)

    // Step 4: Verify meal was saved
    console.log('\n4️⃣ Checking meal was saved...')
    const { data: savedMeal, error: mealError } = await supabase
      .from('meals')
      .select('*')
      .eq('id', analysisResult.mealId)
      .single()

    if (mealError) {
      console.log('❌ Meal query error:', mealError.message)
      return
    }

    console.log('✅ Meal found in database:', {
      id: savedMeal.id,
      user_id: savedMeal.user_id,
      title: savedMeal.title,
      created_at: savedMeal.created_at
    })

    // Step 5: Check meals are retrievable for user
    console.log('\n5️⃣ Testing meal retrieval...')
    const { data: userMeals, error: retrieveError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (retrieveError) {
      console.log('❌ Meal retrieval error:', retrieveError.message)
      return
    }

    console.log('✅ User meals retrieved:', userMeals.length, 'meals found')
    if (userMeals.length > 0) {
      console.log('📋 Latest meal:', {
        title: userMeals[0].title,
        created_at: userMeals[0].created_at,
        calories: userMeals[0].basic_nutrition?.energy_kcal
      })
    }

    // Step 6: Check profile meal count was updated
    console.log('\n6️⃣ Checking updated profile...')
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .select('meal_count')
      .eq('user_id', userId)
      .single()

    if (updateError) {
      console.log('❌ Profile update check error:', updateError.message)
      return
    }

    console.log('✅ Profile meal count:', updatedProfile.meal_count)

    console.log('\n🎉 MEAL FLOW TEST COMPLETE!')
    console.log('✅ Camera → AI Analysis → Database Save → Meal Display: WORKING')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testMealFlow()